// Bounds: pure JS/PowerShell acquisition on explicit birth identities and executed
// mutations. No census, launch/termination policy or live cleanup certification.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { isOwnedDescendant } from './process-ownership.mjs';
const root = { id: 100, parent: 1, creation: '2026-09-30T19:58:29.4610960Z' };
const parent = { id: 200, parent: 100, creation: '2026-09-30T20:00:45.7428870Z' };
const child = { id: 300, parent: 200, creation: '2026-09-30T20:01:00.0000000Z' };
const vector = (name, expected, changes = {}) => ({ name, expected, child, liveParent: parent, recordedParent: parent, taskRoot: root, ...changes });
const vectors = [
  vector('valid-descendant', true), vector('valid-direct-child', true, { child: { ...child, parent: 100 }, liveParent: root, recordedParent: root }),
  vector('equivalent-offset-parent', true, { liveParent: { ...parent, creation: '2026-09-30T13:00:45.7428870-07:00' } }),
  vector('same-birth-tick', true, { child: { ...child, creation: parent.creation } }),
  vector('old-installer-earlier-than-root-and-parent', false, { child: { ...child, creation: '2026-09-30T16:47:31.0155910Z' } }),
  vector('child-one-tick-before-parent', false, { child: { ...child, creation: '2026-09-30T20:00:45.7428869Z' } }),
  vector('parent-and-child-before-task-root', false, { child: { ...child, creation: '2026-09-30T19:58:00Z' }, liveParent: { ...parent, creation: '2026-09-30T19:57:00Z' }, recordedParent: { ...parent, creation: '2026-09-30T19:57:00Z' } }),
  vector('absent-live-parent', false, { liveParent: null }),
  vector('reused-live-parent', false, { liveParent: { ...parent, creation: '2026-09-30T20:00:46Z' } }),
  vector('reused-parent-one-tick', false, { liveParent: { ...parent, creation: '2026-09-30T20:00:45.7428871Z' } }),
  vector('wrong-live-parent-pid', false, { liveParent: { ...parent, id: 201 } }),
  vector('root-is-not-its-descendant', false, { child: { ...child, id: 100 } }),
  vector('missing-task-root', false, { taskRoot: null }),
  vector('invalid-calendar-birth', false, { child: { ...child, creation: '2026-02-30T20:01:00Z' } }),
  vector('ambiguous-zone', false, { child: { ...child, creation: '2026-09-30T20:01:00' } }),
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const output = process.env.PROCESS_OWNERSHIP_OUT || 'output/process-ownership';
const report = { pass: false, bound: 'Pure JS and actual PowerShell consumer, 100 ns UTC identities; no live census or process stops', vectors, cases: [], controls: [] };
await mkdir(output, { recursive: true });
try {
  const before = JSON.stringify(vectors), moduleSource = await readFile('scripts/process-ownership.mjs', 'utf8');
  report.sourceHashes = Object.fromEntries(await Promise.all(['scripts/process-ownership.mjs', 'scripts/process-ownership.ps1', 'scripts/check-process-ownership.mjs'].map(async path => [path, hash(await readFile(path))])));
  for (const fixture of vectors) { const actual = isOwnedDescendant(fixture.child, fixture.liveParent, fixture.recordedParent, fixture.taskRoot); assert.equal(actual, fixture.expected, fixture.name); report.cases.push({ name: fixture.name, consumer: 'javascript', actual, expected: fixture.expected }); }
  const psMutations = [
    ['old-utc-wall-tick-rule', 'if ($childBirth -lt $rootBirth -or $childBirth -lt $parentBirth -or $parentBirth -lt $rootBirth) { return $false }', 'if ($childBirth -lt ($rootBirth - 252000000000) -or $childBirth -lt ($parentBirth - 252000000000) -or $parentBirth -lt $rootBirth) { return $false }', 'old-installer-earlier-than-root-and-parent'],
    ['absent-parent-trusted-from-cache', 'if (-not $Child -or -not $LiveParent -or -not $RecordedParent -or -not $TaskRoot) { return $false }', 'if (-not $Child -or -not $RecordedParent -or -not $TaskRoot) { return $false }; if (-not $LiveParent) { $LiveParent = $RecordedParent }', 'absent-live-parent'],
    ['reused-parent-birth-check-omitted', 'if ($parentBirth -ne $recordedBirth) { return $false }', '', 'reused-live-parent'],
    ['task-root-bound-omitted', 'if ($childBirth -lt $rootBirth -or $childBirth -lt $parentBirth -or $parentBirth -lt $rootBirth) { return $false }', 'if ($childBirth -lt $parentBirth) { return $false }', 'parent-and-child-before-task-root'],
    ['timestamp-truncated-to-milliseconds', '$births += $parsed.UtcTicks', '$births += $parsed.UtcTicks - ($parsed.UtcTicks % 10000)', 'reused-parent-one-tick'],
  ];
  const modulePath = resolve('scripts/process-ownership.ps1').replaceAll("'", "''"), payload = Buffer.from(JSON.stringify({ vectors, mutations: psMutations })).toString('base64');
  const command = `$ErrorActionPreference='Stop'; . '${modulePath}';
$inputData = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json -DateKind String;
$source = [IO.File]::ReadAllText('${modulePath}');
$rows = @(foreach ($fixture in $inputData.vectors) { $actual = Test-TaskOwnedDescendant $fixture.child $fixture.liveParent $fixture.recordedParent $fixture.taskRoot; [pscustomobject]@{name=$fixture.name;consumer='powershell';actual=$actual;expected=$fixture.expected} });
$controls = @(foreach ($mutation in $inputData.mutations) {
  if (($source.Split(@([string]$mutation[1]), [StringSplitOptions]::None)).Length -ne 2) { throw 'Mutation must replace exact current PowerShell bytes once.' }
  Invoke-Expression ($source.Replace([string]$mutation[1], [string]$mutation[2]));
  $fixture = $inputData.vectors | Where-Object name -eq $mutation[3];
  $actual = Test-TaskOwnedDescendant $fixture.child $fixture.liveParent $fixture.recordedParent $fixture.taskRoot;
  Invoke-Expression $source;
  $restored = Test-TaskOwnedDescendant $fixture.child $fixture.liveParent $fixture.recordedParent $fixture.taskRoot;
  [pscustomobject]@{name=$mutation[0];consumer='powershell';target=$fixture.name;faultyActual=$actual;expected=$fixture.expected;executed=$true;rejected=$actual -ne $fixture.expected;restored=$restored -eq $fixture.expected}
}); ConvertTo-Json -InputObject @{cases=$rows;controls=$controls} -Depth 5 -Compress`;
  const powershell = JSON.parse(execFileSync('pwsh', ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')], { encoding: 'utf8', windowsHide: true, timeout: 10000 }));
  assert.equal(powershell.cases.length, vectors.length); assert.equal(powershell.controls.length, 5);
  for (const row of powershell.cases) { assert.equal(row.actual, row.expected, `PowerShell ${row.name}`); report.cases.push(row); }
  for (const control of powershell.controls) { assert.ok(control.executed && control.rejected && control.restored, `PowerShell ${control.name} must execute RED and restore`); report.controls.push(control); }
  const mutations = [
    ['old-utc-wall-tick-rule', 'if (childBirth < rootBirth || childBirth < parentBirth || parentBirth < rootBirth) return false;', 'if (childBirth < rootBirth - 252000000000n || childBirth < parentBirth - 252000000000n || parentBirth < rootBirth) return false;', 'old-installer-earlier-than-root-and-parent'],
    ['absent-parent-trusted-from-cache', 'if (!liveParent) return false;', 'liveParent ||= recordedParent;', 'absent-live-parent'],
    ['reused-parent-birth-check-omitted', 'if (parentBirth !== recordedBirth) return false;', '', 'reused-live-parent'],
    ['task-root-bound-omitted', 'if (childBirth < rootBirth || childBirth < parentBirth || parentBirth < rootBirth) return false;', 'if (childBirth < parentBirth) return false;', 'parent-and-child-before-task-root'],
    ['timestamp-truncated-to-milliseconds', "BigInt(utcMilliseconds) * 10000n + BigInt(fraction.padEnd(7, '0'))", 'BigInt(Date.parse(creation)) * 10000n', 'reused-parent-one-tick'],
  ];
  for (const [name, find, replacement, target] of mutations) {
    assert.equal(moduleSource.split(find).length, 2, `${name} must mutate exact current bytes once`);
    const changed = moduleSource.replace(find, replacement), faulty = (await import(`data:text/javascript;base64,${Buffer.from(changed).toString('base64')}`)).isOwnedDescendant;
    const fixture = vectors.find(row => row.name === target), actual = faulty(fixture.child, fixture.liveParent, fixture.recordedParent, fixture.taskRoot);
    assert.notEqual(actual, fixture.expected, `${name} must execute RED on actual faulty acquisition`);
    assert.equal(isOwnedDescendant(fixture.child, fixture.liveParent, fixture.recordedParent, fixture.taskRoot), fixture.expected);
    report.controls.push({ name, consumer: 'javascript', target, faultyActual: actual, expected: fixture.expected, executed: true, rejected: true, restored: true, mutatedSourceHash: hash(changed) });
  }
  assert.equal(JSON.stringify(vectors), before, 'Pure predicates must not mutate identities.');
  assert.equal(report.cases.length, 30); assert.equal(report.controls.length, 10); report.pass = true;
} catch (error) { report.failure = error.stack || String(error); throw error; }
finally { await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ pass: report.pass, cases: report.cases.length, controls: report.controls.length, report: `${output}/report.json`, failure: report.failure })); }

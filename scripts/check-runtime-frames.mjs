// harness: Strict unique source boundaries extract actual main.ts animate delta/life-time/pan statements and whole translateCamera; Node strips types and real Three vector math executes without startup/rendering.
// Bounds: explicit native timestamps at 10/20/60/120/240 Hz, changing cadence, cardinal/diagonal/opposed keys, pause/test-freeze and first-frame reset. This proves the extracted integration math, not browser input, rendering work or observed display cadence.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import * as THREE from 'three';

const sourcePath = 'src/main.ts', selfPath = 'scripts/check-runtime-frames.mjs';
const output = 'output/phase10/runtime-frames', runDirectory = `${output}/runs/${new Date().toISOString().replace(/[:.]/g, '-')}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digests = async () => Object.fromEntries(await Promise.all([sourcePath, selfPath].map(async path => [path, hash(await readFile(path))])));
const report = { harness: `node ${selfPath}`, runDirectory, pass: false, cases: [], controls: [], browsersLaunched: 0, serversLaunched: 0 };
await mkdir(runDirectory, { recursive: true });

function uniqueIndex(source, token) {
  const index = source.indexOf(token);
  assert.ok(index >= 0 && source.indexOf(token, index + token.length) === -1, 'Exactly one actual source boundary required: ' + token);
  return index;
}
function extract(source) {
  // These exact function boundaries deliberately fail if refactoring changes the scoped runtime code.
  const section = (first, next) => {
    const start = uniqueIndex(source, first), finish = uniqueIndex(source, next);
    assert.ok(finish > start);
    const text = source.slice(start, finish).trimEnd();
    assert.match(text, /\r?\n  \}$/, 'Scoped function must end before the next named function.');
    return { text, start, end: start + text.length };
  };
  const animate = section('  function animate(milliseconds: number) {', '  function resumeLoop() {');
  const translate = section('  function translateCamera(delta: number) {', '  function resize() {');
  const guardText = '    if (disposed || suspended || contextLost || document.hidden) return;';
  const guardOffset = uniqueIndex(animate.text, guardText);
  const coreOffset = uniqueIndex(animate.text, '    const delta = '), panOffset = uniqueIndex(animate.text, '    translateCamera(delta);');
  assert.ok(guardOffset < coreOffset && panOffset > coreOffset);
  const coreStart = animate.start + coreOffset, coreEnd = animate.start + panOffset + '    translateCamera(delta);'.length;
  const core = source.slice(coreStart, coreEnd), lines = core.split(/\r?\n/).map(line => line.trim());
  assert.equal(lines.length, 4, 'Actual contiguous integration must be delta, life-time condition, previous timestamp assignment and pan call.');
  assert.equal(lines[1], 'if (!testFrozen && !paused()) worldTime += delta;');
  assert.equal(lines[2], 'previousFrame = milliseconds;');
  assert.equal(lines[3], 'translateCamera(delta);');
  const matched = /^const delta = (previousFrame === undefined \? 0 : )THREE\.MathUtils\.clamp\((.+), 0, \.05\);$/.exec(lines[0]);
  assert.ok(matched, 'Native-time conditional and 50ms clamp must have the audited source shape.');
  const initializer = lines[0].slice('const delta = '.length, -1), nativeExpression = matched[2];
  assert.equal(nativeExpression, '(milliseconds - previousFrame) / 1000');
  const initializerOffset = uniqueIndex(core, initializer);
  const make = replacement => {
    const actualCore = replacement === undefined ? core : core.slice(0, initializerOffset) + replacement + core.slice(initializerOffset + initializer.length);
    return translate.text + '\nfunction advanceFrame(milliseconds: number) {\n' + guardText + '\n' + actualCore + '\n}\nglobalThis.advanceFrame = advanceFrame;\n';
  };
  const metadata = (start, end) => ({ start, end, firstLine: source.slice(0, start).split(/\r?\n/).length, sha256: hash(source.slice(start, end)) });
  return {
    boundaries: { method: 'strict unique source boundaries plus native type stripping', animate: metadata(animate.start, animate.end), translateCamera: metadata(translate.start, translate.end), guard: metadata(animate.start + guardOffset, animate.start + guardOffset + guardText.length), core: metadata(coreStart, coreEnd), initializer: metadata(coreStart + initializerOffset, coreStart + initializerOffset + initializer.length) },
    actual: make(), fixed: make(matched[1] + '1 / 60'), unclamped: make(matched[1] + 'Math.max(0, ' + nativeExpression + ')')
  };
}
function compile(source) { return stripTypeScriptTypes(source, { mode: 'strip' }); }
const initialPosition = [8, 12, 18], initialTarget = [1, 1.1, -.5], initialTime = 7.125;
function environment(executable, options = {}) {
  const camera = { position: new THREE.Vector3(...initialPosition) }, controls = { target: new THREE.Vector3(...initialTarget), enabled: options.enabled ?? true };
  const state = { THREE, camera, controls, heldKeys: new Set(options.keys ?? ['w']), moveForward: new THREE.Vector3(), moveRight: new THREE.Vector3(), movement: new THREE.Vector3(), worldUp: new THREE.Vector3(0, 1, 0), disposed: false, suspended: false, contextLost: false, document: { hidden: false }, testFrozen: options.testFrozen ?? false, paused: () => options.paused ?? false, previousFrame: undefined, worldTime: initialTime, markExploring: () => {} };
  const context = createContext(state);
  runInContext(executable, context, { timeout: 1000 });
  return context;
}
function timestamps(intervals) {
  let stamp = 10000.123456789;
  return [stamp, ...intervals.map(interval => stamp += interval)];
}
const fixedCadences = [10, 20, 60, 120, 240].map(hz => ({ name: `${hz} Hz`, hz, timestamps: timestamps(Array(hz * 2).fill(1000 / hz)) }));
const changing = { name: 'changing 10→240→20→120→60 Hz', timestamps: timestamps([[10, 10], [240, 120], [20, 10], [120, 60], [60, 30]].flatMap(([hz, count]) => Array(count).fill(1000 / hz))) };
const fixtures = [...fixedCadences, changing];

// Independent scalar oracle: elapsed native time below 50ms is fully integrated; longer gaps contribute exactly 50ms. It uses no extracted production expression or Three vector helper.
function expectedMovement(keys, delta, enabled) {
  if (!enabled) return [0, 0, 0];
  const forward = Number(keys.includes('w')) - Number(keys.includes('s')), right = Number(keys.includes('d')) - Number(keys.includes('a'));
  if (!forward && !right) return [0, 0, 0];
  const dx = initialTarget[0] - initialPosition[0], dz = initialTarget[2] - initialPosition[2], horizontalLength = Math.hypot(dx, dz);
  const x = dx / horizontalLength * forward - dz / horizontalLength * right, z = dz / horizontalLength * forward + dx / horizontalLength * right;
  const length = Math.hypot(x, z), distance = Math.hypot(...initialPosition.map((value, index) => value - initialTarget[index]));
  const travel = distance * .22 * delta;
  return [x / length * travel, 0, z / length * travel];
}
function trial(executable, fixture, options = {}) {
  const context = environment(executable, options), keys = options.keys ?? ['w'];
  const rows = [], violations = [];
  let previous, life = initialTime, position = [...initialPosition], target = [...initialTarget];
  function compare(label, actual, expected, index) {
    if ((!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-9) && !violations.some(item => item.invariant === label)) violations.push({ invariant: label, frame: index, nativeTimestamp: fixture.timestamps[index], actual, expected });
  }
  for (let index = 0; index < fixture.timestamps.length; index++) {
    if (options.resetAt === index) { context.previousFrame = undefined; previous = undefined; }
    const nativeTimestamp = fixture.timestamps[index], interval = previous === undefined ? 0 : nativeTimestamp - previous;
    const delta = previous === undefined || interval <= 0 ? 0 : interval >= 50 ? .05 : interval / 1000;
    const move = expectedMovement(keys, delta, options.enabled ?? true);
    position = position.map((value, axis) => value + move[axis]); target = target.map((value, axis) => value + move[axis]);
    if (!options.paused && !options.testFrozen) life += delta;
    context.advanceFrame(nativeTimestamp);
    compare('life follows clamped native elapsed time', context.worldTime, life, index);
    for (let axis = 0; axis < 3; axis++) {
      compare(`camera translation axis ${axis}`, context.camera.position.getComponent(axis), position[axis], index);
      compare(`target translation axis ${axis}`, context.controls.target.getComponent(axis), target[axis], index);
      compare(`camera-target offset axis ${axis}`, context.camera.position.getComponent(axis) - context.controls.target.getComponent(axis), initialPosition[axis] - initialTarget[axis], index);
    }
    compare('previous frame preserves exact native timestamp', context.previousFrame, nativeTimestamp, index);
    rows.push({ nativeTimestamp, nativeIntervalMs: previous === undefined ? null : interval, expectedDeltaSeconds: delta, actualLife: context.worldTime, expectedLife: life, position: context.camera.position.toArray(), target: context.controls.target.toArray() });
    previous = nativeTimestamp;
  }
  return { name: fixture.name, options, samples: rows.length, sub50Intervals: rows.filter(row => row.nativeIntervalMs > 0 && row.nativeIntervalMs < 50).length, over50Intervals: rows.filter(row => row.nativeIntervalMs > 50).length, violations, rows };
}

try {
  report.sourceBefore = await digests();
  const source = await readFile(sourcePath, 'utf8'), extracted = extract(source), executable = {};
  report.extraction = extracted.boundaries;
  report.extraction.policy = 'Only the actual guard, contiguous delta/life/previousFrame/pan call and complete translateCamera function execute. Renderer, simulation updates and DEV instrumentation are outside this CPU claim.';
  for (const mode of ['actual', 'fixed', 'unclamped']) {
    executable[mode] = compile(extracted[mode]);
    await writeFile(`${runDirectory}/${mode}.ts`, extracted[mode], { flag: 'wx' });
    await writeFile(`${runDirectory}/${mode}.js`, executable[mode], { flag: 'wx' });
  }
  report.executed = Object.fromEntries(Object.entries(executable).map(([mode, text]) => [mode, { path: `${runDirectory}/${mode}.js`, sha256: hash(text) }]));
  for (const fixture of fixtures) {
    const result = trial(executable.actual, fixture);
    report.cases.push(result); assert.deepEqual(result.violations, [], fixture.name);
  }
  for (const keys of [['d'], ['s'], ['a'], ['w', 'd'], ['w', 's'], ['w', 'a', 's', 'd']]) {
    const result = trial(executable.actual, changing, { keys }); report.cases.push(result); assert.deepEqual(result.violations, [], `Actual pan keys ${keys}`);
  }
  for (const options of [{ paused: true }, { testFrozen: true }, { enabled: false }, { resetAt: 100 }]) {
    const result = trial(executable.actual, changing, options); report.cases.push(result); assert.deepEqual(result.violations, [], `Integration guard ${JSON.stringify(options)}`);
  }
  for (const mode of ['fixed', 'unclamped']) {
    const observations = fixtures.map(fixture => trial(executable[mode], fixture));
    const expectedRejected = mode === 'fixed' ? ['10 Hz', '20 Hz', '120 Hz', '240 Hz', changing.name] : ['10 Hz', changing.name];
    const rejected = observations.filter(value => value.violations.length).map(value => value.name);
    assert.deepEqual(rejected, expectedRejected, `${mode}: the executed mutation must fail exactly the cadences that distinguish it.`);
    assert.ok(observations.some(value => value.violations.length && value.over50Intervals), `${mode}: a genuinely long native interval must discriminate.`);
    if (mode === 'fixed') assert.ok(observations.some(value => value.violations.length && value.sub50Intervals), 'Fixed-step mutation must also fail below the clamp, not only after long frames.');
    report.controls.push({ mode, rejected, nonDiscriminating: observations.filter(value => !value.violations.length).map(value => value.name), observations });
  }
  report.limitations = ['A correct 60Hz sequence cannot distinguish a 1/60 fixed step; the 120/240Hz and changing native intervals do.', 'Removing only the upper clamp cannot be distinguished by frames at or below50ms; the 10Hz and changing native intervals do.', 'Native timestamps here are explicit CPU fixtures. This does not claim a physical monitor delivered those cadences or validate browser event delivery/render work.'];
  report.sourceAfter = await digests(); assert.deepEqual(report.sourceAfter, report.sourceBefore, 'Source must remain fixed throughout CPU proof.');
  report.pass = true;
} catch (error) { report.failure = { name: error.name, message: error.message, stack: error.stack }; throw error; }
finally {
  await writeFile(`${runDirectory}/report.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(`PASS actual main integration at10/20/60/120/240Hz and changing native intervals; executed fixed-step and missing-clamp mutations rejected at their discriminating cadences. ${runDirectory}`);

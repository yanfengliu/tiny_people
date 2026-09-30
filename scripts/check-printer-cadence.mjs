// Bounds: execute the CURRENT check-scenes printer adapter in the established CPU
// cadence harness: 31 frame/work trials, 10 poses, six cleanup/boundary cases and
// five coverage/attribution controls. Rendered metrics must identify the same
// completed work record; an executed stale-call control must fail that assertion.
// Synthetic callbacks/events prove the sampler, not native input, performance or GPU completion.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const selfPath = 'scripts/check-printer-cadence.mjs';
const scenePath = 'scripts/check-scenes.mjs', cadencePath = 'scripts/check-mechanism-cadence.mjs';
const statePath = 'src/scene/mechanism-state.ts';
const sourcePaths = [selfPath, scenePath, cadencePath, statePath, 'scripts/check-mechanism-input.mjs', 'scripts/mechanism-performance.mjs'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const runFile = promisify(execFile);
const digests = async () => Object.fromEntries(await Promise.all(sourcePaths.map(async path => [path, hash(await readFile(path))])));
function replaceOnce(source, anchor, value) {
  assert.equal(source.split(anchor).length, 2, 'Printer CPU proof must adapt exactly one current harness anchor: ' + anchor);
  return source.replace(anchor, value);
}
function uniqueIndex(source, anchor) {
  const index = source.indexOf(anchor);
  assert.ok(index >= 0 && source.indexOf(anchor, index + anchor.length) === -1, 'Printer CPU proof requires one current adapter boundary: ' + anchor);
  return index;
}

export async function runPrinterCadenceProof(output = 'output/phase10/printer-cadence-durable') {
  const outputRoot = resolve(output), evidenceRoot = resolve('output');
  const ownedPath = relative(evidenceRoot, outputRoot);
  assert.ok(ownedPath && !isAbsolute(ownedPath) && ownedPath !== '..' && !ownedPath.startsWith('..' + sep), 'Printer CPU evidence must remain in its owned ignored output directory.');
  const runDirectory = output + '/runs/' + new Date().toISOString().replace(/[:.]/g, '-');
  const report = { harness: 'node ' + selfPath, runDirectory, pass: false, browsersLaunched: 0, serversLaunched: 0,
    bound: 'Synthetic CPU callbacks and events establish cadence, attribution, cleanup and completed-record/rendered-metric identity; no native-input, CPU-performance or GPU-completion claim.', arms: [] };
  await mkdir(runDirectory, { recursive: true });
  try {
    report.sourceBefore = await digests();
    const sceneSource = await readFile(scenePath, 'utf8'), cadenceSource = await readFile(cadencePath, 'utf8');
    const start = uniqueIndex(sceneSource, '  // Reuse the cadence-tested sampler.');
    const end = uniqueIndex(sceneSource, '  async function sample(count, active) {');
    assert.ok(end > start);
    const extraction = sceneSource.slice(start, end), adapterReport = {};
    // Execute the exact adapter statements used by the native gate, rather than a copied installer.
    const adapted = await new Function('readFile', 'report', 'hash', 'assert', 'return(async()=>{' + extraction + ';return executable;})()')(readFile, adapterReport, hash, assert);
    report.adapter = { ...adapterReport.performanceHarness, extractionSha256: hash(extraction), executionSha256: hash(adapted) };
    assert.equal(report.adapter.adaptedSha256, hash(adapted));
    await writeFile(runDirectory + '/adapter-source.js', extraction, { flag: 'wx' });
    for (const stale of [false, true]) {
      const name = stale ? 'stale-rendered-metric' : 'positive', armRoot = runDirectory + '/' + name;
      await mkdir(armRoot, { recursive: true });
      const samplerPath = armRoot + '/sampler.mjs', proofPath = armRoot + '/checker.mjs';
      const executable = stale ? replaceOnce(adapted, 'metrics.push(window.__tinyWorld.metrics());', 'metrics.push({...window.__tinyWorld.metrics(), calls:window.__tinyWorld.metrics().calls-1});') : adapted;
      await writeFile(samplerPath, '// active-timing:begin\n' + replaceOnce(executable, 'function installActiveTiming', 'export function installActiveTiming') + '\n// active-timing:end\n', { flag: 'wx' });
      let proof = replaceOnce(cadenceSource, "'../src/scene/mechanism-state.ts'", JSON.stringify(pathToFileURL(resolve(statePath)).href));
      proof = replaceOnce(proof, "sourcePath = 'scripts/check-mechanism-input.mjs', selfPath = 'scripts/check-mechanism-cadence.mjs'", 'sourcePath = ' + JSON.stringify(samplerPath) + ', selfPath = ' + JSON.stringify(proofPath));
      proof = replaceOnce(proof, "output = 'output/phase10/mechanism-cadence'", 'output = ' + JSON.stringify(armRoot));
      proof = replaceOnce(proof, 'const window = { __tinyWorld: { mechanismEvents:', 'const window = { __tinyWorld: { printer:()=>({events:model.events(),mechanisms:model.snapshot()}), metrics:()=>({calls:workSequence,triangles:workSequence*3}), mechanismEvents:');
      proof = replaceOnce(proof, 'assert.equal(result.frames.length, 600);', 'assert.equal(result.frames.length, 600);assert.equal(result.metrics.length,600);for(let index=0;index<600;index++){assert.equal(result.metrics[index].calls,result.frames[index].sequence,"Rendered calls must belong to the same completed work record.");assert.equal(result.metrics[index].triangles,result.frames[index].sequence*3,"Rendered triangles must belong to the same completed work record.");}');
      await writeFile(proofPath, proof, { flag: 'wx' });
      const arm = { name, executableSha256: hash(executable), checkerSha256: hash(proof), samplerPath, proofPath, reportPath: armRoot + '/report.json' };
      report.arms.push(arm);
      let rejected;
      try { const result = await runFile(process.execPath, [proofPath], { windowsHide: true, timeout: 30000 }); arm.stdout = result.stdout.trim(); }
      catch (error) { rejected = error; arm.exitCode = error.code; }
      const bytes = await readFile(arm.reportPath), result = JSON.parse(bytes); arm.reportSha256 = hash(bytes);
      if (stale) {
        assert.ok(rejected, 'The executed stale rendered-metric mutation must fail.');
        assert.equal(result.pass, false); assert.equal(result.failure?.name, 'AssertionError');
        assert.match(result.failure.message, /Rendered calls must belong to the same completed work record\./);
        assert.match(result.failure.message, /1 !== 2/, 'The stale-call control must reject calls 1 paired with completed sequence 2.');
        arm.rejected = true; arm.reason = result.failure.message;
      } else {
        if (rejected) throw rejected;
        assert.equal(result.pass, true); assert.equal(result.trials.length, 31); assert.equal(result.commandPoses.length, 10);
        assert.equal(result.cancellation.length, 6); assert.equal(result.controls.length, 5);
        assert.ok(result.controls.every(control => control.rejected === true));
        assert.ok(result.cancellation.every(row => row.ownedCallbacks === 0 && row.ownedTimers === 0));
        assert.deepEqual(result.sourceAfter, result.sourceBefore);
        assert.equal(result.browsersLaunched, 0); assert.equal(result.serversLaunched, 0);
        arm.counts = { trials: 31, commandPoses: 10, cleanup: 6, rejectedControls: 5 };
      }
    }
    report.sourceAfter = await digests(); assert.deepEqual(report.sourceAfter, report.sourceBefore);
    report.pass = true;
    console.log('PASS printer cadence CPU: 31 frame/work trials, 10 poses, six cleanup cases, five controls and executed stale rendered-record identity RED.');
  } catch (error) { report.failure = { name: error.name, message: error.message, stack: error.stack }; throw error; }
  finally {
    await writeFile(runDirectory + '/report.json', JSON.stringify(report, null, 2));
    await writeFile(output + '/report.json', JSON.stringify(report, null, 2));
  }
  return { reportPath: output + '/report.json', reportSha256: hash(await readFile(output + '/report.json')), adaptedSha256: report.adapter.adaptedSha256,
    counts: report.arms[0].counts, staleMetricRejected: report.arms[1].rejected, browsersLaunched: 0, serversLaunched: 0 };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await runPrinterCadenceProof();

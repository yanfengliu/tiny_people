// harness: CPU-only evaluation of paired 150/600 native frame intervals, with bounded regression checks.
// The manager refined the provisional active-mean target after retaining an 18 ms failure with isolated
// doubled intervals. The paired overhead and explicit outlier bounds remain visible; no samples are dropped.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const mechanismPerformanceLimits = Object.freeze({
  contract: 'phase8-paired-local-v2',
  maxCalls: 525, maxTriangles: 1110000,
  maxBaselineMeanMs: 18, maxActiveMeanMs: 19, maxActiveMinusBaselineMeanMs: 1,
  maxP95Ms: 20, maxIntervalMs: 40, slowIntervalThresholdMs: 30, maxSlowIntervalFraction: .05,
});

function summarize(intervals, expectedCount, label) {
  assert.ok(Array.isArray(intervals) && intervals.length === expectedCount &&
    Array.from(intervals).every(value => Number.isFinite(value) && value > 0),
  label + ' requires exactly ' + expectedCount + ' finite positive native frame intervals.');
  const sorted = [...intervals].sort((a, b) => a - b);
  const slowIntervalCount = intervals.filter(value => value > mechanismPerformanceLimits.slowIntervalThresholdMs).length;
  return { samples: intervals.length, meanMs: intervals.reduce((sum, value) => sum + value, 0) / intervals.length,
    // Preserve the existing gate's percentile estimator, including its exact-five-percent boundary.
    p95Ms: sorted[Math.floor(intervals.length * .95)], maxMs: sorted.at(-1),
    slowIntervalThresholdMs: mechanismPerformanceLimits.slowIntervalThresholdMs,
    slowIntervalCount, slowIntervalFraction: slowIntervalCount / intervals.length, intervals: [...intervals] };
}

export function evaluateMechanismPerformance(metrics, baselineIntervals, activeIntervals) {
  for (const key of ['calls', 'triangles']) assert.ok(Number.isInteger(metrics?.[key]) && metrics[key] >= 0,
    'Performance evaluation requires a nonnegative integer rendered metric: ' + key);
  const baseline150 = summarize(baselineIntervals, 150, 'Paired baseline');
  const active600 = summarize(activeIntervals, 600, 'Active sample');
  const activeMinusBaselineMeanMs = active600.meanMs - baseline150.meanMs;
  const limits = mechanismPerformanceLimits, violations = [];
  function check(code, value, limit, label) {
    if (value > limit) violations.push({ code, value, limit, message: label + ' ' + value + ' exceeds ' + limit });
  }
  check('calls', metrics.calls, limits.maxCalls, 'Draw calls');
  check('triangles', metrics.triangles, limits.maxTriangles, 'Triangles');
  check('baseline-mean', baseline150.meanMs, limits.maxBaselineMeanMs, 'Paired baseline mean ms');
  check('active-mean', active600.meanMs, limits.maxActiveMeanMs, 'Active mean ms');
  check('relative-mean', activeMinusBaselineMeanMs, limits.maxActiveMinusBaselineMeanMs, 'Active minus paired baseline mean ms');
  for (const [label, timing] of [['baseline', baseline150], ['active', active600]]) {
    check(label + '-p95', timing.p95Ms, limits.maxP95Ms, label + ' p95 ms');
    check(label + '-maximum', timing.maxMs, limits.maxIntervalMs, label + ' maximum interval ms');
    check(label + '-slow-fraction', timing.slowIntervalFraction, limits.maxSlowIntervalFraction, label + ' fraction of intervals >30 ms');
  }
  return { limits, baseline150, active600, activeMinusBaselineMeanMs,
    violations, failures: violations.map(item => item.message) };
}

// Run without Three.js, Vite, Playwright or a server: node scripts/mechanism-performance.mjs --check
function checkBudgetEvaluation() {
  const filled = (count, value) => Array(count).fill(value), metrics = { calls: 525, triangles: 1110000 };
  const cases = [
    ['inclusive means and paired overhead', filled(150, 18), filled(600, 19), []],
    ['relative overhead alone', filled(150, 16), filled(600, 17.01), ['relative-mean']],
    ['baseline mean', filled(150, 18.01), filled(600, 18.01), ['baseline-mean']],
    ['active mean and overhead', filled(150, 18), filled(600, 19.01), ['active-mean', 'relative-mean']],
    ['active p95 alone', filled(150, 16), [...filled(500, 16), ...filled(100, 21)], ['active-p95']],
    ['baseline p95 alone', [...filled(125, 16), ...filled(25, 21)], filled(600, 16), ['baseline-p95']],
    ['maximum equality', filled(150, 16), [...filled(599, 16), 40], []],
    ['active maximum alone', filled(150, 16), [...filled(599, 16), 40.01], ['active-maximum']],
    ['baseline maximum alone', [...filled(149, 16), 40.01], filled(600, 16), ['baseline-maximum']],
    // >5% slow intervals necessarily also fail p95. Distinct code assertions still reject a deleted slow check.
    ['slow fraction equality', filled(150, 16), [...filled(570, 16), ...filled(30, 31)], ['active-p95']],
    ['active slow fraction exceeded', filled(150, 16), [...filled(569, 16), ...filled(31, 31)], ['active-p95', 'active-slow-fraction']],
    ['baseline slow fraction exceeded', [...filled(142, 16), ...filled(8, 31)], filled(600, 16), ['baseline-p95', 'baseline-slow-fraction']],
  ];
  for (const [name, baseline, active, expected] of cases) {
    const result = evaluateMechanismPerformance(metrics, baseline, active);
    assert.deepEqual(result.violations.map(item => item.code).sort(), [...expected].sort(), name);
  }
  const threshold = evaluateMechanismPerformance(metrics, filled(150, 16), [...filled(598, 16), 30, 30.01]);
  assert.equal(threshold.active600.slowIntervalCount, 1, 'Slow means strictly greater than 30 ms.');
  assert.equal(threshold.active600.slowIntervalFraction, 1 / 600);
  for (const [key, code] of [['calls', 'calls'], ['triangles', 'triangles']]) {
    const result = evaluateMechanismPerformance({ ...metrics, [key]: metrics[key] + 1 }, filled(150, 16), filled(600, 16));
    assert.deepEqual(result.violations.map(item => item.code), [code]);
  }
  for (const invalid of [NaN, Infinity, 0, -1]) {
    assert.throws(() => evaluateMechanismPerformance(metrics, [...filled(149, 16), invalid], filled(600, 16)), /finite positive/);
    assert.throws(() => evaluateMechanismPerformance(metrics, filled(150, 16), [...filled(599, 16), invalid]), /finite positive/);
  }
  for (const count of [150, 600]) {
    for (const sparse of [Array(count), Object.assign(Array(count), { 0: 16 })]) {
      assert.throws(() => evaluateMechanismPerformance(metrics,
        count === 150 ? sparse : filled(150, 16), count === 600 ? sparse : filled(600, 16)), /finite positive/);
    }
  }
  assert.throws(() => evaluateMechanismPerformance(metrics, filled(149, 16), filled(600, 16)), /exactly 150/);
  assert.throws(() => evaluateMechanismPerformance(metrics, filled(150, 16), filled(599, 16)), /exactly 600/);
  assert.throws(() => evaluateMechanismPerformance({ ...metrics, calls: NaN }, filled(150, 16), filled(600, 16)), /rendered metric/);
  console.log('PASS paired performance CPU checks: 12 timing cases, strict slow threshold, draw/triangle bounds, invalid and sparse data, and sample counts.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.equal(process.argv[2], '--check', 'Run CPU regression checks with: node scripts/mechanism-performance.mjs --check');
  checkBudgetEvaluation();
}

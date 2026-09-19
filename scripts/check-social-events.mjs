// harness: Existing createMechanismState commands/advances drive the production social-opening bridge.
// Bounds: native and diagnostic sources, real reversal/no-travel cancellation, restore, blocked travel,
// instant reduced motion and100 frozen rail cycles past the diagnostic ring's256-entry bound.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
const output = 'output/social-events', hash = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = ['src/scene/social-events.ts', 'src/scene/social-types.ts', 'src/scene/mechanism-state.ts', 'scripts/check-social-events.mjs'];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(path))])));
const vite = await createServer({ server: { middlewareMode: true, hmr: { port: 0 } } });
const report = { sourceHashes, cases: [], controls: [] };
try {
  const { createMechanismState } = await vite.ssrLoadModule('/src/scene/mechanism-state.ts');
  const { createSocialOpeningBridge } = await vite.ssrLoadModule('/src/scene/social-events.ts');
  function fixture(factory = createSocialOpeningBridge, canTravel = () => true, sequence = 1) {
    const openings = [], applied = [];
    const bridge = factory(event => openings.push(event), sequence);
    const mechanisms = createMechanismState(['rail', 'shoulder', 'joystick'], (id, progress) => applied.push({ id, progress }), canTravel, bridge.event);
    bridge.reset(mechanisms.snapshot());
    function advance(delta, time) { bridge.observe(mechanisms.snapshot()); mechanisms.advance(delta, time); }
    return { openings, applied, bridge, mechanisms, advance };
  }
  function noTravel(factory = createSocialOpeningBridge) {
    const test = fixture(factory);
    test.mechanisms.command('rail', 'pointer', false, 0); test.advance(2, 2);
    assert.equal(test.openings.length, 1); assert.equal(test.mechanisms.snapshot()[0].progress, 1);
    const before = test.applied.length;
    test.mechanisms.command('rail', 'keyboard', false, 2);
    test.mechanisms.command('rail', 'keyboard', false, 2);
    assert.ok(test.mechanisms.events().at(-1).type === 'opened', 'Control must exercise the accepted same-tick terminal event.');
    assert.ok(test.applied.slice(before).every(value => value.progress === 1), 'The control must have no physical travel.');
    assert.equal(test.openings.length, 1, 'No-travel cancellation must not create a new social opening.');
    return test;
  }
  const reversal = noTravel();
  reversal.mechanisms.command('rail', 'pointer', false, 2); reversal.advance(.25, 2.25);
  assert.ok(reversal.mechanisms.snapshot()[0].progress < 1);
  reversal.mechanisms.command('rail', 'pointer', false, 2.25); reversal.advance(2, 4.25);
  assert.equal(reversal.openings.length, 2, 'Reopening after actual closing travel must trigger again.');
  report.cases.push({ name: 'physical opening and reversal versus no-travel cancellation', openings: reversal.openings });

  function instant(factory = createSocialOpeningBridge) {
    const test = fixture(factory);
    test.mechanisms.command('rail', 'keyboard', true, 7);
    assert.equal(test.openings.length, 1);
    test.mechanisms.command('rail', 'keyboard', true, 7);
    test.mechanisms.command('rail', 'keyboard', true, 7);
    assert.equal(test.openings.length, 2, 'Instant closed-to-open travel must arm without a rendered intermediate frame.');
    assert.ok(test.openings.every(event => event.lifeTime === 7));
    return test;
  }
  report.cases.push({ name: 'instant reduced-motion travel', openings: instant().openings });
  const blocked = fixture(undefined, () => false);
  blocked.mechanisms.command('rail', 'pointer', false, 0); blocked.advance(3, 3);
  blocked.mechanisms.command('rail', 'pointer', false, 3);
  assert.deepEqual(blocked.openings, []); assert.ok(blocked.mechanisms.events().some(event => event.type === 'blocked'));
  report.cases.push({ name: 'blocked opening and cancellation', openings: blocked.openings });

  const restored = fixture();
  restored.mechanisms.command('rail', 'diagnostic', true, 0);
  assert.deepEqual(restored.openings, []);
  const states = restored.mechanisms.snapshot(); states[0].progress = .4; states[0].target = 1;
  assert.equal(restored.mechanisms.restore(states), true); restored.bridge.reset(restored.mechanisms.snapshot());
  restored.advance(2, 2); assert.deepEqual(restored.openings, []);
  assert.equal(restored.mechanisms.events().at(-1).source, 'restore');
  restored.mechanisms.setProgress('rail', 0); restored.bridge.reset(restored.mechanisms.snapshot());
  restored.mechanisms.command('rail', 'pointer', true, 2);
  assert.equal(restored.openings.length, 1, 'A new visitor opening after diagnostic/history positioning is still real.');
  report.cases.push({ name: 'diagnostic positioning and restoration do not react', openings: restored.openings });

  const frozen = fixture(undefined, undefined, 38);
  for (let index = 0; index < 100; index++) {
    frozen.mechanisms.command('rail', 'keyboard', true, 12.75);
    frozen.mechanisms.command('rail', 'keyboard', true, 12.75);
  }
  assert.equal(frozen.openings.length, 100); assert.equal(frozen.mechanisms.events().length, 256);
  assert.deepEqual(frozen.openings.map(event => event.sequence), Array.from({ length: 100 }, (_, index) => 38 + index));
  assert.ok(frozen.openings.every(event => event.lifeTime === 12.75 && event.source === 'keyboard'));
  assert.equal(frozen.bridge.nextSequence(), 138);
  report.cases.push({ name: '100 frozen cycles retain every real opening beyond ring eviction', count: 100, first: frozen.openings[0], last: frozen.openings.at(-1) });

  const copied = createMechanismState(['rail'], () => {}, () => true, event => { event.source = 'restore'; event.progress = 99; });
  copied.command('rail', 'pointer', true, 0);
  assert.ok(copied.events().every(event => event.source === 'pointer' && event.progress <= 1), 'Event observers must not mutate authoritative diagnostics.');
  report.cases.push({ name: 'copied event sink preserves diagnostic records' });

  await mkdir(output, { recursive: true });
  const source = (await readFile('src/scene/social-events.ts', 'utf8')).replaceAll('\r\n', '\n');
  for (const [name, before, after, control, message] of [
    ['missing-travel-filter', 'if (!moved || !source || source !== value.source) return;', 'if (!source || source !== value.source) return;', noTravel, /No-travel cancellation/],
    ['missing-instant-arm', 'if (value.progress < 1) armed.set(value.id, true);', '/* rejected: no instant command arming */', instant, /Instant closed-to-open/],
  ]) {
    assert.equal(source.split(before).length - 1, 1, 'Mutation anchor must exist exactly once.');
    const path = `${output}/${name}.ts`, mutated = source.replace(before, after);
    await writeFile(path, mutated);
    const module = await vite.ssrLoadModule('/' + path);
    let caught; try { control(module.createSocialOpeningBridge); } catch (error) { caught = error; }
    assert.ok(caught && message.test(caught.message), name + ' must fail the intended physical control.');
    report.controls.push({ name, path, sha256: hash(mutated), rejected: true, message: caught.message });
  }
  for (const path of paths) assert.equal(hash(await readFile(path)), sourceHashes[path], path + ' changed during verification.');
  report.status = 'PASS';
  console.log('PASS social opening bridge: physical travel, no-motion cancellation, blocked/restore/diagnostic exclusion, instant motion,100 frozen cycles, copied events and2 actual corruption controls.');
} finally {
  await vite.close(); await mkdir(output, { recursive: true });
  await writeFile(output + '/report.json', JSON.stringify({ ...report, viteClosed: true, browsersLaunched: 0 }, null, 2));
}

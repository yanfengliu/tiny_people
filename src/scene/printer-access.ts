import * as THREE from 'three';
import { batchPrinter, printerBox, printerRod } from './printer-geometry';
import { printerCoreFlights } from './printer-travel';

type AccessMaterials = { coral: THREE.Material; metal: THREE.Material; cream: THREE.Material };
type Point = [number, number, number];

/** Fixed service circulation. The world carves its housing and joins the floor entrances. */
export function createPrinterAccess(materials: AccessMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'printer-service-access';
  const rear = -1.93, front = -.42;
  const railOffset = .27, railHeight = .34;

  function block(name: string, material: THREE.Material, size: Point, at: Point) {
    const mesh = printerBox(group, material, size, at, 0); mesh.name = name; return mesh;
  }
  function rail(name: string, a: Point, b: Point, radius = .010) {
    const mesh = printerRod(group, materials.metal, new THREE.Vector3(...a), new THREE.Vector3(...b), radius, 6); mesh.name = name; return mesh;
  }
  function baluster(name: string, x: number, z: number, bottom: number, top: number) {
    block(name, materials.metal, [.009, top - bottom, .009], [x, (bottom + top) / 2, z]);
  }
  function guard(name: string, y: number, a: [number, number], b: [number, number]) {
    rail(`${name}-top`, [a[0], y + railHeight, a[1]], [b[0], y + railHeight, b[1]]);
    rail(`${name}-middle`, [a[0], y + .17, a[1]], [b[0], y + .17, b[1]], .007);
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const count = Math.max(1, Math.ceil(length / .065));
    for (let index = 0; index <= count; index++) {
      const t = index / count, x = THREE.MathUtils.lerp(a[0], b[0], t), z = THREE.MathUtils.lerp(a[1], b[1], t);
      baluster(`${name}-post-${index}`, x, z, y, y + railHeight);
    }
  }

  function landing(y: number, atFront: boolean, ground = false, roof = false) {
    const label = `core-landing-${y.toFixed(3)}`;
    if (roof) {
      // Only the rear portion of the roof hatch is filled; the ascent remains open above the head.
      block(label, materials.coral, [.61, .045, .34], [-1.575, y - .0225, -2.10]);
      guard(`${label}-back`, y, [-1.86, -2.245], [-1.285, -2.245]);
      guard(`${label}-right`, y, [-1.285, -2.245], [-1.285, -1.95]);
      // The west side intentionally opens onto the world-owned roof deck at X -1.88.
      return;
    }
    const low = atFront ? front : -2.27, high = atFront ? .31 : rear;
    block(label, materials.coral, [1.70, .045, high - low], [-2.10, y - .0225, (low + high) / 2]);
    // Floor5 has a supported west passage from the hollow slide, matching the existing east exit.
    const slideExit = atFront && Math.abs(y - 5) < 1e-8;
    guard(`${label}-left`, y, [-2.92, low + .025], [-2.92, slideExit ? .025 : high - .025]);
    const exit = atFront && [3.5, 5, 6.5].some(floor => Math.abs(y - floor) < 1e-8);
    guard(`${label}-right`, y, [-1.28, low + .025], [-1.28, exit ? .025 : high - .025]);
    if (atFront) guard(`${label}-front`, y, [-2.92, .285], [-1.28, .285]);
    else if (ground) {
      // Rear entrance is the world's supported porch, centred on the left lane.
      guard(`${label}-back`, y, [-2.25, -2.245], [-1.28, -2.245]);
    } else guard(`${label}-back`, y, [-2.92, -2.245], [-1.28, -2.245]);
  }

  function coreFlight(definition: typeof printerCoreFlights[number]) {
    const { index, bottom, top, count: steps, lane: x, from, to, rise, going, width } = definition, towardFront = index % 2 === 0;
    const direction = towardFront ? 1 : -1;
    for (let step = 1; step <= steps; step++) {
      const y = bottom + rise * step, z = from + direction * going * (step - .5);
      block(`core-flight-${index}-tread-${step}`, materials.coral, [width, rise, going], [x, y - rise / 2, z]);
      block(`core-flight-${index}-nosing-${step}`, materials.cream, [width - .05, .001, .009], [x, y + .0005, z + direction * (going / 2 - .007)]);
      const divisions = Math.ceil(going / .065);
      for (let column = 0; column < divisions; column++) {
        const fraction = (column + .5) / divisions;
        const columnZ = from + direction * going * (step - 1 + fraction);
        const columnTop = bottom + rise * (step - 1 + fraction) + railHeight;
        for (const side of [-1, 1]) baluster(`core-flight-${index}-post-${step}-${column}-${side}`, x + side * railOffset, columnZ, y, columnTop);
      }
    }
    for (const side of [-1, 1]) {
      rail(`core-flight-${index}-handrail-${side}`, [x + side * railOffset, bottom + railHeight, from], [x + side * railOffset, top + railHeight, to]);
      rail(`core-flight-${index}-midrail-${side}`, [x + side * railOffset, bottom + .17, from], [x + side * railOffset, top + .17, to], .007);
      const stringer = printerRod(group, materials.coral, new THREE.Vector3(x + side * .25, bottom - .027, from), new THREE.Vector3(x + side * .25, top - .027, to), .023, 6);
      stringer.name = `core-flight-${index}-stringer-${side}`;
    }
    landing(top, towardFront, false, Math.abs(top - 9) < 1e-8);
  }

  landing(.10, false, true);
  // This distribution keeps the last rising adult below the slab until the full body enters its hatch.
  for (const definition of printerCoreFlights) coreFlight(definition);

  const shopX = 4.55, shopFrom = -3.50, shopTo = -.74, shopSteps = 27;
  const shopRise = 1.75 / shopSteps, shopGoing = (shopTo - shopFrom) / shopSteps;
  // The world-owned raised back street supports this approach without a coplanar duplicate pad.
  for (let step = 1; step <= shopSteps; step++) {
    const y = .10 + shopRise * step, z = shopFrom + shopGoing * (step - .5);
    block(`shop-tread-${step}`, materials.coral, [.58, shopRise, shopGoing], [shopX, y - shopRise / 2, z]);
    block(`shop-nosing-${step}`, materials.cream, [.53, .001, .009], [shopX, y + .0005, z + shopGoing / 2 - .007]);
    const divisions = Math.ceil(shopGoing / .065);
    for (let column = 0; column < divisions; column++) {
      const fraction = (column + .5) / divisions;
      const columnZ = shopFrom + shopGoing * (step - 1 + fraction);
      const columnTop = .10 + shopRise * (step - 1 + fraction) + railHeight;
      for (const side of [-1, 1]) baluster(`shop-post-${step}-${column}-${side}`, shopX + side * .275, columnZ, y, columnTop);
    }
  }
  for (const side of [-1, 1]) {
    const x = shopX + side * .275;
    guard(`shop-approach-${side}`, .10, [x, -3.825], [x, shopFrom]);
    rail(`shop-handrail-${side}`, [x, .10 + railHeight, shopFrom], [x, 1.85 + railHeight, shopTo]);
    rail(`shop-midrail-${side}`, [x, .27, shopFrom], [x, 2.02, shopTo], .007);
    const stringer = printerRod(group, materials.coral, new THREE.Vector3(x, .073, shopFrom), new THREE.Vector3(x, 1.823, shopTo), .023, 6); stringer.name = `shop-stringer-${side}`;
  }

  batchPrinter(group);
  group.userData.printerFeature = true;
  return group;
}

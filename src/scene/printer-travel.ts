import * as THREE from 'three';

export type PrinterTravelPoint = readonly [number, number, number];
export type PrinterTread = { readonly name: string; readonly center: PrinterTravelPoint; readonly top: number; readonly polygon: readonly PrinterTravelPoint[] };
export type PrinterFlight = {
  readonly id: string; readonly index: number; readonly axis: 'x' | 'z'; readonly bottom: number; readonly top: number;
  readonly from: number; readonly to: number; readonly lane: number; readonly width: number; readonly count: number;
  readonly rise: number; readonly going: number; readonly start: PrinterTravelPoint; readonly end: PrinterTravelPoint;
  readonly treads: readonly PrinterTread[];
};
export type PrinterTravelSegment = { readonly id: string; readonly kind: 'walk' | 'stairs' | 'slide'; readonly points: readonly PrinterTravelPoint[]; readonly flight?: PrinterFlight; readonly reverse?: boolean };

function point(x: number, y: number, z: number): PrinterTravelPoint { return Object.freeze([x, y, z]); }
function flight(id: string, index: number, axis: 'x' | 'z', bottom: number, top: number, from: number, to: number, lane: number, width: number, count: number): PrinterFlight {
  const rise = (top - bottom) / count, going = Math.abs(to - from) / count, direction = Math.sign(to - from);
  const at = (along: number, y: number, across = lane) => axis === 'x' ? point(along, y, across) : point(across, y, along);
  const treads = Array.from({ length: count }, (_, i) => {
    const step = i + 1, y = bottom + rise * step;
    // The facade has overlapping thin caps; the service core has full going-width blocks.
    const along = from + direction * going * (axis === 'x' ? step : step - .5);
    const center = at(along - (axis === 'x' ? direction * .0135 : 0), y);
    const halfGoing = axis === 'x' ? .0675 : going / 2;
    const middle = axis === 'x' ? center[0] : center[2];
    const polygon = [at(middle - halfGoing, y, lane - width / 2), at(middle + halfGoing, y, lane - width / 2), at(middle + halfGoing, y, lane + width / 2), at(middle - halfGoing, y, lane + width / 2)];
    return Object.freeze({ name: axis === 'x' ? `printer-stair-tread-${index}-${step}` : `core-flight-${index}-tread-${step}`, center, top: y, polygon: Object.freeze(polygon) });
  });
  return Object.freeze({ id, index, axis, bottom, top, from, to, lane, width, count, rise, going, start: at(from - direction * .08, bottom), end: at(to + direction * .08, top), treads: Object.freeze(treads) });
}

export const printerExternalFlights: readonly PrinterFlight[] = Object.freeze([
  flight('external-0', 0, 'x', 3.5, 5, 3.30, .60, 3.84, .66, 25),
  flight('external-1', 1, 'x', 5, 6.5, .60, 3.30, 4.55, .66, 25),
]);
const coreTops = [.78, 1.46, 2.14, 2.82, 3.5, 4.25, 5, 5.75, 6.5, 7.245, 7.99, 9];
export const printerCoreFlights: readonly PrinterFlight[] = Object.freeze(coreTops.map((top, index) => flight(`core-${index}`, index, 'z', index ? coreTops[index - 1] : .10, top, index % 2 ? -.42 : -1.93, index % 2 ? -1.93 : -.42, index % 2 ? -1.59 : -2.58, .56, index < 5 ? 11 : index === 11 ? 16 : 12)));

export const printerSlide = Object.freeze({ outerRadius: .86, innerRadius: .72, radialSegments: 24, longitudinalSegments: 96, contactInset: .008, entry: point(-3.60, 9.72, 1.39), exit: point(-3.43, 5.72, 1.31) });
export const printerSlideEntryFloor = point(printerSlide.entry[0], printerSlide.entry[1] - printerSlide.innerRadius, printerSlide.entry[2]);
export const printerSlideExitFloor = point(printerSlide.exit[0], printerSlide.exit[1] - printerSlide.innerRadius, printerSlide.exit[2]);
const slideEntryApproach = point(printerSlideEntryFloor[0] + .32, printerSlideEntryFloor[1], printerSlideEntryFloor[2]);
const exitDeckSize = point(.73, .022, 1.44), exitDeckCenter = point(printerSlideExitFloor[0] + .115, printerSlideExitFloor[1] - .011, printerSlideExitFloor[2] - .55);
export function createPrinterSlideExitDeckGeometry() { return new THREE.BoxGeometry(...exitDeckSize).translate(...exitDeckCenter); }

/** Monotone-height cubic segments retain the broad return while flattening both usable mouths. */
export function createPrinterSlideCurve(): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const add = (a: PrinterTravelPoint, b: PrinterTravelPoint, c: PrinterTravelPoint, d: PrinterTravelPoint) => path.add(new THREE.CubicBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b), new THREE.Vector3(...c), new THREE.Vector3(...d)));
  add(printerSlide.entry, point(-4.22, 9.72, 1.39), point(-4.90, 9.32, 1.36), point(-4.90, 8.30, 1.34));
  add(point(-4.90, 8.30, 1.34), point(-4.90, 7.70, 1.3282353), point(-4.90, 6.72, 1.31), point(-4.90, 6.15, 1.31));
  add(point(-4.90, 6.15, 1.31), point(-4.90, 5.72, 1.31), point(-4.14, 5.72, 1.31), printerSlide.exit);
  return path;
}

const slideCurve = createPrinterSlideCurve();
const slideFrames = slideCurve.computeFrenetFrames(printerSlide.longitudinalSegments, false);
const firstUp = new THREE.Vector3(0, 1, 0), lastUp = new THREE.Vector3(0, 1, 0);
const firstAngle = Math.atan2(firstUp.dot(slideFrames.binormals[0]), firstUp.dot(slideFrames.normals[0]));
const last = printerSlide.longitudinalSegments;
const endAngle = Math.atan2(lastUp.dot(slideFrames.binormals[last]), lastUp.dot(slideFrames.normals[last]));
let roll = endAngle - firstAngle;
while (roll > Math.PI) roll -= Math.PI * 2;
while (roll < -Math.PI) roll += Math.PI * 2;

/** The continuous seat channel rolls through the near-vertical return, with +Y inward at both mouths. */
export function printerSlideFrame(t: number) {
  const u = THREE.MathUtils.clamp(t, 0, 1), index = Math.min(last - 1, Math.floor(u * last)), fraction = u * last - index;
  const tangent = slideFrames.tangents[index].clone().lerp(slideFrames.tangents[index + 1], fraction).normalize();
  const normal = slideFrames.normals[index].clone().lerp(slideFrames.normals[index + 1], fraction).normalize();
  const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
  const turn = THREE.MathUtils.smoothstep(u, .27, .70), angle = firstAngle + roll * turn;
  const up = normal.multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle)).normalize();
  const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
  const center = slideCurve.getPointAt(u);
  return { center, tangent, up, right };
}

/** Cross sections used by both emitted wall triangles and contact interpolation. */
export function printerSlideRing(index: number) { return printerSlideFrame(index / last); }

/** A closed thick wall has an open bore: inner/outer skins meet only at annular ends. */
export function createPrinterSlideGeometry() {
  const positions: number[] = [], indices: number[] = [], radial = printerSlide.radialSegments;
  for (const radius of [printerSlide.outerRadius, printerSlide.innerRadius]) for (let i = 0; i <= last; i++) {
    const frame = printerSlideRing(i);
    for (let j = 0; j <= radial; j++) {
      const angle = j / radial * Math.PI * 2;
      const p = frame.center.clone().addScaledVector(frame.up, -Math.cos(angle) * radius).addScaledVector(frame.right, Math.sin(angle) * radius);
      positions.push(p.x, p.y, p.z);
    }
  }
  const skin = (last + 1) * (radial + 1);
  for (let layer = 0; layer < 2; layer++) for (let i = 0; i < last; i++) for (let j = 0; j < radial; j++) {
    const a = layer * skin + i * (radial + 1) + j, b = a + radial + 1, c = a + 1, d = b + 1;
    indices.push(...(layer ? [a, b, c, c, b, d] : [a, c, b, c, d, b]));
  }
  for (const end of [0, last]) for (let j = 0; j < radial; j++) {
    const a = end * (radial + 1) + j, b = a + 1, c = a + skin, d = b + skin;
    indices.push(...(end ? [a, b, c, b, d, c] : [a, c, b, b, c, d]));
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

export function createPrinterSlideCouplingGeometry() {
  const profile = [[printerSlide.innerRadius, -.04], [.96, -.04], [.96, .04], [printerSlide.innerRadius, .04], [printerSlide.innerRadius, -.04]].map(([r, height]) => new THREE.Vector2(r, height));
  return new THREE.LatheGeometry(profile, printerSlide.radialSegments);
}

export function printerSlideCoupling(index: 0 | 1) {
  const tangent = slideCurve.getTangentAt(index), center = new THREE.Vector3(...(index ? printerSlide.exit : printerSlide.entry)).addScaledVector(tangent, index ? .04 : -.04);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  return { tangent, center, quaternion };
}

const mouthSurfaces = new Map<number, THREE.Triangle[]>();
/** Local wall panels, attached annulus and the emitted exit deck cover feet crossing each mouth. */
export function samplePrinterSlideMouth(index: 0 | 1, lateral: number, axial: number) {
  let triangles = mouthSurfaces.get(index);
  if (!triangles) {
    triangles = [];
    const wall = createPrinterSlideGeometry(), p = wall.attributes.position, ids = wall.index!, skin = (last + 1) * (printerSlide.radialSegments + 1);
    for (let i = 0; i < ids.count; i += 3) {
      const vertices = [ids.getX(i), ids.getX(i + 1), ids.getX(i + 2)];
      if (!vertices.every(vertex => vertex >= skin)) continue;
      const rings = vertices.map(vertex => Math.floor((vertex - skin) / (printerSlide.radialSegments + 1)));
      if (index ? Math.min(...rings) < last - 12 : Math.max(...rings) > 12) continue;
      triangles.push(new THREE.Triangle(...vertices.map(vertex => new THREE.Vector3().fromBufferAttribute(p, vertex)) as [THREE.Vector3, THREE.Vector3, THREE.Vector3]));
    }
    wall.dispose();
    const coupling = createPrinterSlideCouplingGeometry(), transform = printerSlideCoupling(index), matrix = new THREE.Matrix4().compose(transform.center, transform.quaternion, new THREE.Vector3(1, 1, 1));
    const cp = coupling.attributes.position, ci = coupling.index!;
    for (let i = 0; i < ci.count; i += 3) {
      const vertices = [ci.getX(i), ci.getX(i + 1), ci.getX(i + 2)];
      if (!vertices.every(vertex => Math.abs(Math.hypot(cp.getX(vertex), cp.getZ(vertex)) - printerSlide.innerRadius) < .000001)) continue;
      const points = vertices.map(vertex => { const value = new THREE.Vector3().fromBufferAttribute(cp, vertex).applyMatrix4(matrix); return new THREE.Vector3(Math.fround(value.x), Math.fround(value.y), Math.fround(value.z)); });
      triangles.push(new THREE.Triangle(...points as [THREE.Vector3, THREE.Vector3, THREE.Vector3]));
    }
    coupling.dispose(); mouthSurfaces.set(index, triangles);
    if (index === 1) {
      const deck = createPrinterSlideExitDeckGeometry(), dp = deck.attributes.position, di = deck.index!;
      for (let i = 0; i < di.count; i += 3) {
        const triangle = new THREE.Triangle(...[0, 1, 2].map(offset => new THREE.Vector3().fromBufferAttribute(dp, di.getX(i + offset))) as [THREE.Vector3, THREE.Vector3, THREE.Vector3]);
        if (triangle.getNormal(new THREE.Vector3()).y > .99) triangles.push(triangle);
      }
      deck.dispose();
    }
  }
  const frame = printerSlideFrame(index), origin = frame.center.clone().addScaledVector(frame.right, lateral).addScaledVector(frame.tangent, axial).addScaledVector(frame.up, -printerSlide.innerRadius + .20);
  const ray = new THREE.Ray(origin, frame.up.clone().negate()), hit = new THREE.Vector3();
  let distance = Infinity, point: THREE.Vector3 | undefined, normal: THREE.Vector3 | undefined;
  for (const triangle of triangles) if (ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, hit)) {
    const candidate = hit.distanceTo(origin); if (candidate < distance) { distance = candidate; point = hit.clone(); normal = triangle.getNormal(new THREE.Vector3()); }
  }
  if (!point || !normal || distance > .30) throw new Error(`Slide mouth${index} has no emitted support at lateral${lateral}, axial${axial}.`);
  return { point: point.toArray(), normal: normal.toArray() };
}

export function samplePrinterSlide(progress: number) {
  const u = THREE.MathUtils.clamp(progress, 0, 1), index = Math.min(last - 1, Math.floor(u * last)), fraction = u * last - index;
  const a = printerSlideRing(index), b = printerSlideRing(index + 1), frame = printerSlideFrame(u);
  // Angle zero is the bottom vertex in every emitted inner ring; interpolation is on an actual edge.
  const firstSeat = a.center.clone().addScaledVector(a.up, -printerSlide.innerRadius), lastSeat = b.center.clone().addScaledVector(b.up, -printerSlide.innerRadius);
  const seat = firstSeat.clone().lerp(lastSeat, fraction).addScaledVector(frame.up, printerSlide.contactInset);
  const wallSeat = (i: number) => { const ring = printerSlideRing(i); return ring.center.addScaledVector(ring.up, -printerSlide.innerRadius); };
  const direction = (i: number) => wallSeat(Math.min(last, i + 1)).sub(wallSeat(Math.max(0, i - 1))).normalize();
  const tangent = direction(index).lerp(direction(index + 1), fraction).normalize(), up = frame.up.clone().addScaledVector(tangent, -frame.up.dot(tangent)).normalize(), right = new THREE.Vector3().crossVectors(up, tangent).normalize();
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, tangent));
  return { center: frame.center.toArray(), seat: seat.toArray(), tangent: tangent.toArray(), up: up.toArray(), right: right.toArray(), contactNormal: frame.up.toArray(), quaternion: quaternion.toArray() };
}

function walk(id: string, points: PrinterTravelPoint[]): PrinterTravelSegment { return Object.freeze({ id, kind: 'walk', points: Object.freeze(points) }); }
function stairs(flight: PrinterFlight, reverse = false): PrinterTravelSegment { return Object.freeze({ id: `${flight.id}-${reverse ? 'down' : 'up'}`, kind: 'stairs', flight, reverse, points: Object.freeze(reverse ? [flight.end, ...flight.treads.map(tread => tread.center).reverse(), flight.start] : [flight.start, ...flight.treads.map(tread => tread.center), flight.end]) }); }
export const printerTravelSegments: readonly PrinterTravelSegment[] = Object.freeze([
  walk('lower-gallery-to-stairs', [point(2.93, 3.5, 3.12), point(3.44, 3.5, 3.12), point(3.44, 3.5, 3.84), printerExternalFlights[0].start]),
  stairs(printerExternalFlights[0]),
  walk('middle-stair-turn', [printerExternalFlights[0].end, point(.475, 5, 3.84), point(.475, 5, 4.55), printerExternalFlights[1].start]),
  stairs(printerExternalFlights[1]),
  walk('upper-gallery-to-core', [printerExternalFlights[1].end, point(3.44, 6.5, 4.55), point(3.44, 6.5, 3.12), point(3.635, 6.5, 3.12), point(3.635, 6.5, 2.30), point(3.61, 6.5, .65), point(3.89, 6.5, .65), point(3.89, 6.5, -.35), point(3.25, 6.5, -.35), point(1.50, 6.5, -.20), point(.45, 6.5, .15), point(-1.59, 6.5, .15), printerCoreFlights[9].start]),
  stairs(printerCoreFlights[9]),
  walk('core-rear-turn', [printerCoreFlights[9].end, point(-1.59, 7.245, -2.10), point(-2.58, 7.245, -2.10), printerCoreFlights[10].start]),
  stairs(printerCoreFlights[10]),
  walk('core-front-turn', [printerCoreFlights[10].end, point(-2.58, 7.99, .16), point(-1.59, 7.99, .16), printerCoreFlights[11].start]),
  stairs(printerCoreFlights[11]),
  walk('roof-to-slide', [printerCoreFlights[11].end, point(-1.59, 9, -2.10), point(-2.10, 9, -2.10), point(-2.10, 9, -.35), point(-1.415, 9, -.30), point(-1.415, 9, .40), point(-2.10, 9, .40), point(-3.10, 9, .40), point(-3.10, 9, printerSlideEntryFloor[2]), slideEntryApproach, printerSlideEntryFloor]),
  Object.freeze({ id: 'tube-descent', kind: 'slide', points: Object.freeze([printerSlideEntryFloor, printerSlideExitFloor]) }),
  walk('slide-to-middle-gallery', [printerSlideExitFloor, point(-3.19, 5, 1.31), point(-3.19, 5, .15), point(-2.58, 5, .15), point(-1.20, 5, .15), point(.45, 5, .15), point(1.50, 5, -.20), point(3.25, 5, -.35), point(3.99, 5, -.35), point(3.99, 5, 2.95), point(3.30, 5, 3.12), point(.475, 5, 3.12), point(.475, 5, 3.84), printerExternalFlights[0].end]),
  stairs(printerExternalFlights[0], true),
  walk('stairs-to-lower-gallery', [printerExternalFlights[0].start, point(3.44, 3.5, 3.84), point(3.44, 3.5, 3.12), point(2.93, 3.5, 3.12)]),
]);

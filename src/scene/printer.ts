import * as THREE from 'three';
import { brushedMetal, directionalWood, glazedCeramic, grainedPlastic, mattePaper, wovenFabric } from './materials';
import { createPlant } from './plants';
import { createPrinterGarden } from './printer-garden';
import { createPrinterAccess } from './printer-access';
import { batchPrinter, printerBox as box, printerCable as cable, printerCylinder as cylinder, printerMesh as mesh, printerRod as rod } from './printer-geometry';

export type PrinterPartId = 'scanner' | 'drawer' | 'print';
export interface PrinterPart {
  id: PrinterPartId;
  label: string;
  initialProgress?: number;
  pickMeshes: THREE.Mesh[];
  setProgress(progress: number): void;
}

export const printerFloors = [3.5, 5.0, 6.5, 9.0] as const;

function surface(name: string, color: string, roughness = .75) {
  const material = new THREE.MeshStandardMaterial({ color, roughness });
  material.name = name; return material;
}

export function createPrinterWorld() {
  const group = new THREE.Group(); group.name = 'printer-neighborhood';
  const scenery = new THREE.Group(); scenery.name = 'printer-fixed-world'; group.add(scenery);
  const blue = grainedPlastic('#17628d', .57, .0013, .05); blue.name = 'enamel-blue';
  const blueDark = grainedPlastic('#164466', .68, .0010); blueDark.name = 'enamel-blue-shadow';
  const blueLight = grainedPlastic('#66a0b6', .64, .0007); blueLight.name = 'blue-gray-frame';
  const coral = grainedPlastic('#ee536e', .68, .0006); coral.name = 'coral-homes';
  const coralDark = surface('coral-recess', '#ba405d');
  const cream = grainedPlastic('#d9d5c8', .64, .0007); cream.name = 'printer-ivory';
  const white = mattePaper('#eee8d9'); white.name = 'warm-paper';
  const ink = surface('print-and-seams', '#293d48', .84);
  const rubber = grainedPlastic('#26323c', .83, .0006); rubber.name = 'rubber-and-cavity';
  const metal = brushedMetal('#929f9e', .34, .74); metal.name = 'steel';
  const gold = brushedMetal('#bc9c66', .42, .6); gold.name = 'brass';
  const wood = directionalWood('#a96d46'); wood.name = 'warm-wood';
  const woodLight = directionalWood('#d4a76b'); woodLight.name = 'light-wood';
  const sofa = wovenFabric('#d56944'); sofa.name = 'rust-upholstery';
  const mustard = wovenFabric('#d8ab46'); mustard.name = 'ochre-fabric';
  const turquoise = wovenFabric('#599d9e'); turquoise.name = 'turquoise-fabric';
  const redFabric = wovenFabric('#a75156'); redFabric.name = 'muted-red-fabric';
  const roomWall = surface('warm-interior', '#d6b287', .94);
  roomWall.emissive.set('#a86f39'); roomWall.emissiveIntensity = .10;
  const tile = glazedCeramic('#d3d0b5'); tile.name = 'ceramic-tile';
  const terracotta = glazedCeramic('#b16447'); terracotta.name = 'terracotta';
  const darkGreen = surface('climbing-vine', '#315c4c');
  const green = surface('green-leaf', '#518969');
  const lightGreen = surface('leaf-highlight', '#88a56f');
  const rose = surface('bougainvillea', '#cc668a');
  const orange = surface('orange-print', '#d7954c');
  const teal = surface('teal-print', '#3d8d91');
  const glow = new THREE.MeshStandardMaterial({ color: '#ffdd9b', emissive: '#ffc57e', emissiveIntensity: 1.7, roughness: .5 }); glow.name = 'warm-bulb';
  const cyan = new THREE.MeshStandardMaterial({ color: '#84cad1', emissive: '#428793', emissiveIntensity: .48, roughness: .58 }); cyan.name = 'control-display';
  const glass = new THREE.MeshStandardMaterial({ color: '#9bd0d7', roughness: .18, metalness: .12, transparent: true, opacity: .12, depthWrite: false }); glass.name = 'side-glass';
  const books = [teal, coralDark, mustard, blueLight, cream, orange];

  function screw(parent: THREE.Group, x: number, y: number, z: number, side = false) {
    const screw = cylinder(parent, metal, .034, .014, [x, y, z], .034, 10);
    screw.rotation.x = side ? 0 : Math.PI / 2;
    if (side) screw.rotation.z = Math.PI / 2;
    const cut = box(parent, ink, side ? [.015, .012, .043] : [.043, .012, .015], [x, y, z + (side ? 0 : .009)], 0);
    if (side) cut.position.x += .009;
  }

  function plant(parent: THREE.Group, x: number, y: number, z: number, variant: number, scale = 2.5, occupied = false) {
    if (occupied) { const result = createPlant(parent, x, y, z, false, variant); result.scale.setScalar(scale); return result; }
    // Unoccupied pots receive the separately authored broadleaf clusters below, rather than two overlapping plants.
    const result = new THREE.Group(); result.position.set(x, y, z); result.scale.setScalar(scale); parent.add(result);
    const profile = [[0, 0], [.044, 0], [.047, .005], [.057, .070], [.062, .077], [.062, .085], [.054, .085], [.0515, .075], [.043, .014], [0, .014]].map(([r, height]) => new THREE.Vector2(r, height));
    mesh(result, [terracotta, cream, blueLight][variant % 3], new THREE.LatheGeometry(profile, 16));
    cylinder(result, ink, .05, .009, [0, .0705, 0], .046, 12); return result;
  }

  function slats(parent: THREE.Group, x: number, y: number, z: number, width: number, count: number, vertical = false) {
    for (let i = 0; i < count; i++) box(parent, ink, vertical ? [.036, .38, .012] : [width, .025, .015], [x + (vertical ? (i - (count - 1) / 2) * .09 : 0), y + (vertical ? 0 : (i - (count - 1) / 2) * .072), z], .005);
  }

  function bookStack(parent: THREE.Group, x: number, y: number, z: number, count = 4, width = .23) {
    for (let i = 0; i < count; i++) {
      const book = new THREE.Group(); book.position.set(x + Math.sin(i * 2.3) * .015, y + .037 * i, z); book.rotation.y = Math.sin(i) * .12; parent.add(book);
      box(book, books[i % books.length], [width, .032, width * .72], [0, .016, 0], .008);
      box(book, white, [width - .014, .014, width * .72 - .01], [0, .016, .004], 0);
    }
  }

  function bookShelf(parent: THREE.Group, x: number, y: number, z: number, width: number, height: number, seed: number) {
    const rack = new THREE.Group(); rack.position.set(x, y, z); parent.add(rack);
    box(rack, wood, [width, height, .05], [0, height / 2, -.12], .014);
    for (const sx of [-1, 1]) box(rack, wood, [.045, height, .30], [sx * width / 2, height / 2, 0], .01);
    for (let row = 0; row < 3; row++) {
      const base = .06 + row * height / 3;
      box(rack, woodLight, [width, .035, .31], [0, base, 0], .01);
      const count = Math.floor(width / .085);
      for (let i = 0; i < count; i++) {
        const h = .17 + ((i * 7 + seed + row) % 4) * .023;
        const book = box(rack, books[(i + row + seed) % books.length], [.055 + i % 2 * .008, h, .21], [-width / 2 + .065 + i * .083, base + h / 2 + .018, -.008], .003);
        book.rotation.z = i === count - 2 ? .12 : 0;
        box(rack, gold, [.023, .011, .004], [book.position.x, base + h * .74, .102], 0);
      }
    }
  }

  function cup(parent: THREE.Group, x: number, y: number, z: number, material = cream) {
    cylinder(parent, material, .043, .065, [x, y + .033, z], .034, 16);
    cylinder(parent, rubber, .035, .003, [x, y + .067, z], .035, 16);
    const handle = mesh(parent, material, new THREE.TorusGeometry(.029, .006, 6, 14), [x + .044, y + .034, z]);
    handle.rotation.y = Math.PI / 2;
    cylinder(parent, tile, .067, .008, [x, y + .004, z], .067, 18);
  }

  function lamp(parent: THREE.Group, x: number, y: number, z: number, tall = false) {
    cylinder(parent, metal, tall ? .10 : .064, .024, [x, y + .012, z]);
    cylinder(parent, gold, .011, tall ? .62 : .24, [x, y + (tall ? .33 : .14), z], .011, 8);
    cylinder(parent, cream, tall ? .12 : .086, .10, [x, y + (tall ? .67 : .29), z], tall ? .19 : .13, 20);
    cylinder(parent, glow, tall ? .17 : .11, .009, [x, y + (tall ? .619 : .239), z], tall ? .17 : .11, 20);
  }

  function art(parent: THREE.Group, x: number, y: number, z: number, size: number, seed: number) {
    box(parent, wood, [size, size * .77, .045], [x, y, z], .009);
    box(parent, cream, [size - .055, size * .77 - .055, .01], [x, y, z + .027], 0);
    box(parent, books[seed % books.length], [size * .32, size * .29, .004], [x - size * .15, y - size * .09, z + .034], .02);
    const sun = cylinder(parent, mustard, size * .105, .005, [x + size * .19, y + size * .11, z + .036], size * .105, 16); sun.rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) box(parent, teal, [size * .37, .017, .004], [x + size * .04, y - size * .12 - i * .045, z + .035], 0);
  }

  function seat(parent: THREE.Group, x: number, y: number, z: number, material: THREE.Material, armchair = false, facing = 0) {
    const chair = new THREE.Group(); chair.position.set(x, y, z); chair.rotation.y = facing; parent.add(chair);
    const width = armchair ? .59 : .40;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylinder(chair, wood, .021, .23, [sx * (width / 2 - .06), .115, sz * .15], .018, 8);
    box(chair, wood, [width, .06, .42], [0, .257, 0], .02);
    box(chair, material, [width - .018, .035, .42], [0, .2795, 0], .012);
    box(chair, armchair ? material : wood, [width, armchair ? .45 : .33, .075], [0, armchair ? .505 : .425, -.205], .03);
    if (armchair) {
      for (const sx of [-1, 1]) box(chair, material, [.085, .19, .42], [sx * (width / 2 + .008), .37, 0], .026);
      box(chair, mustard, [.19, .17, .055], [-.11, .48, -.15], .02).rotation.z = -.18;
    }
  }

  function vine(parent: THREE.Group, x: number, y: number, z: number, length: number, seed: number, blossoms = false) {
    const points: [number, number, number][] = [];
    for (let i = 0; i <= 7; i++) points.push([x + Math.sin(i * .88 + seed) * .055, y - length * i / 7, z + Math.sin(i * 1.7) * .026]);
    cable(parent, darkGreen, points, .009, 14);
    for (let i = 0; i < Math.round(length * 16); i++) {
      const at = new THREE.Vector3(x + Math.sin(i * 1.7 + seed) * .08, y - length * i / Math.round(length * 16), z + .02);
      const leaf = mesh(parent, i % 4 ? green : lightGreen, new THREE.SphereGeometry(.057, 6, 4), [at.x, at.y, at.z]);
      leaf.scale.set(1, .48, .18); leaf.rotation.z = Math.sin(i * 2.4) * .8;
      if (blossoms && i % 3 === 0) {
        for (let p = 0; p < 3; p++) {
          const petal = mesh(parent, rose, new THREE.IcosahedronGeometry(.029, 0), [at.x + Math.cos(p * 2.1) * .027, at.y + Math.sin(p * 2.1) * .027, at.z + .023]);
          petal.scale.z = .45;
        }
      }
    }
  }

  function fullLeaf(parent: THREE.Group, base: THREE.Vector3, tip: THREE.Vector3, width: number, material: THREE.Material) {
    const direction = tip.clone().sub(base), across = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
    const positions: number[] = [], uv: number[] = [], indices: number[] = [];
    const rows = 5, stride = 3, count = (rows + 1) * stride;
    for (const surface of [1, -1]) for (let row = 0; row <= rows; row++) {
      const t = row / rows, center = base.clone().lerp(tip, t); center.y += Math.sin(t * Math.PI) * direction.length() * .13;
      const taper = Math.max(.008, Math.pow(Math.sin(t * Math.PI), .72));
      for (let column = 0; column < 3; column++) {
        const side = column - 1, point = center.clone().addScaledVector(across, side * width * taper);
        point.y += Math.abs(side) * width * .15 * Math.sin(t * Math.PI) + surface * .0015;
        positions.push(point.x, point.y, point.z); uv.push(t, column / 2);
      }
    }
    for (let row = 0; row < rows; row++) for (let column = 0; column < 2; column++) {
      const a = row * stride + column, b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1, a + count, a + count + 1, b + count, b + count, a + count + 1, b + count + 1);
    }
    const perimeter: number[] = [];
    for (let row = 0; row <= rows; row++) perimeter.push(row * stride);
    perimeter.push(rows * stride + 1);
    for (let row = rows; row >= 0; row--) perimeter.push(row * stride + 2);
    perimeter.push(1);
    for (let i = 0; i < perimeter.length; i++) { const a = perimeter[i], b = perimeter[(i + 1) % perimeter.length]; indices.push(a, a + count, b, b, a + count, b + count); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    mesh(parent, material, geometry);
    rod(parent, darkGreen, base, tip, .004, 5);
  }

  function lushPlant(parent: THREE.Group, x: number, y: number, z: number, scale: number, seed: number) {
    const center = new THREE.Vector3(x, y, z);
    for (let leaf = 0; leaf < 12; leaf++) {
      const angle = leaf * 2.399 + seed * .7, rise = .13 + leaf % 4 * .047, reach = .17 + leaf % 3 * .041;
      const stalk = center.clone().add(new THREE.Vector3(Math.sin(angle) * .025, .13 + leaf % 3 * .034, Math.cos(angle) * .025).multiplyScalar(scale));
      rod(parent, darkGreen, center, stalk, .007 * scale, 6);
      const tip = stalk.clone().add(new THREE.Vector3(Math.sin(angle) * reach, rise, Math.cos(angle) * reach).multiplyScalar(scale));
      fullLeaf(parent, stalk, tip, (.053 + leaf % 2 * .014) * scale, leaf % 3 ? green : lightGreen);
    }
  }

  function gear(parent: THREE.Group, x: number, y: number, z: number, radius: number, material: THREE.Material) {
    const wheel = cylinder(parent, material, radius, .095, [x, y, z], radius, 24); wheel.rotation.z = Math.PI / 2;
    const hub = cylinder(parent, metal, radius * .29, .13, [x - .014, y, z], radius * .29, 16); hub.rotation.z = Math.PI / 2;
    for (let tooth = 0; tooth < 15; tooth++) {
      const angle = tooth * Math.PI * 2 / 15;
      const toothMesh = box(parent, material, [.08, radius * .22, radius * .23], [x, y + Math.sin(angle) * radius, z + Math.cos(angle) * radius], .005); toothMesh.rotation.x = -angle;
    }
  }

  const miniature = 1.6 / 2.2;
  function smallSeat(parent: THREE.Group, x: number, y: number, z: number, material: THREE.Material, armchair = false, facing = 0) {
    const anchor = new THREE.Group(); anchor.position.set(x, y, z); anchor.scale.setScalar(miniature); parent.add(anchor); seat(anchor, 0, 0, 0, material, armchair, facing);
  }
  function littleCup(parent: THREE.Group, x: number, y: number, z: number, material = cream) {
    const anchor = new THREE.Group(); anchor.position.set(x, y, z); anchor.scale.setScalar(miniature); parent.add(anchor); cup(anchor, 0, 0, 0, material);
  }
  function littleLamp(parent: THREE.Group, x: number, y: number, z: number, tall = false) {
    const anchor = new THREE.Group(); anchor.position.set(x, y, z); anchor.scale.setScalar(miniature); parent.add(anchor); lamp(anchor, 0, 0, 0, tall);
  }
  function floorPlate(parent: THREE.Group, material: THREE.Material, x: number, y: number, z: number, width: number, depth: number) {
    return box(parent, material, [width, .12, depth], [x, y - .06, z], 0);
  }
  function namedFeature(name: string) { const feature = new THREE.Group(); feature.name = name; scenery.add(feature); return feature; }
  function castsDetailShadow(material: THREE.Material) { return !material.transparent && ![rose, glow, green, lightGreen, darkGreen].includes(material as THREE.MeshStandardMaterial); }
  function finishFeature(feature: THREE.Group) {
    batchPrinter(feature).forEach(batch => { batch.castShadow = castsDetailShadow(batch.material as THREE.Material); });
    feature.userData.printerFeature = true;
  }
  function frameWindow(parent: THREE.Group, x: number, y: number, z: number, width: number, height: number, surfaceMaterial = woodLight) {
    for (const sx of [-1, 1]) box(parent, surfaceMaterial, [.040, height, .045], [x + sx * width / 2, y, z], .008);
    for (const sy of [-1, 1]) box(parent, surfaceMaterial, [width, .040, .045], [x, y + sy * height / 2, z], .008);
    box(parent, surfaceMaterial, [.025, height, .030], [x, y, z + .005], .006);
    box(parent, glass, [width - .05, height - .05, .008], [x, y, z - .015], 0);
  }
  function sideWindow(parent: THREE.Group, x: number, y: number, z: number, width: number, height: number, surfaceMaterial = woodLight) {
    const frame = new THREE.Group(); frame.position.set(x, y, z); frame.rotation.y = Math.PI / 2; parent.add(frame); frameWindow(frame, 0, 0, 0, width, height, surfaceMaterial);
  }
  type Bounds = [number, number, number, number, number, number];
  function carvedBox(parent: THREE.Group, material: THREE.Material, bounds: Bounds, openings: Bounds[], name: string, radius = 0) {
    let pieces: Bounds[] = [bounds];
    for (const opening of openings) {
      pieces = pieces.flatMap(piece => {
        const intersection: Bounds = [Math.max(piece[0], opening[0]), Math.min(piece[1], opening[1]), Math.max(piece[2], opening[2]), Math.min(piece[3], opening[3]), Math.max(piece[4], opening[4]), Math.min(piece[5], opening[5])];
        if (intersection[1] <= intersection[0] || intersection[3] <= intersection[2] || intersection[5] <= intersection[4]) return [piece];
        const [left, right, bottom, top, back, front] = piece, [a, b, c, d, e, f] = intersection;
        return [[left, a, bottom, top, back, front], [b, right, bottom, top, back, front], [a, b, bottom, c, back, front], [a, b, d, top, back, front], [a, b, c, d, back, e], [a, b, c, d, f, front]].filter(part => part[1] - part[0] > .0001 && part[3] - part[2] > .0001 && part[5] - part[4] > .0001) as Bounds[];
      });
    }
    pieces.forEach((part, index) => box(parent, material, [part[1] - part[0], part[3] - part[2], part[5] - part[4]], [(part[0] + part[1]) / 2, (part[2] + part[3]) / 2, (part[4] + part[5]) / 2], radius).name = `${name}-${index}`);
  }
  function openDoor(parent: THREE.Group, x: number, floor: number, z: number, width: number, height: number, name: string, normal = 0, hingeRight = true, swing = Math.PI / 2, leafMaterial = glass) {
    const frame = new THREE.Group(); frame.position.set(x, floor, z); frame.rotation.y = normal; parent.add(frame);
    for (const side of [-1, 1]) box(frame, woodLight, [.028, height, .038], [side * width / 2, height / 2, 0], .006).name = `${name}-jamb-${side}`;
    box(frame, woodLight, [width + .028, .030, .038], [0, height, 0], .006).name = `${name}-header`;
    const leaf = new THREE.Group(), direction = hingeRight ? -1 : 1; leaf.position.x = -direction * width / 2; leaf.rotation.y = swing; frame.add(leaf);
    box(leaf, leafMaterial, [width - .042, height - .060, .009], [direction * width / 2, height / 2, 0], 0).name = `${name}-open-leaf`;
    for (const edge of [.023, width - .023]) box(leaf, woodLight, [.023, height - .020, .029], [direction * edge, height / 2, 0], .004).name = `${name}-leaf-stile`;
    for (const rise of [.022, height - .022]) box(leaf, woodLight, [width - .042, .025, .029], [direction * width / 2, rise, 0], .004).name = `${name}-leaf-rail`;
    cylinder(leaf, gold, .012, .018, [direction * (width - .060), height * .48, .023], .012, 8).rotation.x = Math.PI / 2;
  }
  const core: Bounds = [-2.95, -1.25, .10, 9.01, -2.28, .32];
  const floorExits: Bounds[] = [3.5, 5, 6.5].map(y => [-1.27, .26, y, y + .85, .04, .38]);
  const roofOpening: Bounds = [-1.88, -1.27, 8.70, 9.10, -2.35, -.62];

  // The machine is a solid rounded copier first. Rooms occupy its right flank, not its full width.
  const lowerBody = namedFeature('solid-lower-machine');
  for (const x of [-3.15, 3.15]) for (const z of [-2.0, 2.0]) {
    box(lowerBody, rubber, [.72, .18, .64], [x, .10, z], .07);
    box(lowerBody, blueDark, [.88, .14, .73], [x, .24, z], .055);
  }
  carvedBox(lowerBody, blueDark, [-3.7, 3.7, .25, .57, -2.59, 2.59], [core, [-2.89, -2.25, .10, .95, -2.61, -2.18]], 'printer-base-core-carve', .04);
  box(lowerBody, blue, [3.72, 2.93, 5.14], [1.83, 1.97, -.015], .24).name = 'drawer-concealed-housing';
  carvedBox(lowerBody, blue, [-3.66, .20, .45, 7.59, -2.575, 1.235], [core, ...floorExits, [-2.89, -2.25, .10, .95, -2.61, -2.18]], 'printer-left-core-housing', .022);
  box(lowerBody, blue, [.32, 7.14, 1.40], [-3.50, 4.02, 1.91], .12);
  box(lowerBody, blueDark, [.30, 3.63, 1.32], [-.12, 2.39, 1.89], .065);
  carvedBox(lowerBody, blue, [-3.67, 3.67, 3.15, 3.47, -2.56, 2.54], [core], 'printer-middle-core-carve', .022);
  carvedBox(lowerBody, blue, [-3.685, .245, 7.47, 8.01, -2.56, 1.22], [core], 'printer-upper-core-carve', .022);
  carvedBox(lowerBody, blueDark, [-3.625, 3.625, .39, 7.75, -2.56, -2.28], [[-2.89, -2.25, .10, .95, -2.58, -2.26]], 'printer-rear-entry-housing', .015);
  for (const y of [.74, 3.32]) carvedBox(lowerBody, ink, [-3.62, 3.62, y - .0165, y + .0165, -2.56, 2.54], [core, [-2.89, -2.25, .10, .95, -2.61, -2.18]], 'printer-body-seam');
  for (const y of [1.3, 2.6]) {
    box(lowerBody, blueDark, [.028, .90, 1.08], [3.66, y, -.88], .035);
    for (let i = 0; i < 9; i++) box(lowerBody, ink, [.014, .033, .77], [3.683, y - .30 + i * .075, -.89], .005);
  }
  for (const y of [1.1, 2.50]) {
    box(lowerBody, blueLight, [.050, .62, .79], [3.69, y, 1.08], .045);
    for (const z of [.76, 1.40]) for (const dy of [-.23, .23]) screw(lowerBody, 3.724, y + dy, z, true);
  }
  for (let i = 0; i < 9; i++) box(lowerBody, [cream, coral, blueLight, gold][i % 4], [.014, .068 + i % 2 * .033, .052], [3.69, 2.70 - i * .13, .28 + i % 3 * .10], .006);
  finishFeature(lowerBody);

  // A deep roller throat and hanging service bundles sit beneath the broad ivory arched hood.
  const throat = namedFeature('printer-output-throat');
  box(throat, rubber, [3.20, 3.39, .08], [-1.72, 2.67, 1.19], .025);
  box(throat, blueDark, [3.15, .15, 1.46], [-1.72, 1.11, 1.96], .035);
  for (const x of [-3.17, -.29]) {
    box(throat, blueLight, [.14, 3.23, .18], [x, 2.70, 1.82], .024);
    cylinder(throat, metal, .029, 2.60, [x, 2.64, 2.13], .029, 14);
  }
  for (const [y, z] of [[1.40, 2.04], [2.17, 1.80], [3.15, 1.83], [3.76, 2.31]]) {
    const roller = cylinder(throat, rubber, .16, 2.39, [-1.70, y, z], .16, 28); roller.rotation.z = Math.PI / 2;
    const axle = cylinder(throat, metal, .047, 2.80, [-1.70, y, z], .047, 14); axle.rotation.z = Math.PI / 2;
    for (let i = 0; i < 7; i++) { const grip = cylinder(throat, blueLight, .164, .038, [-2.75 + i * .351, y, z], .164, 18); grip.rotation.z = Math.PI / 2; }
  }
  gear(throat, -.27, 3.15, 1.83, .20, metal); gear(throat, -.27, 3.49, 1.81, .15, gold); gear(throat, -3.14, 2.16, 1.80, .20, cream);
  for (let i = 0; i < 13; i++) cable(throat, [ink, blueLight, coralDark, gold][i % 4], [[-3.0 + i * .207, 4.29, 1.45], [-2.96 + i * .201, 3.88, 1.72], [-2.84 + i * .186, 3.10 - i % 4 * .17, 1.44], [-2.28 + i * .15, 2.64, 1.34]], .021, 20);
  box(throat, blue, [2.77, .12, .87], [-1.72, 3.59, 2.16], .035);
  for (let i = 0; i < 6; i++) box(throat, ink, [.042, .035, .72], [-2.83 + i * .45, 3.67, 2.18], .005);
  finishFeature(throat);
  const hood = namedFeature('curved-printer-cover');
  const hoodProfile = new THREE.Shape();
  hoodProfile.moveTo(-1.90, 7.26); hoodProfile.quadraticCurveTo(-2.42, 7.23, -2.68, 6.72);
  hoodProfile.quadraticCurveTo(-3.05, 5.90, -3.05, 5.27); hoodProfile.lineTo(-3.05, 4.68);
  hoodProfile.lineTo(-2.85, 4.57); hoodProfile.lineTo(-2.84, 5.24);
  hoodProfile.quadraticCurveTo(-2.83, 5.88, -2.49, 6.66); hoodProfile.quadraticCurveTo(-2.24, 7.05, -1.90, 7.06); hoodProfile.closePath();
  const hoodGeometry = new THREE.ExtrudeGeometry(hoodProfile, { depth: 3.45, bevelEnabled: true, bevelSize: .027, bevelThickness: .027, bevelSegments: 3, curveSegments: 28, steps: 1 });
  hoodGeometry.rotateY(Math.PI / 2); mesh(hood, cream, hoodGeometry, [-3.52, 0, 0]);
  box(hood, cream, [.19, 3.66, .42], [-.035, 2.97, 2.70], .14);
  box(hood, blueLight, [.065, 3.64, .46], [.080, 2.97, 2.70], .045);
  box(hood, blueDark, [1.15, .065, .025], [-2.19, 5.41, 3.071], .015);
  box(hood, metal, [.65, .016, .031], [-2.19, 5.443, 3.093], .007);
  for (const x of [-3.22, -.39]) for (const y of [4.96, 5.85]) screw(hood, x, y, 3.075);
  for (let i = 0; i < 5; i++) box(hood, ink, [.024, .09, .007], [-.71 + i * .041, 5.11, 3.079], .003);
  box(hood, coral, [.089, .027, .009], [-.66, 5.88, 3.08], .006);
  for (let i = 0; i < 7; i++) { const seam = box(hood, ink, [.012, .38, .006], [-3.21 + i * .438, 6.91, 2.65], .002); seam.rotation.x = -.46; }
  finishFeature(hood);

  // Compact rooms have solid windowed fronts and distinct setbacks, with narrow right-side galleries.
  const residential = namedFeature('coral-residential-wing');
  for (let level = 0; level < 3; level++) {
    const y = [3.5, 5.0, 6.5][level], cyanLevel = level === 2, front = level === 1 ? 2.51 : 2.57;
    floorPlate(residential, coral, 1.85, y - .024, 1.5575, 3.42, 2.175).name = `printer-room-structure-${level}`;
    box(residential, woodLight, [3.12, .022, 2.24], [1.73, y - .011, 1.55], .008).name = `printer-room-wood-${level}`;
    for (let plank = 0; plank < 16; plank++) box(residential, wood, [3.05, .002, .007], [1.72, y + .001, .48 + plank * .13], 0);
    carvedBox(residential, roomWall, [.145, 3.335, y, y + 1.31, .3825, .4575], [[2.02, 2.46, y, y + .90, .36, .48]], `printer-room-rear-door-wall-${level}`, .008);
    openDoor(residential, 2.24, y, .42, .44, .90, `printer-room-rear-door-${level}`, 0, false, Math.PI / 2);
    box(residential, woodLight, [.56, .022, .11], [2.24, y - .011, .375], 0).name = `printer-room-rear-threshold-${level}`;
    box(residential, coral, [.115, 1.37, 2.23], [.14, y + .685, 1.48], .023);
    box(residential, coral, [3.44, .15, 2.38], [1.80, y + 1.34, 1.55], .03);
    box(residential, cyanLevel ? blueLight : coral, [3.29, .24, .17], [1.77, y + 1.20, front], .035);
    carvedBox(residential, cyanLevel ? blueLight : coral, [.125, 3.415, y, y + .27, front - .085, front + .085], [[2.70, 3.28, y, y + .28, front - .10, front + .10]], `printer-room-front-door-sill-${level}`, .010);
    for (const x of [.19, 1.32, 3.32]) box(residential, cyanLevel ? blueLight : coral, [.13, 1.09, .16], [x, y + .695, front], .023);
    if (level === 0) {
      // The one exposed lower-front living room is framed by the surrounding solid coral house.
      box(residential, coral, [.12, .22, .17], [.20, y + .30, front], .03);
      frameWindow(residential, 1.99, y + .72, front + .094, 1.18, .90);
    } else {
      frameWindow(residential, .76, y + .70, front + .095, .96, .92);
      frameWindow(residential, 1.99, y + .70, front + .095, 1.18, .92);
    }
    openDoor(residential, 2.99, y, front + .095, .53, .99, `printer-room-front-door-${level}`, 0, true, -Math.PI / 2);
    for (const z of [.50, 2.43]) box(residential, coral, [.13, 1.29, .12], [3.34, y + .685, z], .025);
    for (const sy of [.15, 1.20]) box(residential, cyanLevel ? blueLight : coral, [.12, .22, 1.98], [3.34, y + sy, 1.49], .029);
    box(residential, glass, [.009, .93, 1.76], [3.413, y + .70, 1.48], 0);
    for (const z of [.58, 1.48, 2.38]) box(residential, woodLight, [.036, .94, .041], [3.421, y + .70, z], .007);
    smallSeat(residential, .80, y, 1.05, [sofa, mustard, turquoise][level], true);
    smallSeat(residential, 2.55, y, .85, [turquoise, redFabric, mustard][level]);
    box(residential, woodLight, [.74, .034, .32], [2.55, y + .303, 1.17], .016);
    for (const x of [2.24, 2.86]) for (const z of [1.05, 1.29]) cylinder(residential, wood, .015, .286, [x, y + .143, z], .013, 7);
    const shelf = new THREE.Group(); shelf.position.set(.80, y + .44, .61); shelf.scale.setScalar(miniature); residential.add(shelf); bookShelf(shelf, 0, 0, 0, 1.07, .73, level);
    art(residential, 2.74, y + .91, .471, .27, level + 1); littleLamp(residential, 2.85, y + .32, 1.19); littleCup(residential, 2.34, y + .32, 1.17, terracotta);
    bookStack(residential, 2.91, y + .32, 1.20, 2, .13);
    plant(residential, .37, y, 1.89, level, 1.8); lushPlant(residential, .37, y + .13, 1.89, .54, level);
    const light = new THREE.PointLight('#ffc783', .43, 2.6, 2); light.position.set(1.62, y + .94, 1.48); residential.add(light);
    cylinder(residential, glow, .09, .027, [1.75, y + 1.16, 1.47], .058, 16);
    if (level === 0) {
      box(residential, wood, [.55, .34, .32], [1.62, y + .17, .72], .018);
      for (let i = 0; i < 2; i++) box(residential, woodLight, [.24, .27, .017], [1.48 + i * .28, y + .17, .894], .008);
      art(residential, 1.77, y + .90, .471, .49, 4);
      box(residential, redFabric, [.61, .005, .43], [.80, y - .0015, 1.44], .004);
    } else if (level === 1) {
      box(residential, wood, [.51, .64, .036], [1.75, y + .85, .477], .013);
      for (let i = 0; i < 5; i++) { const note = box(residential, i % 2 ? white : mustard, [.145, .12, .005], [1.61 + i % 2 * .23, y + 1.04 - Math.floor(i / 2) * .18, .502], .003); note.rotation.z = Math.sin(i) * .10; }
      box(residential, blueLight, [.30, .45, .25], [1.74, y + .225, .76], .021);
      for (let i = 0; i < 3; i++) box(residential, cream, [.245, .113, .020], [1.74, y + .088 + i * .14, .897], .009);
      bookStack(residential, 1.75, y + .454, .76, 5, .18);
    } else {
      box(residential, wood, [.68, .42, .36], [1.55, y + .21, .72], .017); box(residential, cream, [.74, .031, .40], [1.55, y + .4355, .73], .013);
      for (let i = 0; i < 5; i++) for (let row = 0; row < 3; row++) box(residential, i % 3 ? tile : teal, [.13, .11, .009], [1.28 + i * .134, y + .60 + row * .115, .465], .004);
      cable(residential, metal, [[1.77, y + .453, .61], [1.77, y + .59, .61], [1.77, y + .61, .72], [1.77, y + .55, .75]], .008, 10);
      for (let i = 0; i < 3; i++) cylinder(residential, tile, .052, .009, [1.47, y + .455 + i * .01, .73], .052, 16);
      littleCup(residential, 1.65, y + .451, .73);
    }
    floorPlate(residential, level === 2 ? blueLight : coral, 1.88, y, 3.01, 3.27, .68);
    const entry = level === 1 ? .60 : 3.30, entryHalf = .27;
    for (const [left, right] of [[.28, entry - entryHalf], [entry + entryHalf, 3.48]]) if (right > left + .02) {
      for (const [rise, height] of [[.345, .038], [.061, .025]]) box(residential, blueDark, [right - left, height, .030], [(left + right) / 2, y + rise, 3.43], .006);
    }
    for (let i = 0; i < 60; i++) { const x = .29 + i * .054; if (x > entry - entryHalf && x < entry + entryHalf) continue; cylinder(residential, blueDark, .009, .30, [x, y + .20, 3.43], .009, 6); }
    for (const x of [.29, entry - entryHalf, entry + entryHalf, 3.47]) { if (x > 3.49 || x > entry - entryHalf + .001 && x < entry + entryHalf - .001) continue; cylinder(residential, blueDark, .015, .36, [x, y + .18, 3.43], .015, 8); }
    for (const x of [.33, 3.26]) { box(residential, blueLight, [.33, .13, .22], [x, y + 1.10, front + .13], .018); for (let i = 0; i < 4; i++) vine(residential, x - .13 + i * .088, y + 1.18, front + .27, .26 + i % 3 * .16, level * 3 + i, true); }
  }
  // The homes continue around the copier's visible right flank with actual furnished depth.
  for (let level = 0; level < 3; level++) {
    const y = 3.5 + level * 1.5, outer = level === 1 ? 3.76 : 3.61, skin = level === 2 ? blueLight : coral;
    floorPlate(residential, skin, 1.94, y - .024, -1.02, outer * 1.0 - .18, 2.87).name = `printer-side-structure-${level}`;
    box(residential, woodLight, [outer - .35, .022, 2.68], [(outer + .18) / 2, y - .011, -1.02], .01).name = `printer-side-wood-${level}`;
    box(residential, roomWall, [outer - .24, 1.29, .073], [(outer + .18) / 2, y + .645, -2.39], .018);
    carvedBox(residential, coralDark, [.145, .255, y, y + 1.27, -2.40, .36], [[.13, .27, y, y + .85, -.15, .38]], `printer-core-room-exit-${level}`, .006);
    box(residential, skin, [outer - .12, .15, 2.94], [(outer + .12) / 2, y + 1.34, -1.02], .025);
    box(residential, skin, [.15, .26, 2.89], [outer, y + 1.20, -1.02], .034);
    carvedBox(residential, skin, [outer - .075, outer + .075, y, y + .26, -2.465, .425], [[outer - .09, outer + .09, y, y + .27, -.62, -.08]], `printer-side-door-sill-${level}`, .010);
    for (const z of [-2.39, -1.09, .38]) box(residential, skin, [.15, 1.02, .13], [outer, y + .70, z], .024);
    sideWindow(residential, outer + .085, y + .70, -1.74, 1.13, .92);
    sideWindow(residential, outer + .085, y + .70, -.83, .35, .92);
    sideWindow(residential, outer + .085, y + .70, .13, .36, .92);
    openDoor(residential, outer + .085, y, -.35, .54, 1.01, `printer-side-room-door-${level}`, Math.PI / 2, true, -Math.PI / 2);
    for (let plank = 0; plank < 16; plank++) box(residential, wood, [outer - .41, .002, .006], [(outer + .18) / 2, y + .001, -2.28 + plank * .165], 0);
    bookShelf(residential, 1.48, y + .04, -2.17, .91, .80, level + 6);
    art(residential, 2.62, y + .84, -2.338, .55, level + 3);
    if (level === 0) {
      smallSeat(residential, 2.72, y, -1.54, sofa, true, Math.PI / 2);
      box(residential, woodLight, [.46, .030, .49], [2.77, y + .305, -.72], .015);
      for (const x of [2.60, 2.94]) for (const z of [-.89, -.55]) cylinder(residential, wood, .016, .29, [x, y + .145, z], .014, 7);
      littleCup(residential, 2.81, y + .32, -.77); bookStack(residential, 2.65, y + .32, -.65, 3, .14);
      littleLamp(residential, 2.05, y, -1.80, true);
    } else if (level === 1) {
      box(residential, wood, [1.10, .35, .36], [2.73, y + .175, -1.60], .019); box(residential, cream, [1.16, .027, .39], [2.73, y + .3635, -1.60], .017);
      for (let i = 0; i < 3; i++) box(residential, white, [.24, .009, .18], [2.40 + i * .33, y + .383 + i % 2 * .01, -1.58], .004);
      for (let i = 0; i < 5; i++) cylinder(residential, books[i], .016, .11 + i % 2 * .035, [3.09 - i * .027, y + .449, -1.68], .013, 7);
      littleLamp(residential, 2.31, y + .377, -1.62); smallSeat(residential, 2.78, y, -.99, turquoise, false, Math.PI);
    } else {
      box(residential, wood, [.78, .12, 1.16], [2.57, y + .06, -1.48], .028); box(residential, turquoise, [.76, .115, 1.12], [2.57, y + .1775, -1.48], .035);
      box(residential, cream, [.57, .059, .23], [2.57, y + .2595, -1.85], .028); box(residential, mustard, [.77, .021, .66], [2.57, y + .247, -1.17], .023);
      box(residential, wood, [.48, .31, .34], [1.83, y + .155, -1.81], .023); littleLamp(residential, 1.83, y + .31, -1.80);
    }
    plant(residential, 1.10, y, -.55, level + 2, 1.85); lushPlant(residential, 1.10, y + .14, -.55, .58, level + 4);
    const sideLight = new THREE.PointLight('#ffc989', .36, 2.65, 2); sideLight.position.set(2.63, y + .96, -1.04); residential.add(sideLight);
    cylinder(residential, glow, .08, .025, [2.28, y + 1.17, -1.07], .058, 14);
    if (level < 2) {
      floorPlate(residential, coral, outer + .2175, y, .24, .605, 4.71).name = `printer-side-gallery-${level}`;
      for (const rise of [.06, .34]) box(residential, blueDark, [.024, .027, 4.70], [outer + .55, y + rise, .24], .006);
      for (let i = 0; i < 86; i++) cylinder(residential, blueDark, .009, .29, [outer + .55, y + .20, -2.06 + i * .054], .009, 6);
      for (let i = 0; i < 8; i++) vine(residential, outer + .12, y + 1.42, -2.21 + i * .52, .46 + i % 3 * .17, i + level, true);
    }
  }
  finishFeature(residential);

  // The small enclosed upper-front band belongs to the copier beneath its scanner crown.
  const upperBand = namedFeature('upper-window-band');
  box(upperBand, coralDark, [3.39, .77, .12], [-1.73, 7.57, 1.65], .026);
  box(upperBand, coral, [3.47, .18, .24], [-1.73, 7.89, 1.77], .045);
  box(upperBand, coral, [3.47, .14, .34], [-1.73, 7.25, 1.81], .04);
  for (const x of [-3.34, -1.65, -.11]) box(upperBand, coral, [.13, .64, .14], [x, 7.57, 1.76], .025);
  for (const [x, width] of [[-2.49, 1.48], [-.87, 1.31]]) {
    box(upperBand, roomWall, [width - .06, .55, .026], [x, 7.57, 1.73], .012);
    frameWindow(upperBand, x, 7.57, 1.84, width, .55, woodLight);
    box(upperBand, glow, [width - .15, .011, .023], [x, 7.80, 1.783], .006);
  }
  box(upperBand, blueLight, [3.50, .065, .43], [-1.73, 7.30, 1.97], .028);
  for (let i = 0; i < 6; i++) bookStack(upperBand, -2.90 + i * .43, 7.335, 2.03, 2 + i % 3, .19);
  plant(upperBand, -.26, 7.335, 2.03, 2, 1.25);
  lushPlant(upperBand, -.26, 7.427, 2.03, .40, 2);
  finishFeature(upperBand);

  // Pale cyan glazing wraps the upper-right corner, with an inhabited projecting office.
  const annex = namedFeature('projecting-room');
  const bayShape = new THREE.Shape(); bayShape.moveTo(3.29, .43); bayShape.lineTo(4.65, .43); bayShape.lineTo(4.65, 1.99); bayShape.quadraticCurveTo(4.65, 2.67, 4.03, 2.67); bayShape.lineTo(3.29, 2.67); bayShape.closePath();
  for (const [top, depth] of [[6.5, .12], [7.98, .17]]) {
    const solid = new THREE.ExtrudeGeometry(bayShape, { depth, bevelEnabled: false, curveSegments: 20, steps: 1 }); solid.rotateX(Math.PI / 2); mesh(annex, blueLight, solid, [0, top, 0]);
  }
  carvedBox(annex, roomWall, [3.28, 4.58, 6.505, 7.835, .39, .47], [[3.62, 4.16, 6.50, 7.46, .38, .48]], 'printer-annex-rear-door-wall', .008);
  openDoor(annex, 3.89, 6.5, .43, .54, .96, 'printer-annex-rear-door');
  carvedBox(annex, blueLight, [3.19, 4.03, 6.5, 6.75, 2.57, 2.73], [[3.365, 3.905, 6.49, 6.76, 2.56, 2.74]], 'printer-annex-front-door-sill', .012);
  box(annex, blueLight, [.84, .22, .16], [3.61, 7.87, 2.65], .04);
  for (const x of [3.25, 4.02]) box(annex, cream, [.048, 1.02, .056], [x, 7.26, 2.69], .013);
  openDoor(annex, 3.635, 6.5, 2.695, .54, 1.01, 'printer-annex-front-door');
  for (const rise of [6.625, 7.87]) box(annex, blueLight, [.16, .25, 1.58], [4.65, rise, 1.22], .04);
  sideWindow(annex, 4.70, 7.26, 1.22, 1.42, .94, cream);
  const cornerCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(4.03, 0, 2.67), new THREE.Vector3(4.65, 0, 2.67), new THREE.Vector3(4.65, 0, 1.99));
  const curvedGlassPositions: number[] = [], curvedGlassIndices: number[] = [];
  for (let i = 0; i <= 20; i++) {
    const point = cornerCurve.getPoint(i / 20); curvedGlassPositions.push(point.x, 6.78, point.z, point.x, 7.74, point.z);
    if (i < 20) { const a = i * 2; curvedGlassIndices.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    if (i % 5 === 0) cylinder(annex, cream, .022, 1.04, [point.x, 7.26, point.z], .022, 8);
  }
  const curvedGlassGeometry = new THREE.BufferGeometry(); curvedGlassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(curvedGlassPositions, 3)); curvedGlassGeometry.setIndex(curvedGlassIndices); curvedGlassGeometry.computeVertexNormals();
  const curvedGlass = glass.clone(); curvedGlass.side = THREE.DoubleSide; curvedGlass.name = 'cyan-corner-glass'; mesh(annex, curvedGlass, curvedGlassGeometry);
  for (const [y, radius, material] of [[6.63, .12, blueLight], [6.78, .021, cream], [7.74, .021, cream], [7.87, .11, blueLight]] as const) cable(annex, material, cornerCurve.getPoints(20).map(point => [point.x, y, point.z]), radius, 24);
  box(annex, wood, [.65, .34, .34], [4.06, 6.67, 1.25], .018); box(annex, cream, [.70, .038, .387], [4.06, 6.861, 1.2535], .014);
  littleLamp(annex, 4.36, 6.88, 1.24); bookStack(annex, 3.84, 6.88, 1.25, 3, .15); art(annex, 4.35, 7.56, .478, .30, 3);
  plant(annex, 4.36, 6.5, 2.06, 1, 1.9); lushPlant(annex, 4.36, 6.64, 2.06, .58, 3);
  for (let i = 0; i < 7; i++) { const point = cornerCurve.getPoint(i / 6); vine(annex, point.x, 7.99, point.z, .37 + i % 3 * .15, i, true); }
  floorPlate(annex, blueLight, 3.8925, 6.5, -.9425, .735, 2.745).name = 'printer-side-gallery-2';
  for (const y of [6.56, 6.84]) box(annex, blueDark, [.024, .027, 2.71], [4.28, y, -.94], .006);
  for (let i = 0; i < 51; i++) cylinder(annex, blueDark, .009, .29, [4.28, 6.70, -2.26 + i * .054], .009, 6);
  for (let i = 0; i < 5; i++) { const sheet = box(annex, white, [.49, .018, .36], [4.12, 8.001 + i * .019, .92], .004); sheet.rotation.y = i % 2 * .09; }
  box(annex, cream, [.39, .26, .30], [4.05, 8.11, .59], .028); box(annex, blueDark, [.31, .035, .19], [4.05, 8.258, .59], .012);
  plant(annex, 4.35, 7.98, 1.65, 2, 1.65); lushPlant(annex, 4.35, 8.10, 1.65, .48, 3);
  const annexLight = new THREE.PointLight('#ffd19b', .42, 2.2, 2); annexLight.position.set(4.02, 7.43, 1.40); annex.add(annexLight);
  finishFeature(annex);

  // The stair flights cross the coral facade and terminate on attached corner landings.
  const stairs = namedFeature('external-stairs');
  for (let flight = 0; flight < 2; flight++) {
    const y = 3.5 + flight * 1.5, start = flight === 0 ? 3.30 : .60, end = flight === 0 ? .60 : 3.30;
    const lane = 3.84 + flight * .71;
    for (let step = 1; step <= 25; step++) {
      const t = step / 25, x = THREE.MathUtils.lerp(start, end, t), sy = y + t * 1.5, direction = end > start ? 1 : -1;
      box(stairs, coral, [.108, .049, .66], [x, sy - .0355, lane], 0).name = `printer-stair-riser-${flight}-${step}`;
      box(stairs, coral, [.135, .011, .66], [x - direction * .0135, sy - .0055, lane], 0).name = `printer-stair-tread-${flight}-${step}`;
      box(stairs, cream, [.012, .006, .64], [x - direction * .075, sy + .003, lane], 0).name = `printer-stair-nosing-${flight}-${step}`;
    }
    for (const [side, z] of [[0, lane - .33], [1, lane + .33]]) {
      rod(stairs, blueDark, new THREE.Vector3(start, y - .07, z), new THREE.Vector3(end, y + 1.43, z), .027).name = `printer-stair-stringer-${flight}-${side}`;
      rod(stairs, blueDark, new THREE.Vector3(start, y + .35, z), new THREE.Vector3(end, y + 1.85, z), .014).name = `printer-stair-hand-${flight}-${side}`;
      rod(stairs, blueDark, new THREE.Vector3(start, y + .053, z), new THREE.Vector3(end, y + 1.553, z), .010).name = `printer-stair-bottom-${flight}-${side}`;
      for (let post = 0; post <= 50; post++) {
        const t = post / 50, x = THREE.MathUtils.lerp(start, end, t), surface = y + Math.ceil(post / 2) * .06, top = y + t * 1.5 + .35, height = top - surface + .008;
        cylinder(stairs, blueDark, .009, height, [x, surface - .008 + height / 2, z], .009, 6).name = `printer-stair-infill-${flight}-${side}-${post}`;
      }
    }
  }
  for (const [level, y, x] of [[0, 3.5, 3.30], [1, 5.0, .60], [2, 6.5, 3.30]]) {
    const endZ = level ? 4.91 : 4.20, endpointZ = level === 2 ? 4.55 : 3.84;
    const corner = [[3.515, 4.35, y - .13, y + .01, level === 2 ? 2.67 : 2.595, 3.40] as Bounds];
    // A landing supplies the zero-rise surface. Upper endpoint treads fill exact holes
    // in the cap so the landing and tread cannot render two coincident top faces.
    const endpoint: Bounds[] = level === 1 ? [[x - .054, x + .37, y - .13, y + .01, endpointZ - .33, endpointZ + .33]] : level === 2 ? [[x - .37, x + .054, y - .13, y + .01, endpointZ - .33, endpointZ + .33]] : [];
    carvedBox(stairs, level === 2 ? blueLight : coral, [x - .36, x + .36, y - .12, y, 2.76, endZ], [[.245, 3.515, y - .13, y + .01, 2.67, 3.35], ...corner, ...endpoint], `printer-stair-landing-${level}`);
    for (const rise of [.05, .35]) box(stairs, blueDark, [.72, .022, .024], [x, y + rise, endZ + .01], .005).name = `printer-stair-landing-guard-${level}-front`;
    for (let post = 0; post <= 14; post++) cylinder(stairs, blueDark, .009, .35, [x - .35 + post * .05, y + .175, endZ + .01], .009, 6).name = `printer-stair-landing-infill-${level}-front-${post}`;
    const outside = level === 1 ? x - .36 : x + .36;
    for (const rise of [.05, .35]) box(stairs, blueDark, [.024, .022, endZ - 3.44], [outside, y + rise, (endZ + 3.44) / 2], .005).name = `printer-stair-landing-guard-${level}-side`;
    const sidePosts = Math.ceil((endZ - 3.45) / .05);
    for (let post = 0; post <= sidePosts; post++) cylinder(stairs, blueDark, .009, .35, [outside, y + .175, 3.45 + (endZ - 3.45) * post / sidePosts], .009, 6).name = `printer-stair-landing-infill-${level}-side-${post}`;
    {
      if (level < 2) {
        box(stairs, coral, [.225, .12, .075], [3.4025, y - .06, 2.6325], 0).name = `printer-stair-corner-gap-${level}`;
        box(stairs, coral, [.835, .12, .805], [3.9325, y - .06, 2.9975], 0).name = `printer-stair-corner-landing-${level}`;
      } else box(stairs, blueLight, [.835, .12, .73], [3.9325, y - .06, 3.035], 0).name = 'printer-stair-corner-landing-2';
      for (const rise of [.05, .35]) {
        box(stairs, blueDark, [.65, .022, .024], [3.985, y + rise, 3.38], .005).name = `printer-stair-corner-guard-${level}-front`;
        box(stairs, blueDark, [.024, .022, .78], [4.33, y + rise, 2.99], .005).name = `printer-stair-corner-guard-${level}-side`;
        const edge = level === 0 ? 4.13 : level === 1 ? 4.28 : 4.03, back = level === 2 ? 2.685 : 2.61;
        box(stairs, blueDark, [4.33 - edge, .022, .024], [(4.33 + edge) / 2, y + rise, back], .005).name = `printer-stair-corner-guard-${level}-back`;
      }
      for (let post = 0; post <= 13; post++) cylinder(stairs, blueDark, .009, .35, [3.66 + post * .05, y + .175, 3.38], .009, 6).name = `printer-stair-corner-infill-${level}-front-${post}`;
      for (let post = 0; post <= 15; post++) cylinder(stairs, blueDark, .009, .35, [4.33, y + .175, 2.62 + post * .05], .009, 6).name = `printer-stair-corner-infill-${level}-side-${post}`;
      const backEdge = level === 0 ? 4.13 : level === 1 ? 4.28 : 4.03, backZ = level === 2 ? 2.685 : 2.61, backPosts = Math.ceil((4.33 - backEdge) / .05);
      for (let post = 0; post <= backPosts; post++) cylinder(stairs, blueDark, .009, .35, [backEdge + (4.33 - backEdge) * post / backPosts, y + .175, backZ], .009, 6).name = `printer-stair-corner-infill-${level}-back-${post}`;
    }
  }
  finishFeature(stairs);

  // Upper copier machinery is a substantial crown with ivory apron, exposed bed and real raised scanner.
  const crown = namedFeature('scanner-crown');
  carvedBox(crown, blue, [-3.79, 3.79, 7.955, 8.505, -2.77, 2.61], [core], 'printer-crown-core-carve', .045);
  box(crown, cream, [7.52, .30, .39], [0, 8.08, 2.49], .13);
  carvedBox(crown, blueDark, [-3.71, 3.71, 8.475, 8.585, -2.735, 2.575], [core], 'printer-crown-cap-core-carve', .022);
  box(crown, blue, [4.77, .28, 4.70], [1.34, 8.72, -.08], .11);
  box(crown, cream, [4.68, .13, 4.55], [1.34, 8.925, -.08], .068);
  box(crown, rubber, [4.28, .031, 4.12], [1.34, 9.006, -.05], .032);
  const scannerGlass = surface('scanner-glass', '#507986', .18); scannerGlass.metalness = .19;
  box(crown, scannerGlass, [4.12, .015, 3.97], [1.34, 9.029, -.05], .030);
  // Recessed molded tracks stay below the lid; the rear feeder and front paper stacks sit outside its sweep.
  for (const x of [-.86, 3.53]) {
    box(crown, blueLight, [.066, .055, 4.19], [x, 9.059, -.05], .019);
    box(crown, ink, [.018, .009, 3.83], [x, 9.089, -.04], .005);
  }
  for (const z of [-2.14, 2.05]) box(crown, blueLight, [4.40, .055, .065], [1.34, 9.059, z], .018);
  for (let i = 0; i < 29; i++) box(crown, cream, [.006, .006, i % 5 ? .034 : .063], [-.71 + i * .145, 9.090, 2.058], 0);
  box(crown, blue, [3.45, .60, .56], [1.34, 9.17, -3.06], .083);
  for (const x of [-.08, 2.76]) box(crown, metal, [.12, .68, .65], [x, 8.68, -2.77], .022);
  box(crown, rubber, [3.08, .12, .28], [1.34, 9.40, -3.05], .034);
  for (let i = 0; i < 7; i++) box(crown, white, [2.91, .020, .43], [1.34, 9.48 + i * .021, -3.06], .005);
  for (const x of [-.33, 3.02]) box(crown, cream, [.090, .60, .55], [x, 9.29, -3.06], .033);
  for (const x of [2.20, 3.05]) {
    for (let i = 0; i < 5; i++) { const sheet = box(crown, white, [.70, .020, .52], [x, 8.94 + i * .022, 2.60], .004); sheet.rotation.y = i % 2 * .08; }
    box(crown, blueLight, [.77, .050, .065], [x, 8.947, 2.90], .016);
  }
  for (let i = 0; i < 9; i++) box(crown, ink, [.014, .41, .082], [3.798, 8.26, -1.24 + i * .143], .006);
  for (const x of [-.49, 3.19]) {
    const hinge = cylinder(crown, blueDark, .16, .37, [x, 9.13, -2.32], .16, 24); hinge.rotation.z = Math.PI / 2; hinge.name = 'scanner-hinge-barrel';
    const pin = cylinder(crown, metal, .088, .44, [x, 9.13, -2.32], .088, 18); pin.rotation.z = Math.PI / 2; pin.name = 'scanner-hinge-pin';
    box(crown, blue, [.32, .36, .27], [x, 9.08, -2.44], .044).name = 'scanner-hinge-mount';
  }
  finishFeature(crown);
  const scanner = new THREE.Group(); scanner.name = 'printer-scanner-lid'; scanner.position.set(1.34, 9.16, -2.29); group.add(scanner);
  box(scanner, blue, [4.70, .22, 4.48], [0, .13, 2.21], .092);
  box(scanner, blueLight, [4.30, .027, 4.11], [0, .009, 2.21], .049);
  box(scanner, cream, [4.07, .014, 3.91], [0, -.012, 2.21], .034);
  for (let i = 0; i < 12; i++) box(scanner, blueDark, [.017, .008, 3.79], [-1.91 + i * .348, -.023, 2.21], .004);
  for (let i = 0; i < 12; i++) box(scanner, blueDark, [3.91, .008, .017], [0, -.023, .42 + i * .325], .004);
  box(scanner, blueDark, [4.41, .027, 4.27], [0, .253, 2.21], .037);
  box(scanner, blue, [4.29, .030, 4.14], [0, .283, 2.21], .038);
  box(scanner, cream, [1.07, .040, .19], [0, .265, 4.37], .040);
  const scannerMeshes = batchPrinter(scanner);

  // A warm yellow glazed rooftop home and outdoor cafe sit beside the scanner rather than above a shelf.
  const roof = namedFeature('rooftop-home');
  carvedBox(roof, blue, [-3.60, -.95, 8.854, 8.974, -2.45, 2.15], [roofOpening], 'printer-roof-structure');
  carvedBox(roof, woodLight, [-3.555, -.995, 8.978, 9.0, -2.37, 2.07], [roofOpening], 'printer-roof-wood');
  box(roof, coral, [2.46, .15, 2.48], [-2.36, 10.59, -1.23], .045);
  box(roof, roomWall, [2.43, 1.47, .08], [-2.33, 9.77, -2.40], .02);
  box(roof, mustard, [.10, 1.51, 2.43], [-3.55, 9.775, -1.21], .023);
  for (const x of [-3.47, -2.57, -1.68, -1.15]) box(roof, woodLight, [.060, 1.45, .061], [x, 9.79, .03], .012);
  box(roof, woodLight, [2.34, .074, .064], [-2.32, 10.46, .03], .016);
  box(roof, woodLight, [1.825, .074, .064], [-2.5775, 9.12, .03], .012);
  openDoor(roof, -1.415, 9, .03, .48, 1.30, 'printer-roof-home-door', 0, true, Math.PI / 2);
  frameWindow(roof, -3.02, 9.79, .07, .79, 1.26); frameWindow(roof, -2.13, 9.79, .07, .79, 1.26);
  art(roof, -1.76, 9.91, -2.346, .48, 1);
  box(roof, wood, [1.10, .34, .42], [-2.83, 9.17, -1.22], .025); box(roof, cream, [1.18, .040, .47], [-2.83, 9.36, -1.22], .018);
  for (let i = 0; i < 6; i++) box(roof, woodLight, [.155, .26, .019], [-3.30 + i * .185, 9.19, -.995], .006);
  box(roof, blueDark, [.34, .25, .24], [-2.81, 9.514, -1.24], .032); box(roof, metal, [.28, .080, .018], [-2.81, 9.48, -1.106], .009);
  for (const x of [-2.90, -2.73]) { cylinder(roof, gold, .012, .072, [x, 9.424, -1.10], .012, 10); box(roof, ink, [.075, .018, .018], [x - .026, 9.45, -1.10], .006); }
  littleCup(roof, -2.43, 9.38, -1.22); bookStack(roof, -3.10, 9.38, -1.21, 3, .14);
  for (const x of [-2.70, -1.55]) {
    cylinder(roof, blueDark, .087, .017, [x, 9.01, 1.13], .087, 14); cylinder(roof, metal, .021, .285, [x, 9.163, 1.13], .026, 12); cylinder(roof, woodLight, .25, .032, [x, 9.304, 1.13], .25, 30);
    smallSeat(roof, x, 9.0, 1.55, x < -2 ? mustard : turquoise, false, Math.PI); littleCup(roof, x + .07, 9.32, 1.14); bookStack(roof, x - .095, 9.32, 1.10, 1, .12);
  }
  box(roof, wood, [.28, .08, .27], [-3.35, 9.04, .97], .017); plant(roof, -3.35, 9.08, .97, 4, 1.6, true);
  for (const [x, back, front] of [[-1.255, -1.95, -.62], [-1.895, -1.82, -.62]]) {
    for (const rise of [.055, .35]) box(roof, metal, [.018, .018, front - back], [x, 9 + rise, (back + front) / 2], 0).name = 'printer-roof-aperture-guard';
    const count = Math.ceil((front - back) / .054);
    for (let post = 0; post <= count; post++) cylinder(roof, metal, .007, .35, [x, 9.175, back + (front - back) * post / count], .007, 6).name = 'printer-roof-aperture-infill';
  }
  for (const rise of [.055, .35]) box(roof, metal, [.64, .018, .018], [-1.575, 9 + rise, -.605], 0).name = 'printer-roof-aperture-front-guard';
  for (let post = 0; post <= 12; post++) cylinder(roof, metal, .007, .35, [-1.885 + post * .052, 9.175, -.605], .007, 6).name = 'printer-roof-aperture-front-infill';
  for (const rise of [.055, .35]) box(roof, metal, [.64, .018, .018], [-1.575, 9 + rise, -2.355], 0).name = 'printer-roof-aperture-rear-guard';
  for (let post = 0; post <= 12; post++) cylinder(roof, metal, .007, .35, [-1.885 + post * .052, 9.175, -2.355], .007, 6).name = 'printer-roof-aperture-rear-infill';
  const roofLight = new THREE.PointLight('#ffd193', .60, 3.0, 2); roofLight.position.set(-2.28, 10.14, -1.05); roof.add(roofLight);
  box(roof, glow, [2.28, .018, .040], [-2.27, 10.40, -2.32], .006);
  for (let i = 0; i < 7; i++) vine(roof, -3.47 + i * .354, 10.66, .07, .34 + i % 3 * .17, i, true);
  finishFeature(roof);

  // Oversized front-left corrugated return, as seen alongside the right homes in the reference view.
  const duct = namedFeature('looping-duct');
  const ductCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.42, 9.23, 1.17), new THREE.Vector3(-4.46, 9.38, 1.22), new THREE.Vector3(-4.90, 8.21, 1.27), new THREE.Vector3(-4.92, 5.22, 1.31), new THREE.Vector3(-4.22, 4.62, 1.33), new THREE.Vector3(-3.43, 4.82, 1.31)]);
  mesh(duct, blue, new THREE.TubeGeometry(ductCurve, 80, .86, 18, false));
  for (let i = 0; i < 66; i++) { const t = i / 65, collar = mesh(duct, blueDark, new THREE.TorusGeometry(.867, .037, 5, 24)); collar.position.copy(ductCurve.getPointAt(t)); collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ductCurve.getTangentAt(t)); }
  for (const [y, z] of [[9.23, 1.17], [4.82, 1.31]]) { const coupling = cylinder(duct, blueLight, .96, .16, [-3.39, y, z], .96, 24); coupling.rotation.z = Math.PI / 2; for (let i = 0; i < 9; i++) screw(duct, -3.49, y + Math.sin(i * Math.PI * 2 / 9) * .88, z + Math.cos(i * Math.PI * 2 / 9) * .88, true); }
  finishFeature(duct);
  duct.children.forEach(child => { if (child instanceof THREE.Mesh && child.material === blueDark) child.castShadow = false; });
  box(scenery, cream, [.55, 3.35, 1.37], [-3.40, 9.16, -.84], .065);
  for (let i = 0; i < 9; i++) box(scenery, ink, [.016, .029, .64], [-3.69, 9.27 - i * .075, -.85], .006);
  for (let i = 0; i < 7; i++) cable(scenery, [ink, gold, blueLight, coralDark][i % 4], [[-3.71, 7.98, -.58 + i * .09], [-4.00, 7.52, -.42 + i * .08], [-3.90, 6.75 + i % 3 * .10, .08], [-3.59, 6.54, .22]], .020, 20);

  // A broad continuous drawing sheet emerges from within the dark bay, not from a balcony face.
  function paint(parent: THREE.Group, material: THREE.Material, size: [number, number, number], at: [number, number, number], _radius = 0) {
    const stroke = mesh(parent, material, new THREE.PlaneGeometry(size[0], size[2]), at); stroke.rotation.x = -Math.PI / 2; return stroke;
  }
  function paintRing(radius: number, strokeWidth: number, segments: number, arc = Math.PI * 2) {
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= segments; i++) for (const side of [-1, 1]) { const angle = i / segments * arc, r = radius + side * strokeWidth; vertices.push(Math.cos(angle) * r, Math.sin(angle) * r, 0); }
    for (let i = 0; i < segments; i++) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
  }
  const paper = new THREE.Group(); paper.name = 'paper-waterfall'; paper.position.x = -.15; group.add(paper);
  const paperCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.53, 3.79, 2.52), new THREE.Vector3(-1.53, 3.88, 3.05), new THREE.Vector3(-1.53, 3.28, 3.62), new THREE.Vector3(-1.53, 1.15, 4.23), new THREE.Vector3(-1.53, .020, 5.28), new THREE.Vector3(-1.53, .009, 7.06)]);
  const width = 2.68, positions: number[] = [], uv: number[] = [], indices: number[] = [], rows = 100;
  function paperPoint(t: number, across: number) { const point = paperCurve.getPointAt(THREE.MathUtils.clamp(t, 0, 1)); point.x += across * width / 2; point.y = Math.max(.008, point.y + Math.sin(across * Math.PI) * .011 * Math.sin(t * Math.PI)); return point; }
  for (let row = 0; row <= rows; row++) for (const side of [-1, 1]) { const t = row / rows, p = paperPoint(t, side); positions.push(p.x, p.y, p.z); uv.push((side + 1) / 2, t); }
  for (let row = 0; row < rows; row++) { const a = row * 2; indices.push(a, a + 3, a + 1, a, a + 2, a + 3); }
  const paperGeometry = new THREE.BufferGeometry(); paperGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); paperGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); paperGeometry.setIndex(indices); paperGeometry.computeVertexNormals();
  const paperMaterial = white.clone(); paperMaterial.side = THREE.DoubleSide; paperMaterial.name = 'paper-ribbon'; mesh(paper, paperMaterial, paperGeometry);
  for (let row = 0; row < 12; row++) {
    const large = [2, 6, 10].includes(row);
    for (let column = 0; column < (large ? 1 : 2); column++) {
    const t = .055 + row * .076, across = large ? 0 : -.47 + column * .94, length = paperCurve.getLength(), diagram = new THREE.Group(); paper.add(diagram);
    const planWidth = large ? 2.16 : .93 + row % 2 * .04, depth = large ? .51 : .24 + row % 3 * .065, kind = (row * 3 + column) % 5;
    for (const x of [-planWidth / 2, planWidth / 2]) paint(diagram, ink, [.012, .004, depth], [x, 0, 0], 0);
    for (const z of [-depth / 2, depth / 2]) paint(diagram, ink, [planWidth, .004, .012], [0, 0, z], 0);
    if (kind === 0 || kind === 4) {
      const bays = large ? 8 : 4, span = planWidth / bays;
      for (let wall = 0; wall < bays; wall++) {
        const x = -planWidth / 2 + span * (wall + .5), offset = (wall + row) % 3 * .021;
        paint(diagram, ink, [.011, .004, depth * (.50 + wall % 3 * .13)], [x, .002, offset], 0);
        paint(diagram, ink, [span * .83, .004, .009], [x + span * .14, .002, wall % 2 ? depth * .22 : -depth * .24], 0);
        const doorway = mesh(diagram, ink, paintRing(span * .24, .003, 12, Math.PI / 2), [x + span * .09, .002, depth * .09]); doorway.rotation.x = Math.PI / 2;
        for (let hatch = 0; hatch < 4; hatch++) paint(diagram, ink, [span * .28, .004, .006], [x - span * .24, .002, -depth * .36 + hatch * depth * .072], 0);
      }
    } else if (kind === 1) {
      const windows = large ? 10 : 5;
      for (let story = 0; story < 3; story++) {
        const z = -depth * .31 + story * depth * .29; paint(diagram, ink, [planWidth * .92, .004, .008], [0, .002, z + depth * .11], 0);
        for (let window = 0; window < windows; window++) { const x = -planWidth * .42 + window / (windows - 1) * planWidth * .84; paint(diagram, blueLight, [planWidth / windows * .48, .004, depth * .13], [x, .002, z], 0); paint(diagram, ink, [.006, .004, depth * .13], [x, .006, z], 0); }
      }
    } else if (kind === 2) {
      for (let wheel = 0; wheel < 3; wheel++) {
        const x = -planWidth * .29 + wheel * planWidth * .29, radius = depth * (.20 + wheel % 2 * .05);
        for (const r of [radius, radius * .47]) { const ring = mesh(diagram, ink, paintRing(r, .003, 22), [x, .002, 0]); ring.rotation.x = Math.PI / 2; }
        paint(diagram, ink, [radius * 1.8, .004, .006], [x, .002, 0], 0); paint(diagram, ink, [.006, .004, radius * 1.8], [x, .002, 0], 0);
        for (let tooth = 0; tooth < 8; tooth++) { const angle = tooth * Math.PI / 4, tick = paint(diagram, ink, [.026, .004, .008], [x + Math.cos(angle) * radius * 1.18, .002, Math.sin(angle) * radius * 1.18], 0); tick.rotation.y = -angle; }
      }
    } else {
      const modules = large ? 8 : 4;
      for (let module = 0; module < modules; module++) {
        const x = -planWidth * .42 + module / (modules - 1) * planWidth * .84, z = module % 2 ? depth * .17 : -depth * .17;
        paint(diagram, blueLight, [planWidth / modules * .48, .004, depth * .24], [x, .002, z], 0);
        for (const offset of [-1, 1]) paint(diagram, ink, [planWidth / modules * .71, .004, .007], [x, .004, z + offset * depth * .14], 0);
        paint(diagram, ink, [.006, .004, depth * .64], [x + planWidth / modules * .35, .002, 0], 0);
        for (let trace = 0; trace < 3; trace++) paint(diagram, ink, [.006, .004, depth * .34], [x - planWidth / modules * .18 + trace * .023, .006, z], 0);
      }
    }
    for (let mark = 0; mark < (large ? 16 : 7); mark++) paint(diagram, ink, [.006, .004, .036], [-planWidth * .46 + mark / (large ? 15 : 6) * planWidth * .92, .002, depth / 2 + .033], 0);
    paint(diagram, ink, [planWidth * .94, .004, .006], [0, .002, depth / 2 + .044], 0);
    for (const stroke of [...diagram.children]) {
      if (!(stroke instanceof THREE.Mesh)) continue; stroke.updateMatrix(); const attribute = stroke.geometry.attributes.position;
      for (let vertex = 0; vertex < attribute.count; vertex++) { const local = new THREE.Vector3().fromBufferAttribute(attribute, vertex).applyMatrix4(stroke.matrix), along = t + local.z / length, point = paperPoint(along, across + local.x / (width / 2)), tangent = paperCurve.getTangentAt(THREE.MathUtils.clamp(along, 0, 1)); point.addScaledVector(new THREE.Vector3(0, tangent.z, -tangent.y).normalize(), .006 + local.y); attribute.setXYZ(vertex, point.x, point.y, point.z); }
      stroke.geometry.computeVertexNormals(); stroke.position.set(0, 0, 0); stroke.quaternion.identity(); stroke.scale.set(1, 1, 1); paper.add(stroke);
    }
    diagram.removeFromParent();
    }
  }
  const paperBatches = batchPrinter(paper); paperBatches.forEach(batch => { batch.castShadow = batch.material === paperMaterial; }); paper.userData.printerFeature = true;

  // The lower-right storefront is separate from the upper cyan wrap and has its own occupied roof.
  const storefront = namedFeature('lower-cyan-storefront');
  floorPlate(storefront, blueLight, 4.55, .10, .18, 1.66, 1.78);
  box(storefront, roomWall, [1.54, 1.65, .09], [4.55, .925, -.69], .022);
  box(storefront, blueLight, [1.69, .15, 1.84], [4.55, 1.775, .18], 0).name = 'printer-storefront-roof';
  for (const x of [3.75, 5.35]) box(storefront, blueLight, [.095, 1.58, .10], [x, .92, 1.04], .025);
  box(storefront, blueLight, [1.65, .12, .10], [4.55, 1.61, 1.04], .028);
  box(storefront, blueLight, [.95, .12, .10], [4.20, .18, 1.04], .020);
  frameWindow(storefront, 4.15, .91, 1.10, .62, 1.23, cream);
  box(storefront, woodLight, [.064, 1.27, .052], [4.66, .88, 1.10], .013);
  const amberGlass = glass.clone(); amberGlass.color.set('#d5af72'); amberGlass.opacity = .18; amberGlass.name = 'amber-shop-glass';
  openDoor(storefront, 4.97, .10, 1.09, .54, 1.40, 'printer-storefront-door', 0, true, Math.PI / 2, amberGlass);
  bookShelf(storefront, 4.24, .18, -.51, .77, .85, 2);
  box(storefront, wood, [1.04, .36, .34], [4.34, .28, .50], .023); box(storefront, cream, [1.09, .037, .40], [4.34, .4785, .50], .015);
  littleCup(storefront, 4.43, .497, .47); littleCup(storefront, 4.61, .497, .55, terracotta); bookStack(storefront, 4.02, .497, .53, 3, .16);
  littleLamp(storefront, 4.89, .10, -.40, true); plant(storefront, 3.92, .10, .13, 3, 1.65); lushPlant(storefront, 3.92, .22, .13, .45, 1);
  art(storefront, 4.97, 1.06, -.634, .41, 5);
  const shopLight = new THREE.PointLight('#ffd194', .42, 2.1, 2); shopLight.position.set(4.45, 1.24, .34); storefront.add(shopLight);
  for (let i = 0; i < 10; i++) { const stripe = box(storefront, i % 2 ? mustard : cream, [.169, .030, .63], [3.78 + i * .171, 1.56, 1.24], .016); stripe.rotation.x = .17; box(storefront, i % 2 ? mustard : cream, [.169, .115, .030], [3.78 + i * .171, 1.45, 1.53], .014); }
  box(storefront, wood, [.28, .08, .27], [4.45, 1.89, .48], .015); plant(storefront, 4.45, 1.93, .48, 2, 1.6, true);
  littleLamp(storefront, 4.96, 1.85, -.32); bookStack(storefront, 4.94, 1.85, .19, 5, .17); littleCup(storefront, 5.09, 1.85, .40, terracotta);
  for (let i = 0; i < 7; i++) vine(storefront, 3.79 + i * .25, 1.93, 1.03, .46 + i % 3 * .19, i + 2, true);
  finishFeature(storefront);
  floorPlate(scenery, blueLight, 4.525, .10, 3.825, 1.85, 1.05);
  floorPlate(scenery, blueLight, -3.80, .10, 2.975, 1.30, 1.15);
  floorPlate(scenery, blueLight, .325, .10, -3.70, 9.25, .80).name = 'printer-back-street';
  floorPlate(scenery, blueLight, -4.025, .10, -.45, .55, 5.70).name = 'printer-left-ground-link';
  floorPlate(scenery, blueLight, -2.58, .10, -2.785, .64, 1.03).name = 'printer-core-entry-porch';
  floorPlate(scenery, blueLight, 5.10, .10, 2.185, .50, 2.23).name = 'printer-shop-street-link';
  for (let level = 0; level < 3; level++) {
    const y = [3.5, 5, 6.5][level];
    carvedBox(scenery, woodLight, [-1.25, .30, y - .022, y, .05, .37], [[.265, .31, y - .03, y + .01, .05, .32]], `printer-core-exit-corridor-${level}`);
  }
  smallSeat(scenery, -3.75, .10, 3.05, turquoise, false, Math.PI);
  box(scenery, woodLight, [.80, .032, .34], [-3.75, .404, 2.68], .017);
  for (const x of [-4.10, -3.40]) for (const z of [2.55, 2.80]) cylinder(scenery, metal, .015, .284, [x, .242, z], .015, 8);
  box(scenery, ink, [.28, .016, .19], [-3.75, .432, 2.68], .009); box(scenery, blueDark, [.28, .21, .018], [-3.75, .545, 2.59], .012); box(scenery, cyan, [.245, .174, .006], [-3.75, .545, 2.601], .007);
  littleCup(scenery, -4.02, .42, 2.70); bookStack(scenery, -3.44, .42, 2.68, 3, .13);

  // Base drawer and tactile print key operate while every occupied room and terrace remains fixed.
  const drawer = new THREE.Group(); drawer.name = 'printer-paper-drawer'; group.add(drawer);
  box(scenery, ink, [3.09, .56, .12], [1.85, 1.52, 2.61], .045);
  for (const x of [.34, 3.36]) box(scenery, metal, [.039, .038, 1.73], [x, 1.28, 2.68], .007).name = 'drawer-slide-track';
  box(drawer, blue, [3.09, .54, .19], [1.85, 1.52, 2.75], .075);
  box(drawer, blueDark, [2.94, .043, 1.82], [1.85, 1.269, 1.91], .025);
  for (const x of [.39, 3.31]) box(drawer, blueLight, [.066, .21, 1.75], [x, 1.37, 1.90], .023);
  box(drawer, cream, [2.51, .12, 1.40], [1.85, 1.35, 1.91], .015);
  for (let i = 0; i < 9; i++) box(drawer, white, [2.49, .012, 1.37], [1.85, 1.420 + i * .013, 1.91], .003);
  box(drawer, ink, [1.03, .14, .060], [1.85, 1.55, 2.86], .035); box(drawer, metal, [.79, .040, .056], [1.85, 1.54, 2.903], .013);
  const drawerMeshes = batchPrinter(drawer);
  const consoleGroup = new THREE.Group(); consoleGroup.position.set(-1.40, 8.20, 2.63); consoleGroup.rotation.x = .28; scenery.add(consoleGroup);
  box(consoleGroup, cream, [2.95, .18, 1.25], [0, .06, 0], .080); box(consoleGroup, blue, [2.74, .036, 1.10], [0, .173, 0], .024).name = 'print-control-housing';
  const screen = cyan.clone(); screen.color.set('#143649'); screen.emissive.set('#235b74'); screen.emissiveIntensity = .28; screen.name = 'printer-dark-display';
  box(consoleGroup, blueDark, [1.64, .040, .75], [-.40, .208, 0], .034); box(consoleGroup, screen, [1.44, .006, .60], [-.40, .232, 0], .017);
  for (let row = 0; row < 6; row++) { box(consoleGroup, cream, [.50 - row % 2 * .14, .004, .016], [-.70, .240, -.20 + row * .075], .003); for (let column = 0; column < 4; column++) box(consoleGroup, row % 3 ? blueLight : mustard, [.052, .004, .031], [-.16 + column * .091, .241, -.20 + row * .075], .005); }
  for (let i = 0; i < 16; i++) {
    const x = .49 + i % 4 * .145, z = -.37 + Math.floor(i / 4) * .162;
    box(consoleGroup, blueDark, [.108, .025, .117], [x, .216, z], .015);
    box(consoleGroup, cream, [.044, .004, .008], [x, .231, z - .012], .002);
    if (i % 3) box(consoleGroup, cream, [.008, .004, .026], [x + (i % 2 ? .012 : -.012), .231, z], .002);
  }
  const printControl = new THREE.Group(); printControl.name = 'printer-print-control'; printControl.position.copy(consoleGroup.position); printControl.rotation.copy(consoleGroup.rotation); group.add(printControl);
  const printButton = new THREE.Group(); printButton.name = 'printer-print-button'; printControl.add(printButton);
  cylinder(printButton, teal, .095, .047, [1.26, .228, .25], .101, 24); cylinder(printButton, cyan, .034, .005, [1.26, .255, .25], .034, 16);
  const printButtonMeshes = batchPrinter(printButton), indicatorMaterial = glow.clone(); indicatorMaterial.name = 'printer-status-glow';
  const indicator = cylinder(printControl, indicatorMaterial, .023, .012, [1.26, .219, -.30], .023, 14); indicator.name = 'printer-status-light';

  scenery.add(createPrinterGarden());
  scenery.add(createPrinterAccess({ coral, metal, cream }));
  for (const y of [3.5, 5.0, 6.5]) for (let i = 0; i < 8; i++) vine(scenery, 3.30, y + 1.34, .52 + i * .26, .55 + i % 3 * .18, i, true);
  for (let i = 0; i < 13; i++) { const scrap = box(scenery, white, [.15 + i % 3 * .043, .005, .10 + i % 4 * .025], [-3.23 - i % 3 * .25, .0025, 5.25 + i % 5 * .31], .003); scrap.rotation.y = i * .67; }
  for (const y of [1.4, 3.7, 6.1]) { box(scenery, blueLight, [1.20, .57, .04], [-1.35, y, -2.60], .033); slats(scenery, -1.35, y, -2.632, .91, 6); }
  for (let i = 0; i < 7; i++) cable(scenery, [ink, coralDark, gold, blueLight][i % 4], [[.10 + i * .10, .56, -2.55], [-.04 + i * .10, .20, -2.82], [-1.03 + i * .14, .075, -3.18], [-1.82 + i * .15, .074, -3.11]], .024, 21);
  box(scenery, cream, [1.21, .05, .35], [-1.41, .074, -3.11], .016);
  const fixedMeshes = batchPrinter(scenery); fixedMeshes.forEach(part => { part.name = `fixed-${part.name}`; part.castShadow = castsDetailShadow(part.material as THREE.Material); });
  let printProgress = 0;
  const parts: PrinterPart[] = [
    { id: 'scanner', label: 'Close scanner lid', initialProgress: 1, pickMeshes: scannerMeshes, setProgress(progress) { scanner.rotation.x = -THREE.MathUtils.clamp(progress, 0, 1) * Math.PI * .389; } },
    { id: 'drawer', label: 'Pull paper drawer', pickMeshes: drawerMeshes, setProgress(progress) { drawer.position.z = THREE.MathUtils.clamp(progress, 0, 1) * 1.25; } },
    { id: 'print', label: 'Feed printed paper', pickMeshes: printButtonMeshes, setProgress(progress) { printProgress = THREE.MathUtils.clamp(progress, 0, 1); printButton.position.y = -printProgress * .025; paper.position.z = printProgress * .15; } },
  ];
  parts[0].setProgress(1); group.userData.printerParts = parts; group.userData.floorHeights = [3.5, 5.0, 6.5, 9.0]; group.userData.routeBounds = { x: [.25, 3.50], z: [2.65, 3.35] };
  return { group, parts, update(time: number) { const pulse = .87 + Math.sin(time * 2.1) * .13; indicator.scale.setScalar(1 + printProgress * .20); indicatorMaterial.emissiveIntensity = 1.1 + printProgress * pulse; } };
}

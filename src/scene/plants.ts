import * as THREE from 'three';
import { solid } from './geometry';
import { grainedPlastic } from './materials';

// The two UV bands distinguish upper cuticle and softer underside without extra surfaces or batches.
function leafMaps() {
  const width = 64, height = 32, color = new Uint8Array(width * height * 4), rough = new Uint8Array(color.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const underside = y >= height / 2, t = x / (width - 1), across = (y % (height / 2)) / (height / 2 - 1) * 2 - 1;
    const vein = Math.exp(-across * across * 90) * Math.sin(Math.PI * t);
    const age = Math.sin(Math.PI * t) * (1 - across * across), offset = (y * width + x) * 4;
    const tint = underside ? [244, 250, 228] : [226, 245, 216];
    color.set([tint[0] + Math.round(vein * 5), tint[1] + Math.round(vein * 3), tint[2] + Math.round(age * 4), 255], offset);
    const roughness = Math.round((underside ? .80 : .57) * 255 - age * 8);
    rough.set([roughness, roughness, roughness, 255], offset);
  }
  const map = new THREE.DataTexture(color, width, height), roughnessMap = new THREE.DataTexture(rough, width, height);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, roughnessMap]) {
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true; texture.needsUpdate = true;
  }
  return { map, roughnessMap };
}

const leafSurface = leafMaps();
const terracotta = grainedPlastic('#b1684b', .87, .00022);
terracotta.map?.repeat.set(1.35, .42);

// Shared across all pots so community furnishings still merge into a few batches.
const materials = {
  pots: [terracotta, new THREE.MeshStandardMaterial({ color: '#cdc3ae', roughness: .48 }), new THREE.MeshStandardMaterial({ color: '#708076', roughness: .66 })],
  soil: new THREE.MeshStandardMaterial({ color: '#34281e', roughness: 1 }),
  granules: new THREE.MeshStandardMaterial({ color: '#594536', roughness: 1 }),
  stem: new THREE.MeshStandardMaterial({ color: '#59613a', roughness: .83 }),
  leaves: ['#507c4d', '#668f51', '#90a665'].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1, ...leafSurface })),
};

function stem(parent: THREE.Group, curve: THREE.Curve<THREE.Vector3>, radius: number, segments = 6) {
  const points = curve.getPoints(segments);
  for (let i = 0; i < segments; i++) {
    const direction = points[i + 1].clone().sub(points[i]);
    const bottom = radius * (1 - .48 * i / segments);
    const top = radius * (1 - .48 * (i + 1) / segments);
    const mesh = solid(new THREE.CylinderGeometry(top, bottom, direction.length(), 6, 1), materials.stem, parent);
    mesh.name = 'plant-stem';
    mesh.position.copy(points[i]).add(points[i + 1]).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }
}

// A curved, cupped blade with a thin closed edge; ray-volume audits see real material.
function leafGeometry(curve: THREE.Curve<THREE.Vector3>, side: THREE.Vector3, width: number, roll: number, fullness: number, thickness = .00085) {
  const rows = 6, columns = 2, stride = columns + 1, surfaceCount = (rows + 1) * stride;
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (const surface of [1, -1]) for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const tangent = curve.getTangent(t), center = curve.getPoint(t);
    const rolledSide = side.clone().applyAxisAngle(tangent, roll * (.25 + .75 * Math.sin(Math.PI * t)));
    const normal = new THREE.Vector3().crossVectors(tangent, rolledSide).normalize();
    const taper = Math.max(.018, Math.pow(Math.sin(Math.PI * t), fullness) * (1 - .20 * t));
    for (let column = 0; column <= columns; column++) {
      const across = column / columns * 2 - 1;
      const point = center.clone().addScaledVector(rolledSide, across * width * taper);
      point.addScaledVector(normal, width * .16 * across * across * Math.sin(Math.PI * t) + surface * thickness / 2);
      positions.push(point.x, point.y, point.z);
      uv.push(.01 + t * .98, (surface > 0 ? 0 : .5) + .015 + column / columns * .47);
    }
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * stride + column, b = a + stride, c = a + 1, d = b + 1;
    indices.push(a, b, c, b, d, c);
    indices.push(a + surfaceCount, c + surfaceCount, b + surfaceCount, b + surfaceCount, c + surfaceCount, d + surfaceCount);
  }
  const perimeter: number[] = [];
  for (let row = 0; row <= rows; row++) perimeter.push(row * stride);
  for (let column = 1; column <= columns; column++) perimeter.push(rows * stride + column);
  for (let row = rows - 1; row >= 0; row--) perimeter.push(row * stride + columns);
  for (let column = columns - 1; column > 0; column--) perimeter.push(column);
  for (let i = 0; i < perimeter.length; i++) {
    const a = perimeter[i], b = perimeter[(i + 1) % perimeter.length];
    indices.push(a, a + surfaceCount, b, b, a + surfaceCount, b + surfaceCount);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function blade(parent: THREE.Group, node: THREE.Vector3, angle: number, length: number, width: number, rise: number, color: number, petiole = .009, roll = 0, fullness = .82) {
  const outward = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
  const base = node.clone().addScaledVector(outward, petiole).add(new THREE.Vector3(0, .004, 0));
  stem(parent, new THREE.QuadraticBezierCurve3(node, node.clone().lerp(base, .5).add(new THREE.Vector3(0, .003, 0)), base), .00135, 3);
  const end = base.clone().addScaledVector(outward, length).add(new THREE.Vector3(0, rise, 0));
  const droop = Math.max(0, -rise);
  const curve = new THREE.CubicBezierCurve3(base, base.clone().lerp(end, .32).add(new THREE.Vector3(0, .009 + droop * .3, 0)), base.clone().lerp(end, .72).add(new THREE.Vector3(0, .012 + droop * .5, 0)), end);
  const side = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
  const mesh = solid(leafGeometry(curve, side, width, roll, fullness), materials.leaves[color % materials.leaves.length], parent);
  mesh.name = 'curved-leaf';
}

function broadleaf(parent: THREE.Group, rotation: number) {
  const trunk = new THREE.CubicBezierCurve3(new THREE.Vector3(0, .073, 0), new THREE.Vector3(.009, .123, -.006), new THREE.Vector3(-.008, .193, .005), new THREE.Vector3(.002, .238, .001));
  stem(parent, trunk, .0031, 8);
  const growth = [
    [.235, 0, .058, .024, -.010, 0, .010, -.22],
    [.340, .22, .052, .023, -.003, 1, .010, .30],
    [.465, -.19, .050, .021, .006, 0, .012, -.15],
    [.555, .10, .053, .022, -.004, 1, .008, .20],
    [.675, -.28, .043, .018, .017, 1, .009, -.27],
    [.780, .15, .035, .015, .029, 2, .007, .13],
    [.905, .07, .026, .010, .032, 1, .006, .32],
  ];
  growth.forEach(([t, turn, length, width, rise, color, petiole, roll], i) => {
    blade(parent, trunk.getPoint(t), rotation + i * 2.399 + turn, length, width, rise, color, petiole, roll, i < 4 ? .70 : .91);
  });
  blade(parent, trunk.getPoint(1), rotation + .7, .019, .009, .035, 2, .005, -.18, 1.0);
}

function herb(parent: THREE.Group, rotation: number) {
  for (let shoot = 0; shoot < 3; shoot++) {
    const angle = rotation + [0, 2.15, 4.65][shoot];
    const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const base = direction.clone().multiplyScalar(.002).setY(.073);
    const end = direction.clone().multiplyScalar([.021, .029, .015][shoot]).setY([.239, .226, .251][shoot]);
    const branch = new THREE.CubicBezierCurve3(base, direction.clone().multiplyScalar(.004).setY(.133), direction.clone().multiplyScalar([.025, .033, .016][shoot]).setY(.196), end);
    stem(parent, branch, .0023, 7);
    for (let i = 0; i < 6; i++) {
      const t = [.28, .40, .525, .645, .76, .885][i];
      const turn = [-1.24, 1.34, -1.16, 1.05, -1.39, 1.16][i] + shoot * .09;
      const length = [.045, .051, .044, .039, .029, .018][i] * [.94, 1.02, .87][shoot];
      const width = [.011, .013, .012, .010, .008, .0058][i];
      const color = i > 3 ? 2 : (shoot + i) % 2;
      blade(parent, branch.getPoint(t), angle + turn, length, width, [-.004, .004, .009, .017, .022, .024][i], color, .006, (i % 2 ? -.24 : .28) + shoot * .045, i < 3 ? .73 : .91);
    }
    blade(parent, end, angle + .16, .016, .006, .023, 2, .003, -.20, 1.0);
  }
}

function fern(parent: THREE.Group, rotation: number) {
  const crown = new THREE.Vector3(0, .073, 0);
  for (let frond = 0; frond < 3; frond++) {
    const angle = rotation + [0, 2.30, 4.72][frond];
    const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const tip = direction.clone().multiplyScalar([.056, .028, .048][frond]).setY([.228, .256, .242][frond]);
    const rachis = new THREE.CubicBezierCurve3(crown, direction.clone().multiplyScalar(.005).setY(.178), direction.clone().multiplyScalar([.052, .018, .036][frond]).setY([.293, .282, .288][frond]), tip);
    stem(parent, rachis, .0021, 9);
    for (let pair = 0; pair < 5; pair++) {
      const t = [.235, .37, .515, .66, .795][pair];
      for (const side of [-1, 1]) {
        const node = rachis.getPoint(t + (side > 0 ? [ .017, .030, .014, .026, .020 ][pair] : 0));
        const turn = side * (1.12 - pair * .06) + frond * .065;
        const length = [.030, .035, .030, .023, .014][pair] * [1.04, .86, .96][frond];
        const width = [.010, .011, .0098, .0075, .0048][pair];
        const color = pair === 4 ? 2 : frond === 1 ? 1 : (frond + pair) % 2;
        blade(parent, node, angle + turn, length, width, [.004, .008, .006, .008, .011][pair], color, .0035, side * (.16 + pair * .025), .88);
      }
    }
    blade(parent, tip, angle + .1, .013, .005, frond === 1 ? .017 : .010, 2, .002, -.18, 1.05);
  }
}

export function createPlant(parent: THREE.Group, x: number, y: number, z: number, large = false, variant = 0) {
  const plant = new THREE.Group();
  const kind = ((Math.trunc(variant) % 3) + 3) % 3;
  plant.name = ['broadleaf-plant', 'herb-plant', 'fern-plant'][kind];
  plant.position.set(x, y, z); plant.scale.setScalar(large ? 1.35 : 1);
  parent.add(plant);

  // The lathed wall/base section closes at the axis, enclosing clay around an open cavity.
  const profile = [[0, 0], [.044, 0], [.047, .005], [.057, .070], [.062, .077], [.062, .085], [.054, .085], [.0515, .075], [.043, .014], [0, .014]].map(([radius, height]) => new THREE.Vector2(radius, height));
  solid(new THREE.LatheGeometry(profile, 28), materials.pots[kind], plant).name = 'open-pot';
  solid(new THREE.CylinderGeometry(.050, .046, .009, 24), materials.soil, plant, 0, .0705, 0).name = 'recessed-soil';
  for (let i = 0; i < 18; i++) {
    const angle = i * 2.399 + kind * .67, radius = .043 * Math.sqrt((i + .5) / 18);
    const size = .0022 + (i % 4) * .00045;
    const clod = solid(new THREE.IcosahedronGeometry(size, 0), i % 3 ? materials.soil : materials.granules, plant, Math.sin(angle) * radius, .075 + size * .27, Math.cos(angle) * radius);
    clod.scale.set(1, .58, .82); clod.rotation.set(i * .43, i * .71, i * .19);
  }
  [broadleaf, herb, fern][kind](plant, variant * .61);
  return plant;
}

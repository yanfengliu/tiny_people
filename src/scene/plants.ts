import * as THREE from 'three';
import { solid } from './geometry';

// Shared across all pots so community furnishings still merge into a few batches.
const materials = {
  pots: ['#a95d40', '#c9bea8', '#677c72'].map(color => new THREE.MeshStandardMaterial({ color, roughness: .79 })),
  soil: new THREE.MeshStandardMaterial({ color: '#34281e', roughness: 1 }),
  granules: new THREE.MeshStandardMaterial({ color: '#594536', roughness: 1 }),
  stem: new THREE.MeshStandardMaterial({ color: '#59613a', roughness: .83 }),
  leaves: ['#48764a', '#638b4e', '#88a35c'].map(color => new THREE.MeshStandardMaterial({ color, roughness: .57 })),
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
function leafGeometry(curve: THREE.Curve<THREE.Vector3>, side: THREE.Vector3, width: number, thickness = .00085) {
  const rows = 6, columns = 2, stride = columns + 1, surfaceCount = (rows + 1) * stride;
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (const surface of [1, -1]) for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const center = curve.getPoint(t), normal = new THREE.Vector3().crossVectors(curve.getTangent(t), side).normalize();
    const taper = Math.max(.018, Math.pow(Math.sin(Math.PI * t), .82) * (1 - .20 * t));
    for (let column = 0; column <= columns; column++) {
      const across = column / columns * 2 - 1;
      const point = center.clone().addScaledVector(side, across * width * taper);
      point.addScaledVector(normal, width * .16 * across * across * Math.sin(Math.PI * t) + surface * thickness / 2);
      positions.push(point.x, point.y, point.z); uv.push(t, column / columns);
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

function blade(parent: THREE.Group, node: THREE.Vector3, angle: number, length: number, width: number, rise: number, color: number, petiole = .009) {
  const outward = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
  const base = node.clone().addScaledVector(outward, petiole).add(new THREE.Vector3(0, .004, 0));
  stem(parent, new THREE.QuadraticBezierCurve3(node, node.clone().lerp(base, .5).add(new THREE.Vector3(0, .003, 0)), base), .00135, 3);
  const end = base.clone().addScaledVector(outward, length).add(new THREE.Vector3(0, rise, 0));
  const curve = new THREE.CubicBezierCurve3(base, base.clone().lerp(end, .32).add(new THREE.Vector3(0, .009, 0)), base.clone().lerp(end, .72).add(new THREE.Vector3(0, .012, 0)), end);
  const side = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
  const mesh = solid(leafGeometry(curve, side, width), materials.leaves[color % materials.leaves.length], parent);
  mesh.name = 'curved-leaf';
}

function broadleaf(parent: THREE.Group, rotation: number) {
  const trunk = new THREE.CubicBezierCurve3(new THREE.Vector3(0, .073, 0), new THREE.Vector3(.009, .123, -.006), new THREE.Vector3(-.008, .193, .005), new THREE.Vector3(.002, .238, .001));
  stem(parent, trunk, .0031, 8);
  for (let i = 0; i < 7; i++) {
    const t = .25 + i * .105;
    blade(parent, trunk.getPoint(t), rotation + i * 2.38, .052 - i * .003, .0202 - i * .0009, i > 4 ? .025 : .004 - i * .001, i % 3, .011);
  }
  blade(parent, trunk.getPoint(1), rotation + .7, .021, .0112, .039, 2, .005);
}

function herb(parent: THREE.Group, rotation: number) {
  for (let shoot = 0; shoot < 3; shoot++) {
    const angle = rotation + shoot * 2.29;
    const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const base = new THREE.Vector3(0, .073, 0);
    const end = direction.clone().multiplyScalar(.018).setY(.232 + (shoot % 2) * .016);
    const branch = new THREE.CubicBezierCurve3(base, new THREE.Vector3(0, .133, 0), direction.clone().multiplyScalar(.029).setY(.192), end);
    stem(parent, branch, .0023, 7);
    for (let i = 0; i < 6; i++) {
      const t = .29 + i * .115;
      blade(parent, branch.getPoint(t), angle + (i % 2 ? 1.14 : -1.33), .0435 - i * .0035, .0098 - i * .00055, .015 + i * .001, (shoot + i) % 3, .006);
    }
    blade(parent, end, angle, .015, .0066, .025, 2, .003);
  }
}

function fern(parent: THREE.Group, rotation: number) {
  const crown = new THREE.Vector3(0, .073, 0);
  for (let frond = 0; frond < 3; frond++) {
    const angle = rotation + frond * 2.23;
    const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const tip = direction.clone().multiplyScalar(.047).setY(.244 + frond * .005);
    const rachis = new THREE.CubicBezierCurve3(crown, direction.clone().multiplyScalar(.005).setY(.187), direction.clone().multiplyScalar(.024).setY(.288), tip);
    stem(parent, rachis, .0021, 9);
    for (let pair = 0; pair < 5; pair++) {
      const t = .25 + pair * .13;
      for (const side of [-1, 1]) {
        const node = rachis.getPoint(t + (side > 0 ? .024 : 0));
        blade(parent, node, angle + side * 1.03, .0315 - pair * .0048, .0088 - pair * .00095, .010 - pair * .001, (frond + pair) % 3, .0035);
      }
    }
    blade(parent, tip, angle, .013, .0055, .015, 2, .002);
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

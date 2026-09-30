import * as THREE from 'three';

type Point = [number, number, number];
type Piece = { at: THREE.Vector3; rotation: THREE.Quaternion; size: THREE.Vector3; color: string };
const up = new THREE.Vector3(0, 1, 0), forward = new THREE.Vector3(0, 0, 1);
const gold = Math.PI * (3 - Math.sqrt(5));
const greens = ['#164c39', '#226449', '#347f51', '#48955b'];
const blossoms = [
  ['#d95398', '#ea75b2', '#f196c3'],
  ['#d76832', '#ee893d', '#f3a65b'],
  ['#d9a933', '#efc34a', '#f4da72'],
];
const variation = (seed: number) => (Math.sin(seed * 127.1 + 43.7) * 43758.5453 % 1 + 1) % 1;

/** A thin cupped blade has two surfaces and a closed rim, including its narrow tip. */
function closedLeaf(rows = 3) {
  const columns = 1, stride = columns + 1, surface = (rows + 1) * stride;
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  for (const side of [1, -1]) for (let row = 0; row <= rows; row++) {
    const t = row / rows, width = Math.max(.012, Math.sin(Math.PI * t) ** .8) * .16;
    for (let column = 0; column <= columns; column++) {
      const across = column / columns * 2 - 1;
      positions.push(across * width, Math.sin(Math.PI * t) * (.12 + across * across * .035) - t * t * .08 + side * .007, t);
      const shade = side > 0 ? .91 + (1 - Math.abs(across)) * .09 : .76;
      colors.push(shade, shade, shade);
    }
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * stride + column, b = a + stride, c = a + 1, d = b + 1;
    indices.push(a, b, c, b, d, c, a + surface, c + surface, b + surface, b + surface, c + surface, d + surface);
  }
  const edge: number[] = [];
  for (let row = 0; row <= rows; row++) edge.push(row * stride);
  for (let column = 1; column <= columns; column++) edge.push(rows * stride + column);
  for (let row = rows - 1; row >= 0; row--) edge.push(row * stride + columns);
  for (let column = columns - 1; column > 0; column--) edge.push(column);
  for (let index = 0; index < edge.length; index++) {
    const a = edge[index], b = edge[(index + 1) % edge.length];
    indices.push(a, a + surface, b, b, a + surface, b + surface);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

/** Small closed rosettes use rounded shading instead of folded radial wedges. */
function blossomGeometry() {
  const positions: number[] = [0, .32, 0, 0, -.16, 0], colors: number[] = [1, 1, 1, .91, .91, .91], normals = [0, 1, 0, 0, -1, 0], indices: number[] = [];
  for (let edge = 0; edge < 4; edge++) {
    const angle = (edge + .5) / 4 * Math.PI * 2;
    positions.push(Math.sin(angle), .035, Math.cos(angle));
    colors.push(.98, .98, .98); normals.push(Math.sin(angle), .12, Math.cos(angle));
  }
  for (let edge = 0; edge < 4; edge++) indices.push(0, 2 + edge, 2 + (edge + 1) % 4, 1, 2 + (edge + 1) % 4, 2 + edge);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); geometry.setIndex(indices); return geometry;
}

/** Broad lanceolate pinnae close around a thin curved ridge. */
function fernBladeGeometry() {
  const positions = [0, 0, 0, -.18, .085, .43, 0, -.045, 1, .18, .085, .43, 0, .115, .43, 0, .065, .43];
  const indices: number[] = [];
  for (let side = 0; side < 4; side++) indices.push(4, side, (side + 1) % 4, 5, (side + 1) % 4, side);
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute([.88,.88,.88, 1,1,1, .91,.91,.91, 1,1,1, 1,1,1, .79,.79,.79], 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

/** Dense fixed planting follows the reference's ground massing without occupying walking supports. */
export function createPrinterGarden(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'printer-reference-garden';
  // Preserve these authored instances if the world batches the surrounding fixed architecture.
  group.userData.printerFeature = true;
  const wood: Piece[] = [], foliage: Piece[] = [], earth: Piece[] = [];
  const frontCrown: Piece[] = [], rightCrown: Piece[] = [], shrubs: Piece[] = [];
  const frontLeaves: Piece[] = [], rightLeaves: Piece[] = [];
  const fernLeaves: Piece[] = [], fernStems: Piece[] = [];
  const identity = new THREE.Quaternion();

  function piece(batch: Piece[], at: THREE.Vector3, size: Point, color: string, rotation = identity) {
    batch.push({ at: at.clone(), size: new THREE.Vector3(...size), color, rotation: rotation.clone() });
  }
  function branch(a: THREE.Vector3, b: THREE.Vector3, radius: number, color = '#715745', branches = wood) {
    const direction = b.clone().sub(a);
    piece(branches, a.clone().add(b).multiplyScalar(.5), [radius, direction.length(), radius], color, new THREE.Quaternion().setFromUnitVectors(up, direction.normalize()));
  }
  function leaf(at: THREE.Vector3, direction: THREE.Vector3, length: number, width: number, seed: number, leaves = foliage, roll = .65) {
    const orientation = new THREE.Quaternion().setFromUnitVectors(forward, direction.clone().normalize());
    orientation.multiply(new THREE.Quaternion().setFromAxisAngle(forward, (variation(seed + 9) - .5) * roll));
    piece(leaves, at, [width * length, length, length], greens[Math.floor(variation(seed) * greens.length)], orientation);
  }
  function cloud(batch: Piece[], at: Point, radii: Point, palette: number, seed: number, substantial = false, fork?: THREE.Vector3, crownLeaves = foliage) {
    const [rx, ry, rz] = radii, nx = substantial ? 8 : 3, ny = substantial ? 5 : 2, nz = substantial ? 7 : 3;
    const lobe = Math.min(rx / nx, ry / ny, rz / nz) * .74;
    if (substantial && fork) {
      // A crown consists of connected flowering sprays, rather than solid overlapping lobes.
      for (let spray = 0; spray < 160; spray++) {
        const vertical = 1 - (spray + .5) / 160 * 2, radial = Math.sqrt(1 - vertical * vertical), angle = spray * gold + seed;
        const direction = new THREE.Vector3(Math.sin(angle) * radial, vertical, Math.cos(angle) * radial);
        const radius = .64 + variation(seed + spray * 11) * .34;
        const node = new THREE.Vector3(at[0] + direction.x * rx * radius, at[1] + direction.y * ry * radius, at[2] + direction.z * rz * radius);
        // The upper model-facing fringe yields to the lower stair and its adult users.
        if (seed === 2 && node.x + .34 >= 1.25 && node.x - .34 <= 3.61 && node.z + .34 >= 3.40 && node.z - .34 <= 4.28 && node.y + .34 >= 3.45) continue;
        branch(fork, node, .008, '#825845');
        for (let blade = 0; blade < 4; blade++) {
          const bearing = angle + blade * 2.1;
          leaf(node, new THREE.Vector3(Math.sin(bearing), .10 + blade * .07, Math.cos(bearing)), .30 + variation(seed + spray + blade) * .06, 2.4, seed + spray * 4 + blade, crownLeaves, Math.PI * .65);
        }
        for (let bloom = 0; bloom < 31; bloom++) {
          const key = seed + spray * 41 + bloom * 17, azimuth = bloom * gold + spray;
          const tangent = new THREE.Vector3().crossVectors(direction, up).normalize();
          const across = new THREE.Vector3().crossVectors(tangent, direction).normalize();
          const radius = Math.sqrt((bloom + .5) / 31) * .235;
          const center = node.clone().addScaledVector(direction, .055).addScaledVector(tangent, Math.sin(azimuth) * radius).addScaledVector(across, Math.cos(azimuth) * radius);
          const outward = direction.clone().addScaledVector(up, .12).addScaledVector(tangent, (variation(key) - .5) * .3).normalize();
          const size = .017 + variation(key + 2) * .006;
          const orientation = new THREE.Quaternion().setFromUnitVectors(up, outward).multiply(new THREE.Quaternion().setFromAxisAngle(up, key * gold));
          piece(batch, center, [size, size, size], blossoms[palette][Math.floor(variation(key + 4) * 3)], orientation);
        }
      }
      return;
    }
    if (!substantial) {
      const root = new THREE.Vector3(at[0], 0, at[2]), fork = root.clone().setY(Math.min(.14, at[1] * .30));
      branch(root, fork, .022);
      for (let twig = 0; twig < 9; twig++) {
        const angle = twig * gold + seed, end = new THREE.Vector3(at[0] + Math.sin(angle) * rx * .65, at[1] + Math.sin(twig * 1.7) * ry * .55, at[2] + Math.cos(angle) * rz * .65);
        branch(fork, end, .010);
        for (let blade = 0; blade < 3; blade++) leaf(fork.clone().lerp(end, .15 + blade * .24), new THREE.Vector3(Math.sin(angle + blade), .35, Math.cos(angle + blade)), .22 + variation(seed + blade) * .09, 1.65, seed + twig * 3 + blade);
      }
    }
    for (let ix = -nx; ix <= nx; ix++) for (let iy = -ny; iy <= ny; iy++) for (let iz = -nz; iz <= nz; iz++) {
      if ((ix / nx) ** 2 + (iy / ny) ** 2 + (iz / nz) ** 2 > 1.04) continue;
      const key = seed + ix * 37 + iy * 101 + iz * 17;
      const phase = (value: number) => ((value % 3 + 3) % 3 - 1) / 3;
      const center = new THREE.Vector3(at[0] + ix / nx * rx + phase(iz) * rx / nx + (variation(key) - .5) * lobe * .40,
        at[1] + iy / ny * ry + phase(ix + iz) * ry / ny + (variation(key + 1) - .5) * lobe * .40,
        at[2] + iz / nz * rz + phase(iy) * rz / nz + (variation(key + 2) - .5) * lobe * .40);
      const size = .017 + variation(key + 3) * .006;
      center.y = Math.max(center.y, size + .02);
      const outward = center.clone().sub(new THREE.Vector3(...at)).normalize();
      const orientation = new THREE.Quaternion().setFromUnitVectors(forward, outward.lengthSq() ? outward : up).multiply(new THREE.Quaternion().setFromAxisAngle(forward, key * gold));
      for (let spray = 0; spray < 2; spray++) {
        const bearing = key * gold + spray * Math.PI;
        const node = center.clone().add(new THREE.Vector3(Math.sin(bearing) * .034, spray * .012, Math.cos(bearing) * .034));
        if (palette === 3) leaf(node, outward.clone().setY(.10), .075, 2.4, key + spray);
        else {
          const length = .095 + variation(key + spray + 3) * .035;
          piece(batch, node, [length * 1.7, length, length], blossoms[palette][Math.floor(variation(key + spray + 4) * 3)], orientation);
        }
      }
    }
  }
  function floweringTree(batch: Piece[], crownLeaves: Piece[], root: Point, center: Point, radii: Point, seed: number) {
    const ground = new THREE.Vector3(...root), fork = ground.clone().setY(center[1] - radii[1] * .9);
    branch(ground, fork, .105);
    piece(earth, ground.clone().setY(.007), [.42, .014, .36], '#4b4c36');
    for (let limb = 0; limb < 7; limb++) {
      const angle = limb * gold + seed, end = new THREE.Vector3(center[0] + Math.sin(angle) * radii[0] * .62, center[1] + Math.sin(limb * 2.1) * radii[1] * .38, center[2] + Math.cos(angle) * radii[2] * .62);
      branch(fork, end, .028 + variation(seed + limb) * .012);
      for (let blade = 0; blade < 8; blade++) {
        const node = fork.clone().lerp(end, .56 + blade * .05);
        leaf(node, new THREE.Vector3(Math.sin(angle + blade), .25, Math.cos(angle + blade)), .18 + variation(seed + blade) * .09, .94, seed + limb * 8 + blade);
      }
    }
    cloud(batch, center, radii, 0, seed, true, fork, crownLeaves);
  }

  function fern(x: number, z: number, height: number, radius: number, seed: number) {
    const root = new THREE.Vector3(x, .035, z);
    const bed = x < -3.7 ? [-5.6, -3.7, 4.1, 6.5] : x >= 5.7 && z >= 1.1 ? [5.7, 7, 1.1, 4.9] : z > 4.5 ? [1.95, 5.2, 4.5, 6.3] : [3.7, 6, -1.4, 2.8];
    if (z < -.62 && x < 4.20) bed[1] = 4.20;
    if (z < -.62 && x > 4.90) bed[0] = 4.90;
    radius = Math.min(radius, .82 * Math.min(x - bed[0], bed[1] - x, z - bed[2], bed[3] - z));
    piece(earth, new THREE.Vector3(x, .007, z), [Math.min(radius * 1.38, x - bed[0] - .002, bed[1] - x - .002), .014, Math.min(radius * 1.40, z - bed[2] - .002, bed[3] - z - .002)], '#3c4934');
    for (let frond = 0; frond < 6; frond++) {
      const angle = seed + frond * gold, outward = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      const tip = root.clone().addScaledVector(outward, radius * .86).add(new THREE.Vector3(0, height * .12, 0));
      const bend = root.clone().addScaledVector(outward, radius * .43).add(new THREE.Vector3(0, height * (.78 + variation(seed + frond) * .10), 0));
      const curve = new THREE.QuadraticBezierCurve3(root, bend, tip);
      for (let segment = 0; segment < 3; segment++) branch(curve.getPoint(segment / 3), curve.getPoint((segment + 1) / 3), .005 - segment * .0012, '#47633c', fernStems);
      for (let row = 0; row < 4; row++) for (const side of [-1, 1]) {
        const t = .20 + row * .20, node = curve.getPoint(t);
        const direction = new THREE.Vector3(Math.sin(angle + side * 1.10), -.06 - row * .04, Math.cos(angle + side * 1.10));
        leaf(node, direction, radius * (.83 - row * .12), 2.10, seed + row + frond * 9, fernLeaves);
      }
      leaf(tip, outward.clone().setY(-.16), radius * .24, 1.55, seed + frond, fernLeaves);
    }
  }

  // Broad pink crowns fill the lower-front/right massing; street overhangs stay above adult heads.
  floweringTree(frontCrown, frontLeaves, [3.23, 0, 4.95], [3.23, 2.95, 4.95], [1.24, .92, 1.07], 2);
  floweringTree(rightCrown, rightLeaves, [6.02, 0, 1.82], [5.90, 3.02, 1.90], [1.09, .97, .78], 91);
  cloud(shrubs, [-4.85, 1.10, 5.04], [.46, .72, .46], 0, 151);
  cloud(shrubs, [-5.08, .64, 6.03], [.31, .42, .29], 1, 181);
  cloud(shrubs, [-4.17, .49, 5.99], [.28, .31, .29], 2, 211);
  cloud(shrubs, [6.35, .72, 4.25], [.39, .50, .38], 1, 241);
  cloud(shrubs, [6.32, .51, 3.18], [.36, .33, .37], 2, 271);
  cloud(shrubs, [5.70, .48, 2.25], [.22, .30, .26], 3, 301);
  cloud(shrubs, [3.31, .56, 5.34], [.39, .36, .33], 3, 331);
  cloud(shrubs, [4.20, .68, 5.20], [.43, .44, .34], 2, 361);
  cloud(shrubs, [2.68, .61, 5.72], [.40, .39, .38], 1, 391);
  const undergrowth: [number, number, number, number][] = [
    [-5.14, 4.45, .48, .30], [-4.39, 4.46, .46, .25], [-5.38, 5.40, .54, .19], [-4.12, 5.30, .42, .25],
    [-4.71, 5.74, .52, .30], [-3.96, 6.12, .36, .16], [-5.30, 6.31, .32, .18],
    [6.02, 1.42, .54, .25], [6.72, 1.52, .59, .20], [6.02, 2.78, .52, .24], [6.72, 2.96, .45, .18],
    [6.01, 3.58, .44, .23], [6.75, 4.29, .48, .17], [6.16, 4.68, .31, .16],
    [3.96, -1.13, .55, .19], [5.27, -.61, .72, .20], [5.15, -1.13, .62, .19],
    [5.68, -.95, .51, .19], [5.69, -.32, .67, .21], [5.72, .28, .62, .18],
    [5.68, 1.59, .73, .25], [5.68, 2.23, .56, .22],
    [2.72, 4.85, .63, .29], [3.00, 5.61, .55, .23], [3.83, 5.37, .63, .27], [4.61, 5.36, .61, .30],
    [2.39, 5.55, .48, .23], [4.67, 4.94, .51, .28], [3.72, 5.94, .47, .25], [4.34, 5.81, .48, .26],
  ];
  undergrowth.forEach(([x, z, height, radius], index) => fern(x, z, height, radius, index * 1.71));

  const material = (name: string, roughness: number, vertexColors = false) => {
    const result = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness, vertexColors }); result.name = name; return result;
  };
  const matrix = new THREE.Matrix4(), color = new THREE.Color();
  function batch(name: string, geometry: THREE.BufferGeometry, surface: THREE.Material, parts: Piece[]) {
    const mesh = new THREE.InstancedMesh(geometry, surface, parts.length);
    mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true;
    parts.forEach((part, index) => { matrix.compose(part.at, part.rotation, part.size); mesh.setMatrixAt(index, matrix); mesh.setColorAt(index, color.set(part.color)); });
    mesh.computeBoundingBox(); mesh.computeBoundingSphere(); group.add(mesh);
    return (geometry.index?.count ?? geometry.attributes.position.count) / 3 * parts.length;
  }
  const cloudGeometry = blossomGeometry();
  const cloudMaterial = material('garden-flowering-masses', .89, true);
  const leafGeometry = closedLeaf(2), leafMaterial = material('garden-foliage', .78, true);
  const barkMaterial = material('garden-bark', .92);
  const triangles = batch('printer-garden-branches', new THREE.CylinderGeometry(.72, 1, 1, 4), barkMaterial, wood.filter(part => part.size.x <= .05))
    + batch('printer-garden-trunks', new THREE.CylinderGeometry(.72, 1, 1, 8), barkMaterial, wood.filter(part => part.size.x > .05))
    + batch('printer-garden-fern-stems', new THREE.CylinderGeometry(.72, 1, 1, 3), leafMaterial, fernStems)
    + batch('printer-garden-fern-leaves', fernBladeGeometry(), leafMaterial, fernLeaves)
    + batch('printer-garden-closed-leaves', leafGeometry, leafMaterial, foliage)
    + batch('printer-garden-front-crown-leaves', leafGeometry, leafMaterial, frontLeaves)
    + batch('printer-garden-right-crown-leaves', leafGeometry, leafMaterial, rightLeaves)
    + batch('printer-garden-root-beds', new THREE.CylinderGeometry(1, .9, 1, 8), material('garden-earth', 1), earth)
    + batch('printer-garden-front-pink-crown', cloudGeometry, cloudMaterial, frontCrown)
    + batch('printer-garden-right-pink-crown', cloudGeometry, cloudMaterial, rightCrown)
    + batch('printer-garden-layered-shrubs', fernBladeGeometry(), cloudMaterial, shrubs);
  group.userData.garden = { trees: 2, ferns: undergrowth.length, flowers: frontCrown.length + rightCrown.length, closedLeaves: foliage.length + frontLeaves.length + rightLeaves.length + fernLeaves.length + shrubs.length, crownBlossoms: frontCrown.length + rightCrown.length, shrubLeaves: shrubs.length, draws: 11, triangles };
  if (triangles > 150000) throw new Error(`Printer garden emits ${triangles} triangles; simplify its source clusters to remain within 150000.`);
  return group;
}

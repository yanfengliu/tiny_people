import * as THREE from 'three';

export interface PrinterPaperMaterials { paper: THREE.Material; ink: THREE.Material; blue: THREE.Material }
export type PrinterPaperPhase = 'feed' | 'release' | 'fall' | 'settle' | 'next';

// One retained life-time cycle. The first page starts fully extended for the reference view.
const CYCLE = 16, INITIAL = 10, FEED = 10, RELEASE = 11, FALL = 11.6, SETTLE = 14.8, NEXT = 15.6;
const WIDTH = 2.68, ROWS = 120, COLUMNS = 4, CAPACITY = 8, LAYER = .004;
const CENTER_X = -1.53, OFFSET_X = -.15, TAIL_Z = 7.06, CURVE_SAMPLES = 1024;
const smooth = (value: number) => value * value * (3 - 2 * value);
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Reusable printed surfaces. Time is supplied by the existing retained printer clock. */
export function createPrinterPaper(materials: PrinterPaperMaterials) {
  const group = new THREE.Group(); group.name = 'paper-waterfall'; group.position.x = OFFSET_X;
  group.userData.printerFeature = true;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(CENTER_X, 3.79, 2.52), new THREE.Vector3(CENTER_X, 3.88, 3.05),
    new THREE.Vector3(CENTER_X, 3.28, 3.62), new THREE.Vector3(CENTER_X, 1.15, 4.23),
    new THREE.Vector3(CENTER_X, .020, 5.28), new THREE.Vector3(CENTER_X, .009, TAIL_Z),
  ]);
  const length = curve.getLength();
  const curveY = new Float64Array(CURVE_SAMPLES + 1), curveZ = new Float64Array(CURVE_SAMPLES + 1);
  for (let i = 0; i <= CURVE_SAMPLES; i++) { const point = curve.getPointAt(i / CURVE_SAMPLES); curveY[i] = Math.max(.008, point.y); curveZ[i] = point.z; }
  const segmentLength = new Float64Array(ROWS), segmentAngle = new Float64Array(ROWS), fallY = new Float64Array(ROWS + 1), fallZ = new Float64Array(ROWS + 1);
  let emittedLength = 0;
  for (let row = 0; row < ROWS; row++) {
    const dy = curveValue(curveY, (row + 1) / ROWS) - curveValue(curveY, row / ROWS), dz = curveValue(curveZ, (row + 1) / ROWS) - curveValue(curveZ, row / ROWS);
    segmentLength[row] = Math.hypot(dy, dz); segmentAngle[row] = Math.atan2(dy, dz); emittedLength += segmentLength[row];
  }
  const foldSlope = Math.asin(.002 / emittedLength);
  function foldedAngle(row: number) { return row >= ROWS / 3 && row < ROWS * 2 / 3 ? -Math.PI + foldSlope : -foldSlope; }
  function chain(bend: number, base: number) {
    fallY[ROWS] = base + curveY[CURVE_SAMPLES] * (1 - bend) + .001 * bend; fallZ[ROWS] = TAIL_Z;
    for (let row = ROWS - 1; row >= 0; row--) {
      const angle = segmentAngle[row] * (1 - bend) + foldedAngle(row) * bend;
      fallY[row] = fallY[row + 1] - Math.sin(angle) * segmentLength[row];
      fallZ[row] = Math.min(TAIL_Z, fallZ[row + 1] - Math.cos(angle) * segmentLength[row]);
    }
  }
  chain(1, 0);
  const foldedStart = Math.min(...fallZ), foldedSpan = TAIL_Z - foldedStart;
  const paperMaterial = materials.paper.clone(); paperMaterial.side = THREE.DoubleSide; paperMaterial.name = 'paper-ribbon';
  // Ink already sits .5 mm above its own sheet. A slope-dependent decal bias can
  // pull covered diagrams through the opaque upper fold, whose gap is only 1.3 mm.
  const printMaterials = [materials.ink, materials.blue].map(material => { const copy = material.clone(); copy.name = `paper-print-${material.name}`; copy.polygonOffset = false; copy.polygonOffsetFactor = 0; copy.polygonOffsetUnits = 0; return copy; });
  const gridSize = (ROWS + 1) * (COLUMNS + 1) * 3;
  const activeGrid = new Float64Array(gridSize), topGrid = new Float64Array(gridSize);
  const activeNormals = new Float64Array(gridSize), topNormals = new Float64Array(gridSize);
  const cornerRows: number[] = [], cornerColumns: number[] = [];
  for (let row = 0; row < ROWS; row++) for (let column = 0; column < COLUMNS; column++) {
    for (const [r, c] of [[row, column], [row + 1, column + 1], [row, column + 1], [row, column], [row + 1, column], [row + 1, column + 1]]) { cornerRows.push(r); cornerColumns.push(c); }
  }
  const geometryBounds = new THREE.Box3(new THREE.Vector3(CENTER_X - WIDTH / 2, 0, 2.52), new THREE.Vector3(CENTER_X + WIDTH / 2, 4, TAIL_Z));
  function dynamicMesh(name: string, material: THREE.Material, vertices: number, castShadow = false) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(vertices * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(vertices * 2), 2).setUsage(THREE.DynamicDrawUsage));
    geometry.boundingBox = geometryBounds.clone(); geometry.boundingSphere = geometryBounds.getBoundingSphere(new THREE.Sphere());
    geometry.userData.solidRanges = [{ name, start: 0, count: vertices, ignoredBy: [] }];
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.castShadow = castShadow; mesh.receiveShadow = true; group.add(mesh);
    return mesh;
  }
  const sheet = dynamicMesh('paper-current-sheet', paperMaterial, cornerRows.length, true);
  const top = dynamicMesh('paper-stack-top', paperMaterial, cornerRows.length, true);
  const stackGeometry = new THREE.BoxGeometry(WIDTH, LAYER, foldedSpan);
  const stack = new THREE.InstancedMesh(stackGeometry, paperMaterial, CAPACITY - 1); stack.name = 'paper-ground-stack'; stack.count = 0;
  stack.instanceMatrix.setUsage(THREE.DynamicDrawUsage); stack.castShadow = true; stack.receiveShadow = true; group.add(stack);
  const matrix = new THREE.Matrix4();
  for (let layer = 0; layer < CAPACITY - 1; layer++) { matrix.makeTranslation(CENTER_X, LAYER * (layer + .5), foldedStart + foldedSpan / 2); stack.setMatrixAt(layer, matrix); }
  // InstancedMesh otherwise caches an empty sphere when the first render sees count=0.
  // The fixed matrices and subsequent downward compression stay inside this capacity bound.
  stack.boundingBox = new THREE.Box3(new THREE.Vector3(CENTER_X - WIDTH / 2, 0, foldedStart), new THREE.Vector3(CENTER_X + WIDTH / 2, (CAPACITY - 1) * LAYER, TAIL_Z)).expandByScalar(.000001);
  stack.boundingSphere = stack.boundingBox.getBoundingSphere(new THREE.Sphere());

  // Source-drawn architectural plans are stored in page coordinates, before deformation.
  // They are clipped at the actual outlet in page coordinates, then mapped onto sheet triangles.
  const plans: number[][] = [[], []];
  function triangle(color: number, a: number[], b: number[], c: number[]) {
    if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0) [b, c] = [c, b];
    plans[color].push(...a, ...b, ...c);
  }
  function diagram(row: number, column: number, large: boolean) {
    const t = .055 + row * .076, across = large ? 0 : -.47 + column * .94;
    const planWidth = large ? 2.16 : .93 + row % 2 * .04, depth = large ? .51 : .24 + row % 3 * .065, kind = (row * 3 + column) % 5;
    function rectangle(color: number, x: number, z: number, width: number, depth: number, angle = 0) {
      const corners = [[-width / 2, -depth / 2], [width / 2, -depth / 2], [width / 2, depth / 2], [-width / 2, depth / 2]].map(([dx, dz]) => [across * WIDTH / 2 + x + dx * Math.cos(angle) - dz * Math.sin(angle), t + (z + dx * Math.sin(angle) + dz * Math.cos(angle)) / length, .0005]);
      triangle(color, corners[0], corners[2], corners[1]); triangle(color, corners[0], corners[3], corners[2]);
    }
    function ring(x: number, z: number, radius: number, segments: number, arc = Math.PI * 2) {
      for (let segment = 0; segment < segments; segment++) {
        const corners: number[][] = [];
        for (const step of [segment, segment + 1]) for (const side of [-1, 1]) { const angle = step / segments * arc, r = radius + side * .003; corners.push([across * WIDTH / 2 + x + Math.cos(angle) * r, t + (z + Math.sin(angle) * r) / length, .0005]); }
        triangle(0, corners[0], corners[2], corners[1]); triangle(0, corners[1], corners[2], corners[3]);
      }
    }
    for (const x of [-planWidth / 2, planWidth / 2]) rectangle(0, x, 0, .012, depth);
    for (const z of [-depth / 2, depth / 2]) rectangle(0, 0, z, planWidth, .012);
    if (kind === 0 || kind === 4) {
      const bays = large ? 8 : 4, span = planWidth / bays;
      for (let wall = 0; wall < bays; wall++) {
        const x = -planWidth / 2 + span * (wall + .5), offset = (wall + row) % 3 * .021;
        rectangle(0, x, offset, .011, depth * (.50 + wall % 3 * .13));
        rectangle(0, x + span * .14, wall % 2 ? depth * .22 : -depth * .24, span * .83, .009);
        ring(x + span * .09, depth * .09, span * .24, 12, Math.PI / 2);
        for (let hatch = 0; hatch < 4; hatch++) rectangle(0, x - span * .24, -depth * .36 + hatch * depth * .072, span * .28, .006);
      }
    } else if (kind === 1) {
      const windows = large ? 10 : 5;
      for (let story = 0; story < 3; story++) {
        const z = -depth * .31 + story * depth * .29; rectangle(0, 0, z + depth * .11, planWidth * .92, .008);
        for (let window = 0; window < windows; window++) { const x = -planWidth * .42 + window / (windows - 1) * planWidth * .84; rectangle(1, x, z, planWidth / windows * .48, depth * .13); rectangle(0, x, z, .006, depth * .13); }
      }
    } else if (kind === 2) {
      for (let wheel = 0; wheel < 3; wheel++) {
        const x = -planWidth * .29 + wheel * planWidth * .29, radius = depth * (.20 + wheel % 2 * .05);
        for (const r of [radius, radius * .47]) ring(x, 0, r, 22);
        rectangle(0, x, 0, radius * 1.8, .006); rectangle(0, x, 0, .006, radius * 1.8);
        for (let tooth = 0; tooth < 8; tooth++) { const angle = tooth * Math.PI / 4; rectangle(0, x + Math.cos(angle) * radius * 1.18, Math.sin(angle) * radius * 1.18, .026, .008, angle); }
      }
    } else {
      const modules = large ? 8 : 4;
      for (let module = 0; module < modules; module++) {
        const x = -planWidth * .42 + module / (modules - 1) * planWidth * .84, z = module % 2 ? depth * .17 : -depth * .17;
        rectangle(1, x, z, planWidth / modules * .48, depth * .24);
        for (const offset of [-1, 1]) rectangle(0, x, z + offset * depth * .14, planWidth / modules * .71, .007);
        rectangle(0, x + planWidth / modules * .35, 0, .006, depth * .64);
        for (let trace = 0; trace < 3; trace++) rectangle(0, x - planWidth / modules * .18 + trace * .023, z, .006, depth * .34);
      }
    }
    for (let mark = 0; mark < (large ? 16 : 7); mark++) rectangle(0, -planWidth * .46 + mark / (large ? 15 : 6) * planWidth * .92, depth / 2 + .033, .006, .036);
    rectangle(0, 0, depth / 2 + .044, planWidth * .94, .006);
  }
  for (let row = 0; row < 12; row++) { const large = [2, 6, 10].includes(row); for (let column = 0; column < (large ? 1 : 2); column++) diagram(row, column, large); }
  const printTemplates = plans.map(values => new Float64Array(values));
  const activePrint = printTemplates.map((values, color) => dynamicMesh(`paper-current-print-${color}`, printMaterials[color], values.length / 9 * 6));
  const topPrint = printTemplates.map((values, color) => dynamicMesh(`paper-top-print-${color}`, printMaterials[color], values.length / 9 * 6));
  const clip = new Float64Array(12), mapped = new Float64Array(6);
  let progress = 0, observedProgress = 0, manualTravel = 0, renderedTravel = 0, time = 0;
  let travelAtTurn = 0, progressAtTurn = 0, direction = 0;
  let phase: PrinterPaperPhase = 'feed', phaseTime = INITIAL, feed = 1, completed = 0, stackCount = 0, compression = 0, frameCount = 0;
  let lastTopCount = -1;
  function curveValue(values: Float64Array, fraction: number) { const at = clamp(fraction) * CURVE_SAMPLES, index = Math.min(CURVE_SAMPLES - 1, Math.floor(at)); return values[index] + (values[index + 1] - values[index]) * (at - index); }
  function buildGrid(grid: Float64Array, normals: Float64Array, resting: boolean, base: number) {
    const falling = phase === 'fall' ? clamp((phaseTime - FALL) / (SETTLE - FALL)) : phase === 'settle' || phase === 'next' ? 1 : 0;
    const bend = resting ? 1 : phase === 'release' ? .2 * smooth(clamp((phaseTime - RELEASE) / (FALL - RELEASE))) : phase === 'fall' ? .2 + .8 * (1 - (1 - falling) * (1 - falling)) : phase === 'settle' || phase === 'next' ? 1 : 0;
    const threshold = resting ? 0 : 1 - feed;
    if (resting || phase !== 'feed') chain(bend, 0);
    for (let row = 0; row <= ROWS; row++) {
      const u = row / ROWS, material = threshold + u * (resting ? 1 : feed), path = resting ? material : u * feed;
      const originalY = curveValue(curveY, path) + base * smooth(clamp((path - .57) / .43));
      const flutter = resting ? 0 : .012 * Math.sin(material * Math.PI * 3 + falling * Math.PI * 2) * Math.sin(material * Math.PI) * Math.sin(falling * Math.PI);
      const y = resting || phase !== 'feed' ? fallY[row] + base * (bend + (1 - bend) * smooth(clamp((path - .57) / .43))) + flutter : originalY;
      const z = resting || phase !== 'feed' ? fallZ[row] : curveValue(curveZ, path);
      for (let column = 0; column <= COLUMNS; column++) {
        const across = column / COLUMNS * 2 - 1, offset = (row * (COLUMNS + 1) + column) * 3;
        grid[offset] = CENTER_X + across * WIDTH / 2;
        grid[offset + 1] = Math.max(base + .001, y + (resting ? 0 : (1 - bend) * .006 * Math.sin(across * Math.PI) * Math.sin(path * Math.PI)));
        grid[offset + 2] = z;
      }
    }
    for (let row = 0; row <= ROWS; row++) for (let column = 0; column <= COLUMNS; column++) {
      const offset = (row * (COLUMNS + 1) + column) * 3, previous = (Math.max(0, row - 1) * (COLUMNS + 1) + column) * 3, next = (Math.min(ROWS, row + 1) * (COLUMNS + 1) + column) * 3;
      const dy = grid[next + 1] - grid[previous + 1], dz = grid[next + 2] - grid[previous + 2], magnitude = Math.hypot(dy, dz) || 1;
      normals[offset] = 0; normals[offset + 1] = dz / magnitude; normals[offset + 2] = -dy / magnitude;
      if (!dy && !dz) normals[offset + 1] = 1;
    }
  }
  function writeSheet(mesh: THREE.Mesh, grid: Float64Array, normals: Float64Array, threshold = 0) {
    const positions = mesh.geometry.getAttribute('position'), normal = mesh.geometry.getAttribute('normal'), uv = mesh.geometry.getAttribute('uv');
    for (let i = 0; i < cornerRows.length; i++) { const source = (cornerRows[i] * (COLUMNS + 1) + cornerColumns[i]) * 3; positions.setXYZ(i, grid[source], grid[source + 1], grid[source + 2]); normal.setXYZ(i, normals[source], normals[source + 1], normals[source + 2]); uv.setXY(i, cornerColumns[i] / COLUMNS, threshold + cornerRows[i] / ROWS * (1 - threshold)); }
    positions.needsUpdate = normal.needsUpdate = uv.needsUpdate = true;
  }
  function mapPoint(x: number, material: number, height: number, threshold: number, grid: Float64Array, normals: Float64Array) {
    const r = clamp((material - threshold) / Math.max(.0000001, 1 - threshold)) * ROWS, c = clamp((x + WIDTH / 2) / WIDTH) * COLUMNS;
    const row = Math.min(ROWS - 1, Math.floor(r)), column = Math.min(COLUMNS - 1, Math.floor(c)), fr = r - row, fc = c - column;
    const a = (row * (COLUMNS + 1) + column) * 3, b = a + 3, d = a + (COLUMNS + 1) * 3, e = d + 3;
    for (let axis = 0; axis < 3; axis++) {
      mapped[axis] = fc >= fr ? grid[a + axis] * (1 - fc) + grid[b + axis] * (fc - fr) + grid[e + axis] * fr : grid[a + axis] * (1 - fr) + grid[d + axis] * (fr - fc) + grid[e + axis] * fc;
      mapped[axis + 3] = fc >= fr ? normals[a + axis] * (1 - fc) + normals[b + axis] * (fc - fr) + normals[e + axis] * fr : normals[a + axis] * (1 - fr) + normals[d + axis] * (fr - fc) + normals[e + axis] * fc;
    }
    const magnitude = Math.hypot(mapped[3], mapped[4], mapped[5]) || 1;
    for (let axis = 0; axis < 3; axis++) { mapped[axis + 3] /= magnitude; mapped[axis] += mapped[axis + 3] * height; }
  }
  function writePrint(meshes: THREE.Mesh[], threshold: number, grid: Float64Array, normals: Float64Array) {
    for (let color = 0; color < printTemplates.length; color++) {
      const source = printTemplates[color], geometry = meshes[color].geometry, positions = geometry.getAttribute('position'), normal = geometry.getAttribute('normal'), uv = geometry.getAttribute('uv'); let emitted = 0;
      for (let start = 0; start < source.length; start += 9) {
        let count = 0;
        for (let edge = 0; edge < 3; edge++) {
          const a = start + edge * 3, b = start + (edge + 1) % 3 * 3, inside = source[a + 1] >= threshold, nextInside = source[b + 1] >= threshold;
          if (inside) { for (let axis = 0; axis < 3; axis++) clip[count * 3 + axis] = source[a + axis]; count++; }
          if (inside !== nextInside) { const blend = (threshold - source[a + 1]) / (source[b + 1] - source[a + 1]); for (let axis = 0; axis < 3; axis++) clip[count * 3 + axis] = source[a + axis] + (source[b + axis] - source[a + axis]) * blend; count++; }
        }
        for (let fan = 1; fan < count - 1; fan++) for (let corner = 0; corner < 3; corner++) {
          const index = (corner === 0 ? 0 : corner === 1 ? fan : fan + 1) * 3;
          mapPoint(clip[index], clip[index + 1], clip[index + 2], threshold, grid, normals);
          positions.setXYZ(emitted, mapped[0], mapped[1], mapped[2]); normal.setXYZ(emitted, mapped[3], mapped[4], mapped[5]); uv.setXY(emitted, clip[index] / WIDTH + .5, clip[index + 1]); emitted++;
        }
      }
      geometry.setDrawRange(0, emitted); positions.needsUpdate = normal.needsUpdate = uv.needsUpdate = true;
    }
  }
  function render() {
    const elapsed = INITIAL + time + manualTravel * CYCLE;
    completed = Math.floor(elapsed / CYCLE); phaseTime = elapsed - completed * CYCLE;
    phase = phaseTime < RELEASE ? 'feed' : phaseTime < FALL ? 'release' : phaseTime < SETTLE ? 'fall' : phaseTime < NEXT ? 'settle' : 'next';
    feed = Math.min(1, phaseTime / FEED); stackCount = Math.min(CAPACITY, completed + (phase === 'next' ? 1 : 0));
    compression = completed >= CAPACITY && phaseTime >= FALL ? smooth(clamp((phaseTime - FALL) / (SETTLE - FALL))) : 0;
    const existing = Math.min(CAPACITY, completed), base = existing * LAYER - compression * LAYER;
    sheet.visible = phase !== 'next' && feed > .000001; activePrint.forEach(mesh => { mesh.visible = sheet.visible; });
    buildGrid(activeGrid, activeNormals, false, base); writeSheet(sheet, activeGrid, activeNormals, 1 - feed); writePrint(activePrint, 1 - feed, activeGrid, activeNormals);
    if (lastTopCount !== stackCount) {
      buildGrid(topGrid, topNormals, true, Math.max(0, stackCount - 1) * LAYER); writeSheet(top, topGrid, topNormals); writePrint(topPrint, 0, topGrid, topNormals); lastTopCount = stackCount;
    }
    const scale = existing ? 1 - compression / existing : 1;
    top.scale.y = phase === 'next' ? 1 : scale; top.visible = stackCount > 0; topPrint.forEach(mesh => { mesh.visible = top.visible; mesh.scale.y = top.scale.y; });
    stack.count = Math.max(0, stackCount - 1); stack.scale.y = top.scale.y;
    renderedTravel = manualTravel;
    frameCount++;
  }
  function update(nextTime: number) {
    if (!Number.isFinite(nextTime) || nextTime < 0) throw new Error('Printer paper time must be finite and nonnegative.');
    if (nextTime === time && progress === observedProgress && manualTravel === renderedTravel) return;
    observedProgress = progress; time = nextTime;
    render();
  }
  function setProgress(nextProgress: number) {
    if (!Number.isFinite(nextProgress)) throw new Error('Printer paper progress must be finite.');
    progress = clamp(nextProgress);
  }
  /** Actual mechanism substeps, including the braking apex after a command reversal. */
  function recordTravel(from: number, to: number) {
    if (![from, to].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) throw new Error('Printer paper travel endpoints must be finite progress values from zero to one.');
    const change = Math.sign(to - from);
    if (!change) return;
    if (change !== direction) { travelAtTurn = manualTravel; progressAtTurn = from; direction = change; }
    manualTravel += Math.abs(to - from);
  }
  function snapshot() {
    return { time, phase, phaseTime, feed, completed, stackCount, progress, observedProgress, manualTravel, renderedTravel, travelAtTurn, progressAtTurn, direction, compression, frameCount,
      cycleSeconds: CYCLE, initialSeconds: INITIAL, stackCapacity: CAPACITY, layerHeight: LAYER, width: WIDTH, length, emittedLength, foldedSpan, foldedStart,
      activePrintVertices: activePrint.map(mesh => mesh.geometry.drawRange.count), topPrintVertices: topPrint.map(mesh => mesh.geometry.drawRange.count) };
  }
  render(); group.userData.printerPaper = { snapshot };
  return { group, update, setProgress, recordTravel, snapshot };
}

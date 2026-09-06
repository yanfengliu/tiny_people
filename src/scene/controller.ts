import * as THREE from 'three';
import { box, cylinder, extrude, line, ring, solid } from './geometry';
import { brushedMetal, grainedPlastic } from './materials';
import { batchMechanism, boundedProgress, hingeTravelBound, linearTravelBound, mechanismBox, socketGeometry } from './mechanism-geometry';
import type { MechanismAssembly } from './mechanism-types';
import { addFaceButtonMark } from './button-markings';

function plastic(color: string, roughness = .65, metalness = 0) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }

export const controllerDimensions = { top: 1.55, board: .97, width: 5.6, length: 13.8, openingStart: 2.65 };

export function controllerMechanisms(controller: THREE.Group): MechanismAssembly[] {
  return controller.userData.mechanisms ?? [];
}

export function createController() {
  const group = new THREE.Group();
  group.name = 'joy-con';
  const mechanisms: MechanismAssembly[] = [];
  group.userData.mechanisms = mechanisms;
  const charcoal = grainedPlastic('#3a3b3d', .76,.006);
  const side = grainedPlastic('#303235',.8,.003);
  const seam = plastic('#131519');
  const rubber = grainedPlastic('#2b2d30', .78,.0015,.18);
  // A restrained local bounce term keeps recessed rubber readable without lifting the whole scene.
  rubber.emissive.set('#45494d');
  rubber.emissiveIntensity = .10;
  const coral = plastic('#fa6450', .52);
  const coralDark = plastic('#c44c3d', .67);
  const silver = brushedMetal('#a4a7a3', .29, .82);
  const ink = plastic('#969b99', .76);
  const gold = brushedMetal('#b3983c', .34, .72);
  const pcb = grainedPlastic('#28664b', .57,.0009);
  const trace = plastic('#3d8060', .64, .12);
  const laminate = grainedPlastic('#a2a66d', .84,.0007);
  const darkGreen = plastic('#1a4d38', .83);
  const packageResin = grainedPlastic('#202326',.72,.0006);

  function outline(front = -6.7, back = 6.7, inset = 0) {
    const left = -2.55 + inset, right = 2.65 - inset, radius = 1.5 - inset * .3;
    const s = new THREE.Shape();
    s.moveTo(left + .3, front); s.lineTo(right - radius, front);
    s.quadraticCurveTo(right, front, right, front + radius);
    s.lineTo(right, back - radius); s.quadraticCurveTo(right, back, right - radius, back);
    s.lineTo(left + .35, back); s.quadraticCurveTo(left, back, left, back - .4);
    s.lineTo(left, front + .4); s.quadraticCurveTo(left, front, left + .3, front);
    return s;
  }

  // Thin tray floor plus hollow walls: a full-height solid would bury the board.
  extrude(group, side, outline(), .22, .20, .15);
  const wallShape = outline();
  wallShape.holes.push(outline(-6.7,6.7,.27));
  extrude(group,side,wallShape,.52,.43,.045);
  const seamShape = outline(-6.7,6.7,.025);
  seamShape.holes.push(outline(-6.7,6.7,.25));
  extrude(group, seam, seamShape, .07, .96, .025);
  for (const x of [-1.8,1.7]) for (const z of [3.15,5.7]) cylinder(group,side,.14,.39,x,.66,z);

  const face = new THREE.Shape();
  face.moveTo(-2.25, -6.7); face.lineTo(1.15, -6.7); face.quadraticCurveTo(2.65,-6.7,2.65,-5.2);
  face.lineTo(2.65,2.65); face.lineTo(-2.55,2.65); face.lineTo(-2.55,-6.3); face.quadraticCurveTo(-2.55,-6.7,-2.25,-6.7);
  // This bounded service well is behind the shoulder promenade. The occupied face stays fixed.
  const shoulderWell = new THREE.Path();
  shoulderWell.moveTo(-.66,-6.61); shoulderWell.lineTo(1.45,-6.61);
  shoulderWell.lineTo(1.45,-6.33); shoulderWell.lineTo(-.66,-6.33); shoulderWell.closePath();
  face.holes.push(shoulderWell);
  extrude(group, charcoal, face, .45, 1.03, .07).userData.walkSurface = true;

  // The opening has a continuous raised lower-shell rim, rather than a board on top of the case.
  const rim = new THREE.Shape();
  rim.moveTo(-2.53, 2.7); rim.lineTo(-2.53, 6.15); rim.quadraticCurveTo(-2.53,6.7,-2.05,6.7);
  rim.lineTo(1.15,6.7); rim.quadraticCurveTo(2.65,6.7,2.65,5.2); rim.lineTo(2.65,2.7);
  rim.lineTo(2.39,2.7); rim.lineTo(2.39,5.1); rim.quadraticCurveTo(2.39,6.4,1.12,6.4);
  rim.lineTo(-1.96,6.4); rim.quadraticCurveTo(-2.27,6.4,-2.27,6.12); rim.lineTo(-2.27,2.7); rim.closePath();
  extrude(group, charcoal, rim, .33, 1.02, .045);
  for (const x of [-2.14,2.22]) for (const z of [3.03,4.55,5.9]) {
    cylinder(group, side, .17, .48, x, 1.0, z);
    cylinder(group, silver, .105, .045, x, 1.27, z);
    box(group, seam, [.105,.018,.022], [x,1.296,z], .006);
  }

  // The coral service cover opens away from every inhabited surface.
  const railRoot = new THREE.Group(); railRoot.name = 'rail-assembly'; group.add(railRoot);
  const railMoving = new THREE.Group(), railFixed = new THREE.Group();
  const railGreen = plastic('#477b67',.67), flexCopper = plastic('#bb743f',.55,.18), ceramic = plastic('#c8c0a9',.72);
  const panel = new THREE.Shape(), halfLength = 5.29, halfHeight = .41, corner = .27;
  panel.moveTo(-halfLength+corner,-halfHeight); panel.lineTo(halfLength-corner,-halfHeight);
  panel.quadraticCurveTo(halfLength,-halfHeight,halfLength,-halfHeight+corner); panel.lineTo(halfLength,halfHeight-corner);
  panel.quadraticCurveTo(halfLength,halfHeight,halfLength-corner,halfHeight); panel.lineTo(-halfLength+corner,halfHeight);
  panel.quadraticCurveTo(-halfLength,halfHeight,-halfLength,halfHeight-corner); panel.lineTo(-halfLength,-halfHeight+corner);
  panel.quadraticCurveTo(-halfLength,-halfHeight,-halfLength+corner,-halfHeight); panel.closePath();
  const panelGeometry = new THREE.ExtrudeGeometry(panel,{depth:.036,bevelEnabled:true,bevelSize:.01,bevelThickness:.01,bevelSegments:2,curveSegments:12});
  panelGeometry.rotateY(-Math.PI/2);
  solid(panelGeometry,coral,railMoving,-3.079,1,-1.08);
  // Open inward-facing cavity: thin outer skin, perimeter walls, molded ribs and screw bosses.
  mechanismBox(railMoving,coralDark,[.014,.65,9.95],[-3.061,1,-1.08],.006);
  mechanismBox(railMoving,coral,[.365,.060,10.08],[-2.886,.610,-1.08],.022);
  // A molded rim notch leaves space around the stationary strain-relief housing.
  for (const [from,to] of [[-6.12,.52],[.84,3.96]]) mechanismBox(railMoving,coral,[.365,.060,to-from],[-2.886,1.390,(from+to)/2],.022);
  for (const z of [-6.235,4.075]) mechanismBox(railMoving,coral,[.365,.52,.060],[-2.886,1,z],.022);
  for (const z of [-5.60,-3.65,-.80,1.75,3.50]) {
    for (const y of [.80,1.20]) mechanismBox(railMoving,coralDark,[.12,.045,.055],[-3.006,y,z],.008);
    const boss = solid(new THREE.CylinderGeometry(.065,.075,.065,20),coralDark,railMoving,-3.018,1,z); boss.rotation.z = Math.PI/2;
    const screw = solid(new THREE.CylinderGeometry(.032,.032,.015,16),silver,railMoving,-2.982,1,z); screw.rotation.z = Math.PI/2;
    mechanismBox(railMoving,seam,[.005,.011,.037],[-2.972,1,z],.002);
  }
  const railControls = new THREE.Group(); railControls.position.set(-3.135,1.06,-1.08); railControls.rotation.z = Math.PI / 2; railMoving.add(railControls);
  for (const z of [-2.65,2.65]) {
    box(railControls, coralDark, [.52,.04,1.55], [0,0,z], .17);
    box(railControls, coral, [.43,.06,1.37], [0,.035,z], .14);
  }
  for (let i = 0; i < 4; i++) box(railControls, i === 0 ? plastic('#c7ec8f', .4) : ink, [.13,.035,.11], [0,.035,-.42+i*.28], .025);
  box(railControls, seam, [.3,.06,.57], [0,.02,1.06], .1);
  box(railControls, silver, [.18,.065,.37], [0,.035,1.06], .03);
  box(railControls, seam, [.13,.07,.28], [0,.05,1.06], .01);
  cylinder(railControls, coralDark, .23,.025,0,.04,-4.6);
  cylinder(railControls, coral, .17,.04,0,.06,-4.6);

  // Raised electronics on a metal-backed channel remain outside the unchanged tray wall.
  mechanismBox(railFixed,silver,[.036,.66,9.60],[-2.709,.990,-1.08],.020);
  mechanismBox(railFixed,railGreen,[.026,.51,8.95],[-2.765,.995,-1.08],.008);
  for (const z of [-4.32,-1.75,1.69]) {
    const length = z < -3 ? .77 : z < 0 ? 1.0 : .63;
    mechanismBox(railFixed,seam,[.065,.19,length],[-2.815,1.00,z],.015);
    for (let i = 0; i < 6; i++) for (const sign of [-1,1]) {
      mechanismBox(railFixed,silver,[.050,.060,.029],[-2.803,1.0+sign*.113,z-length*.39+i*length*.156],.004);
    }
    const dot = solid(new THREE.CylinderGeometry(.023,.023,.008,12),ink,railFixed,-2.853,1.045,z-length*.32); dot.rotation.z=Math.PI/2;
  }
  for (let i = 0; i < 8; i++) {
    const z = -4.88+i*1.075;
    const height=.048+(i%3)*.008,length=.10+(i%3)*.015;
    mechanismBox(railFixed,ceramic,[.058,height,length],[-2.810,.821,z],.008);
    for (const dz of [-length/2,length/2]) mechanismBox(railFixed,silver,[.064,height+.003,.019],[-2.810,.821,z+dz],.003);
  }
  for (const z of [-5.25,-2.75,-.25,2.95]) for (const y of [.812,1.180]) {
    const mount = solid(new THREE.CylinderGeometry(.040,.040,.070,16),silver,railFixed,-2.730,y,z); mount.rotation.z=Math.PI/2;
    const washer = solid(new THREE.CylinderGeometry(.047,.047,.019,16),gold,railFixed,-2.788,y,z); washer.rotation.z=Math.PI/2;
    const screw = solid(new THREE.CylinderGeometry(.031,.031,.018,16),silver,railFixed,-2.801,y,z); screw.rotation.z=Math.PI/2;
    mechanismBox(railFixed,seam,[.005,.010,.033],[-2.812,y,z],.002);
  }
  for (const y of [.864,1.176]) line(railFixed,gold,[new THREE.Vector3(-2.782,y,-5.30),new THREE.Vector3(-2.782,y,3.15)],.006);
  // A cream latch socket and exposed contact fingers distinguish the flex terminal from the ICs.
  mechanismBox(railFixed,seam,[.066,.19,.57],[-2.817,1.032,.66],.012);
  for (let i=0;i<7;i++) mechanismBox(railFixed,gold,[.025,.104,.027],[-2.859,1.032,.438+i*.073],.003);
  mechanismBox(railFixed,ceramic,[.050,.043,.60],[-2.839,1.142,.66],.008);
  const railPivotPosition = new THREE.Vector3(-2.69,1.48,-1.08);
  for (const z of [-5.6,-1.1,3.35]) {
    const pin = solid(new THREE.CylinderGeometry(.029,.029,.36,12), silver, railFixed, railPivotPosition.x,railPivotPosition.y,z);
    pin.rotation.x = Math.PI / 2;
    for (const offset of [-.17,.17]) mechanismBox(railFixed, side, [.19,.025,.032], [-2.605,1.48,z+offset], .004);
    for (const offset of [-.060,.060]) {
      solid(new THREE.TorusGeometry(.050,.009,6,20), coralDark, railMoving, railPivotPosition.x,railPivotPosition.y,z+offset);
      mechanismBox(railMoving, coralDark, [.027,.105,.045], [-2.749,1.422,z+offset], .006);
    }
  }
  // Both latch jaws sit inside the lower wall's swept circle, above its early rising arc.
  mechanismBox(railFixed,side,[.18,.050,.23],[-2.802,.815,2.75],.008);
  mechanismBox(railFixed,silver,[.030,.085,.23],[-2.899,.815,2.75],.006);
  mechanismBox(railMoving,coralDark,[.110,.075,.19],[-3.000,.815,2.75],.006);
  // The strain-relief hub is coaxial with the hinge: its body endpoint never translates.
  // A rigid folded flex tail stays attached to the cover; the fixed annulus captures the hub with an air gap.
  solid(new THREE.TorusGeometry(.066,.013,8,28),seam,railFixed,-2.69,1.48,.68);
  mechanismBox(railFixed,side,[.040,.105,.060],[-2.69,1.348,.68],.008);
  const flexHub = solid(new THREE.CylinderGeometry(.036,.036,.24,20),flexCopper,railMoving,-2.69,1.48,.64); flexHub.rotation.x=Math.PI/2;
  function flexStrip(parent: THREE.Group, points: [number,number][], z: number, width: number) {
    for(let i=1;i<points.length;i++) {
      const a=points[i-1], b=points[i], dx=b[0]-a[0], dy=b[1]-a[1];
      const strip=mechanismBox(parent,flexCopper,[Math.hypot(dx,dy),.012,width],[(a[0]+b[0])/2,(a[1]+b[1])/2,z],.003);
      strip.rotation.z=Math.atan2(dy,dx);
    }
  }
  flexStrip(railFixed,[[-2.865,1.085],[-2.860,1.253],[-2.755,1.385],[-2.69,1.401]],.68,.15);
  // The folded service loop passes above the components before returning down the cover wall.
  flexStrip(railMoving,[[-2.69,1.48],[-2.78,1.360],[-3.015,1.310],[-3.045,1.045]],.435,.18);
  mechanismBox(railMoving,seam,[.024,.12,.23],[-3.036,1.045,.435],.008);
  const railMovingBatch = batchMechanism(railMoving, 'rail-cover');
  const railFixedBatch = batchMechanism(railFixed, 'rail-interior');
  const railPivot = new THREE.Group(); railPivot.position.copy(railPivotPosition); railRoot.add(railPivot,railFixedBatch.group);
  railMovingBatch.group.position.copy(railPivotPosition).multiplyScalar(-1); railPivot.add(railMovingBatch.group);
  group.updateMatrixWorld(true);
  const railAngle = -2 * Math.PI / 3;
  mechanisms.push({
    id: 'rail', label: 'Coral service rail', root: railRoot,
    pickMeshes: railMovingBatch.meshes, movingMeshes: railMovingBatch.meshes, fixedMeshes: railFixedBatch.meshes,
    maximumPointTravel: hingeTravelBound(railMovingBatch.meshes,railPivotPosition,'z',railAngle),
    setProgress(progress) { railPivot.rotation.z = railAngle * boundedProgress(progress); railRoot.updateMatrixWorld(true); },
  });

  // Right Joy-Con: X north, A east, B south, Y west, joystick below.
  for (const [x, z, mark] of [[.45,-5.05,'X'],[1.51,-4,'A'],[.45,-2.95,'B'],[-.61,-4,'Y']] as const) {
    solid(new THREE.CylinderGeometry(.64,.64,.06,96),seam,group,x,1.56,z);
    solid(new THREE.CylinderGeometry(.595,.625,.21,96),rubber,group,x,1.68,z);
    solid(new THREE.CylinderGeometry(.56,.59,.075,96),charcoal,group,x,1.815,z);
    addFaceButtonMark(group,mark,x,z);
  }
  box(group,seam,[.66,.055,.66],[-1.52,1.56,-5.5],.15);
  box(group,rubber,[.66,.15,.22],[-1.52,1.65,-5.5],.035);
  box(group,rubber,[.22,.15,.66],[-1.52,1.65,-5.5],.035);

  const stickX = -.25, stickZ = .18;
  const stickRoot = new THREE.Group(); stickRoot.name = 'joystick-assembly'; group.add(stickRoot);
  const stickFixed = new THREE.Group(), stickCap = new THREE.Group(), stickShaft = new THREE.Group();
  cylinder(stickFixed,seam,1.29,.075,stickX,1.56,stickZ);
  cylinder(stickFixed,coral,1.26,.18,stickX,1.67,stickZ,1.21);
  solid(socketGeometry(.83,.72,.34,1.69,1.91),coralDark,stickFixed,stickX,0,stickZ);
  solid(socketGeometry(.52,.52,.34,1.91,2.005),seam,stickFixed,stickX,0,stickZ);
  // The inner guide stays seated inside the hollow socket as its top follows the cap.
  const shaftBottom = 1.765, shaftTop = 2.035, shaftHeight = shaftTop - shaftBottom;
  solid(new THREE.CylinderGeometry(.30,.30,shaftHeight,40),silver,stickShaft,stickX,(shaftBottom+shaftTop)/2,stickZ);
  for (let i = 0; i < 3; i++) {
    const angle = i * Math.PI * 2 / 3;
    const groove = mechanismBox(stickShaft,seam,[.025,shaftHeight-.025,.012],[stickX+Math.sin(angle)*.301,(shaftBottom+shaftTop)/2,stickZ+Math.cos(angle)*.301],.003);
    groove.rotation.y = angle;
  }
  solid(new THREE.CylinderGeometry(1.10,1.02,.25,112),rubber,stickCap,stickX,2.15,stickZ);
  const capRim=solid(new THREE.TorusGeometry(.99,.145,12,128),rubber,stickCap,stickX,2.29,stickZ);capRim.rotation.x=-Math.PI/2;
  solid(new THREE.CylinderGeometry(.90,.90,.055,112),rubber,stickCap,stickX,2.255,stickZ);
  ring(stickCap,charcoal,.80,.014,stickX,2.29,stickZ);
  solid(socketGeometry(.43,.43,.305,2.022,2.043),gold,stickCap,stickX,0,stickZ);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const notch = box(stickCap,charcoal,[.025,.014,.17],[stickX+Math.sin(a)*1.045,2.411,stickZ+Math.cos(a)*1.045],.005);
    notch.rotation.y = a;
  }
  const stickFixedBatch = batchMechanism(stickFixed,'joystick-socket');
  const stickCapBatch = batchMechanism(stickCap,'joystick-cap');
  const stickShaftBatch = batchMechanism(stickShaft,'joystick-shaft');
  const shaftAnchor = new THREE.Group(); shaftAnchor.position.y = shaftBottom;
  stickShaftBatch.group.position.y = -shaftBottom; shaftAnchor.add(stickShaftBatch.group);
  stickRoot.add(stickFixedBatch.group,stickCapBatch.group,shaftAnchor);
  const stickMovingMeshes = [...stickCapBatch.meshes,...stickShaftBatch.meshes], stickLift = .42;
  const setStickProgress = (progress: number) => {
    const amount = boundedProgress(progress);
    stickCapBatch.group.position.y = stickLift * amount;
    shaftAnchor.scale.y = 1 + stickLift / shaftHeight * amount;
    stickRoot.updateMatrixWorld(true);
  };
  mechanisms.push({
    id:'joystick', label:'Joystick inspection lift', root:stickRoot,
    pickMeshes:stickCapBatch.meshes, movingMeshes:stickMovingMeshes, fixedMeshes:stickFixedBatch.meshes,
    maximumPointTravel:linearTravelBound(stickMovingMeshes,setStickProgress), setProgress:setStickProgress,
  });
  cylinder(group,seam,.30,.035,1.65,1.565,1.75);
  cylinder(group,rubber,.255,.09,1.65,1.62,1.75);
  line(group, ink, [[1.51,1.675,1.75],[1.65,1.675,1.61],[1.79,1.675,1.75]].map(p=>new THREE.Vector3(...p)),.016);
  line(group, ink, [[1.55,1.675,1.71],[1.55,1.675,1.88],[1.75,1.675,1.88],[1.75,1.675,1.71]].map(p=>new THREE.Vector3(...p)),.014);

  // Rear service cap opens up/back; its real well reveals a fixed lever and return spring.
  const shoulderRoot = new THREE.Group(); shoulderRoot.name = 'shoulder-assembly'; group.add(shoulderRoot);
  const shoulderMoving = new THREE.Group(), shoulderFixed = new THREE.Group();
  box(shoulderMoving,rubber,[2.8,.075,.48],[.53,1.611,-6.5],.06);
  for (const x of [-.42,.60,1.25]) mechanismBox(shoulderMoving,seam,[.045,.060,.11],[x,1.552,-6.47],.008);
  mechanismBox(shoulderFixed,seam,[3.3,.28,.39],[.42,1.09,-6.64],.10);
  mechanismBox(shoulderFixed,darkGreen,[1.99,.025,.20],[.395,1.265,-6.47],.009);
  for (const x of [-.605,1.395]) mechanismBox(shoulderFixed,seam,[.025,.18,.20],[x,1.355,-6.47],.005);
  for (const z of [-6.56,-6.38]) mechanismBox(shoulderFixed,seam,[2.025,.18,.025],[.395,1.355,z],.005);
  mechanismBox(shoulderFixed,gold,[.57,.018,.105],[.40,1.294,-6.47],.005);
  mechanismBox(shoulderFixed,silver,[.92,.027,.075],[.61,1.420,-6.47],.009);
  mechanismBox(shoulderFixed,seam,[.11,.115,.10],[1.04,1.350,-6.47],.009);
  const springPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const angle = i / 48 * Math.PI * 8;
    springPoints.push(new THREE.Vector3(-.23+Math.cos(angle)*.043,1.285+i/48*.135,-6.47+Math.sin(angle)*.043));
  }
  line(shoulderFixed,silver,springPoints,.006);
  mechanismBox(shoulderFixed,silver,[.25,.018,.08],[-.20,1.427,-6.47],.005);
  const shoulderPivotPosition = new THREE.Vector3(.53,1.59,-6.79);
  for (const x of [-.56,1.36]) {
    const pin = solid(new THREE.CylinderGeometry(.027,.027,.36,16),silver,shoulderFixed,x,1.59,-6.79);
    pin.rotation.z = Math.PI / 2;
    for (const offset of [-.165,.165]) mechanismBox(shoulderFixed,side,[.030,.24,.09],[x+offset,1.48,-6.79],.008);
    for (const offset of [-.065,.065]) {
      const knuckle = solid(new THREE.TorusGeometry(.048,.009,6,24),seam,shoulderMoving,x+offset,1.59,-6.79);
      knuckle.rotation.y = Math.PI / 2;
      mechanismBox(shoulderMoving,seam,[.045,.025,.060],[x+offset,1.611,-6.720],.007);
    }
  }
  const shoulderMovingBatch = batchMechanism(shoulderMoving,'shoulder-cover');
  const shoulderFixedBatch = batchMechanism(shoulderFixed,'shoulder-well');
  const shoulderPivot = new THREE.Group(); shoulderPivot.position.copy(shoulderPivotPosition);
  shoulderMovingBatch.group.position.copy(shoulderPivotPosition).multiplyScalar(-1); shoulderPivot.add(shoulderMovingBatch.group);
  shoulderRoot.add(shoulderPivot,shoulderFixedBatch.group); group.updateMatrixWorld(true);
  const shoulderAngle = -65 * Math.PI / 180;
  mechanisms.push({
    id:'shoulder', label:'Shoulder service cover', root:shoulderRoot,
    pickMeshes:shoulderMovingBatch.meshes, movingMeshes:shoulderMovingBatch.meshes, fixedMeshes:shoulderFixedBatch.meshes,
    maximumPointTravel:hingeTravelBound(shoulderMovingBatch.meshes,shoulderPivotPosition,'x',shoulderAngle),
    setProgress(progress) { shoulderPivot.rotation.x = shoulderAngle * boundedProgress(progress); shoulderRoot.updateMatrixWorld(true); },
  });

  const boardShape = new THREE.Shape();
  boardShape.moveTo(-2.02,2.61);boardShape.lineTo(2.08,2.61);boardShape.lineTo(2.08,5.26);boardShape.quadraticCurveTo(2.08,6.17,1.07,6.17);boardShape.lineTo(-1.69,6.17);boardShape.lineTo(-2.02,5.88);boardShape.closePath();
  extrude(group,laminate,boardShape,.075,.83,.014);
  extrude(group,pcb,boardShape,.021,.917,.005).userData.walkSurface = true;
  // Deterministic circuit lanes leave broad clear regions for phase-two residents.
  for (let i = 0; i < 8; i++) {
    const z = 3.02 + i * .36;
    const x = -.75 + (i % 3) * .17;
    line(group, i % 2 ? trace : darkGreen, [new THREE.Vector3(-1.8,.949,z),new THREE.Vector3(x,.949,z),new THREE.Vector3(x+.2,.949,z+.2),new THREE.Vector3(1.7,.949,z+.2)],.0065);
    const via=new THREE.LatheGeometry([new THREE.Vector2(.022,0),new THREE.Vector2(.047,0),new THREE.Vector2(.047,.009),new THREE.Vector2(.022,.009),new THREE.Vector2(.022,0)],24);
    solid(via,gold,group,-1.82,.943,z);
    const land=new THREE.LatheGeometry([new THREE.Vector2(.025,0),new THREE.Vector2(.055,0),new THREE.Vector2(.055,.008),new THREE.Vector2(.025,.008),new THREE.Vector2(.025,0)],24);
    solid(land,gold,group,1.77,.943,z+.2);
  }
  // A wetted solder toe rises from a thin board-contact pad into each lead, within its old footprint.
  function solderToe(x:number,z:number,width:number,height:number,depth:number,sign=1) {
    const shape=new THREE.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);
    shape.lineTo(width/2,height);shape.lineTo(width*.10,height);
    shape.quadraticCurveTo(-width*.12,height*.17,-width/2,.009);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:3});
    geometry.translate(0,0,-depth/2);if(sign<0)geometry.rotateY(Math.PI);
    return solid(geometry,silver,group,x,.943,z);
  }
  function chip(x:number,z:number,w:number,d:number) {
    box(group,darkGreen,[w+.18,.026,d+.18],[x,.958,z],.016);
    const height=w>.8?.16:w>.6?.135:.12;
    box(group,packageResin,[w,height,d],[x,.971+height/2,z],.025);
    for (let i=0;i<6;i++) for(const sign of [-1,1]) solderToe(x+sign*(w/2+.035),z-d*.39+i*d*.156,.115,.070,.044,-sign);
    cylinder(group,ink,.025,.006,x-w*.35,.974+height,z-d*.34);
  }
  chip(.81,3.45,1.16,.83); chip(.95,5.30,.68,.58); chip(-1.15,5.4,.49,.54);
  for (const [x,z] of [[-1.15,3.31],[-.44,4.6]]) {
    box(group,laminate,[.67,.035,.62],[x,.982,z],.03);
    box(group,charcoal,[.53,.075,.49],[x,1.034,z],.04);
    cylinder(group,gold,.198,.032,x,1.09,z);
    ring(group,laminate,.197,.012,x,1.111,z);
  }
  for (let i=0;i<20;i++) {
    const x = i < 10 ? 1.63 : -1.72;
    const z = 3.1+(i%10)*.245;
    const width=.128+(i%3)*.016,height=.048+(i%4)*.010,depth=.072+(i%3)*.012;
    mechanismBox(group,i%3===0?silver:laminate,[width,height,depth],[x,.948+height/2,z],.006);
    solderToe(x-width*.38,z,.040,height+.008,depth+.005,1);
    solderToe(x+width*.38,z,.040,height+.008,depth+.005,-1);
  }
  for (const [x,z] of [[-1.61,5.94],[1.71,5.74],[1.82,2.85]]) { ring(group,gold,.12,.035,x,.969,z); cylinder(group,seam,.082,.035,x,.95,z); }

  return group;
}

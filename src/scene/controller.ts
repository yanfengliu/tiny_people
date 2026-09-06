import { addFaceButtonMark } from './button-markings';
import * as THREE from 'three';
import { box, cylinder, extrude, line, ring } from './geometry';
import { grainedPlastic } from './materials';

function plastic(color: string, roughness = .65, metalness = 0) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }

export const controllerDimensions = { top: 1.55, board: .97, width: 5.6, length: 13.8, openingStart: 2.65 };

export function createController() {
  const group = new THREE.Group();
  group.name = 'joy-con';
  const charcoal = grainedPlastic('#3a3b3d', .76,.006);
  const side = grainedPlastic('#303235',.8,.003);
  const seam = plastic('#131519');
  const rubber = grainedPlastic('#2b2d30', .92,.002);
  // A restrained local bounce term keeps recessed rubber readable without lifting the whole scene.
  rubber.emissive.set('#45494d');
  rubber.emissiveIntensity = .14;
  const coral = plastic('#fa6450', .52);
  const coralDark = plastic('#c44c3d', .67);
  const silver = plastic('#a4a7a3', .4, .6);
  const ink = plastic('#969b99', .76);
  const gold = plastic('#b3983c', .48, .45);
  const pcb = plastic('#28664b', .71);
  const trace = plastic('#3d8060', .64, .12);
  const laminate = plastic('#a2a66d', .76);
  const darkGreen = plastic('#1a4d38', .83);

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

  // Straight coral inner rail and its inset hardware.
  box(group, coralDark, [.42,.76,10.65], [-2.72,.96,-1.07], .19);
  box(group, coral, [.48,.84,10.6], [-2.88,1.0,-1.08], .22);
  const railControls = new THREE.Group(); railControls.position.set(-3.135,1.06,-1.08); railControls.rotation.z = Math.PI / 2; group.add(railControls);
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

  // Right Joy-Con: X north, A east, B south, Y west, joystick below.
  for (const [x, z, mark] of [[.45,-5.05,'X'],[1.51,-4,'A'],[.45,-2.95,'B'],[-.61,-4,'Y']] as const) {
    cylinder(group, seam, .64,.06,x,1.56,z);
    cylinder(group, rubber, .595,.21,x,1.68,z,.625);
    cylinder(group, charcoal, .56,.075,x,1.815,z,.59);
    addFaceButtonMark(group,mark,x,z);
  }
  box(group,seam,[.66,.055,.66],[-1.52,1.56,-5.5],.15);
  box(group,rubber,[.66,.15,.22],[-1.52,1.65,-5.5],.035);
  box(group,rubber,[.22,.15,.66],[-1.52,1.65,-5.5],.035);

  const stickX = -.25, stickZ = .18;
  cylinder(group,seam,1.29,.075,stickX,1.56,stickZ);
  cylinder(group,coral,1.26,.18,stickX,1.67,stickZ,1.21);
  cylinder(group,coralDark,.72,.22,stickX,1.80,stickZ,.83);
  cylinder(group,seam,.52,.32,stickX,1.95,stickZ);
  cylinder(group,rubber,1.10,.25,stickX,2.15,stickZ,1.02);
  ring(group,rubber,.99,.145,stickX,2.29,stickZ);
  cylinder(group,rubber,.90,.055,stickX,2.255,stickZ);
  ring(group,charcoal,.80,.014,stickX,2.29,stickZ);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const notch = box(group,charcoal,[.025,.014,.17],[stickX+Math.sin(a)*1.045,2.411,stickZ+Math.cos(a)*1.045],.005);
    notch.rotation.y = a;
  }
  cylinder(group,seam,.30,.035,1.65,1.565,1.75);
  cylinder(group,rubber,.255,.09,1.65,1.62,1.75);
  line(group, ink, [[1.51,1.675,1.75],[1.65,1.675,1.61],[1.79,1.675,1.75]].map(p=>new THREE.Vector3(...p)),.016);
  line(group, ink, [[1.55,1.675,1.71],[1.55,1.675,1.88],[1.75,1.675,1.88],[1.75,1.675,1.71]].map(p=>new THREE.Vector3(...p)),.014);

  // Shoulder button is integrated into the outer upper end.
  box(group,seam,[3.3,.45,.5],[.42,1.05,-6.58],.18);
  box(group,rubber,[2.8,.27,.48],[.53,1.43,-6.5],.14);

  const boardShape = new THREE.Shape();
  boardShape.moveTo(-2.02,2.61);boardShape.lineTo(2.08,2.61);boardShape.lineTo(2.08,5.26);boardShape.quadraticCurveTo(2.08,6.17,1.07,6.17);boardShape.lineTo(-1.69,6.17);boardShape.lineTo(-2.02,5.88);boardShape.closePath();
  extrude(group,laminate,boardShape,.075,.83,.014);
  extrude(group,pcb,boardShape,.021,.917,.005).userData.walkSurface = true;
  // Deterministic circuit lanes leave broad clear regions for phase-two residents.
  for (let i = 0; i < 8; i++) {
    const z = 3.02 + i * .36;
    const x = -.75 + (i % 3) * .17;
    line(group, i % 2 ? trace : darkGreen, [new THREE.Vector3(-1.8,.954,z),new THREE.Vector3(x,.954,z),new THREE.Vector3(x+.2,.954,z+.2),new THREE.Vector3(1.7,.954,z+.2)],.012);
    cylinder(group,gold,.047,.016,-1.82,.957,z);
    ring(group,laminate,.055,.013,1.77,.96,z+.2);
  }
  function chip(x:number,z:number,w:number,d:number) {
    box(group,darkGreen,[w+.18,.026,d+.18],[x,.958,z],.016);
    box(group,seam,[w,.16,d],[x,1.065,z],.035);
    for (let i=0;i<6;i++) for(const sign of [-1,1]) box(group,silver,[.115,.045,.044],[x+sign*(w/2+.035),.996,z-d*.39+i*d*.156],.005);
    cylinder(group,ink,.025,.006,x-w*.35,1.15,z-d*.34);
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
    box(group,i%3===0?silver:laminate,[.16,.08,.10],[x,1.003,z],.006);
    box(group,silver,[.04,.087,.105],[x-.062,1.008,z],.004);
    box(group,silver,[.04,.087,.105],[x+.062,1.008,z],.004);
  }
  for (const [x,z] of [[-1.61,5.94],[1.71,5.74],[1.82,2.85]]) { ring(group,gold,.12,.035,x,.969,z); cylinder(group,seam,.082,.035,x,.95,z); }

  return group;
}

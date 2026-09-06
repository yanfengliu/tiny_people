import * as THREE from 'three';
import { solid } from './geometry';

export type FaceButtonMark = 'X' | 'Y' | 'A' | 'B';
const print = new THREE.MeshStandardMaterial({ color:'#b8bcbb', roughness:.78, metalness:0 });

function stroke(ax: number, ay: number, bx: number, by: number, width = .032) {
  const length = Math.hypot(bx-ax,by-ay), ox = -(by-ay)/length*width/2, oy = (bx-ax)/length*width/2;
  const shape = new THREE.Shape();
  shape.moveTo(ax+ox,ay+oy); shape.lineTo(bx+ox,by+oy);
  shape.lineTo(bx-ox,by-oy); shape.lineTo(ax-ox,ay-oy); shape.closePath();
  return shape;
}

/** Thin source-drawn ink on the existing flat button top, without fonts or external assets. */
export function addFaceButtonMark(parent: THREE.Group, mark: FaceButtonMark, x: number, z: number, top = 1.8525) {
  let shapes: THREE.Shape[];
  if (mark === 'X') shapes = [stroke(-.10,.13,.10,-.13),stroke(.10,.13,-.10,-.13)];
  else if (mark === 'Y') shapes = [stroke(-.105,.13,0,.012),stroke(.105,.13,0,.012),stroke(0,.012,0,-.13)];
  else if (mark === 'A') shapes = [stroke(-.11,-.13,0,.13),stroke(0,.13,.11,-.13),stroke(-.073,-.035,.073,-.035)];
  else {
    const outline = new THREE.Shape();
    outline.moveTo(-.095,-.13); outline.lineTo(-.095,.13); outline.lineTo(.017,.13);
    outline.quadraticCurveTo(.11,.13,.11,.063); outline.quadraticCurveTo(.11,.020,.065,.007);
    outline.quadraticCurveTo(.116,-.004,.116,-.057); outline.quadraticCurveTo(.116,-.13,.016,-.13); outline.closePath();
    const upper = new THREE.Path();
    upper.moveTo(-.059,.098); upper.lineTo(.013,.098); upper.quadraticCurveTo(.074,.098,.074,.062);
    upper.quadraticCurveTo(.074,.027,.013,.027); upper.lineTo(-.059,.027); upper.closePath();
    const lower = new THREE.Path();
    lower.moveTo(-.059,-.007); lower.lineTo(.016,-.007); lower.quadraticCurveTo(.079,-.007,.079,-.055);
    lower.quadraticCurveTo(.079,-.098,.016,-.098); lower.lineTo(-.059,-.098); lower.closePath();
    outline.holes.push(upper,lower); shapes = [outline];
  }
  const geometry = new THREE.ExtrudeGeometry(shapes,{depth:.003,bevelEnabled:false,curveSegments:12});
  geometry.rotateX(-Math.PI/2);
  const mesh = solid(geometry,print,parent,x,top,z);
  mesh.name = `face-button-marking-${mark}`;
  mesh.castShadow = false;
  return mesh;
}

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cylinder, line, solid } from './geometry';
import { createResidents } from './residents';
import { createPlant } from './plants';
import type { ResidentPose } from './residents';
import { intersectsMeshVolume } from './physical-audit';

const FACE = 1.55, BOARD = .943;
const clearance = .085;
type Point = [number, number];
type Route = { name: string; curve: THREE.Curve<THREE.Vector3>; length: number; speed: number; shuttle: boolean };
const palette = {
  cream: new THREE.MeshStandardMaterial({ color: '#fff4d7', roughness: .8 }),
  coral: new THREE.MeshStandardMaterial({ color: '#e84e3c', roughness: .7 }),
  mint: new THREE.MeshStandardMaterial({ color: '#54baa0', roughness: .7 }),
  turquoise: new THREE.MeshStandardMaterial({ color: '#00a9bb', roughness: .6 }),
  wood: new THREE.MeshStandardMaterial({ color: '#b68b52', roughness: .9 }),
  dark: new THREE.MeshStandardMaterial({ color: '#34494c', roughness: .8 }),
  yellow: new THREE.MeshStandardMaterial({ color: '#f1bb43', roughness: .7 }),
  glass: new THREE.MeshStandardMaterial({ color: '#69c9d4', roughness: .25, metalness: .2 }),
};

// Static furnishings are merged by material; the original meshes remain the audit's physical evidence.
function batchFurnishings(source: THREE.Group) {
  source.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  source.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = object.material as THREE.Material;
    const geometry = (object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()).applyMatrix4(object.matrixWorld);
    const list = batches.get(material) ?? [];
    list.push(geometry); batches.set(material,list);
  });
  const group = new THREE.Group();
  for (const [material,geometries] of batches) {
    const merged = mergeGeometries(geometries,false);
    if (!merged) throw new Error('Could not combine community furnishings with compatible geometry.');
    solid(merged,material,group);
    geometries.forEach(geometry => geometry.dispose());
  }
  return group;
}

export function createCommunity(controller: THREE.Group) {
  const scenery = new THREE.Group();
  scenery.name = 'community-furnishings';
  const residents = createResidents(26);
  const group = new THREE.Group(); group.name = 'tiny-community';

  function pole(x:number,y:number,z:number,height:number,color = palette.cream) { return cylinder(scenery,color,.012,height,x,y+height/2,z); }
  const plants: THREE.Group[] = [];
  function plant(x:number,y:number,z:number,large=false) { plants.push(createPlant(scenery,x,y,z,large,plants.length)); }
  function bench(x:number,y:number,z:number,yaw:number,length=.5) {
    const b = new THREE.Group(); b.position.set(x,y,z); b.rotation.y=yaw; scenery.add(b);
    for(const dz of [-.045,.005,.055]) box(b,palette.wood,[length,.025,.039],[0,.1225,dz],.004);
    for(const px of [-length*.34,length*.34]) for(const dz of [-.045,.055]) box(b,palette.dark,[.018,.11,.018],[px,.055,dz],.002);
    box(b,palette.wood,[length,.075,.02],[0,.22,-.075],.005);
    for(const px of [-length*.4,length*.4]) box(b,palette.dark,[.015,.22,.015],[px,.13,-.08],.002);
  }
  function stool(x:number,y:number,z:number) { cylinder(scenery,palette.wood,.061,.028,x,y+.121,z); cylinder(scenery,palette.dark,.025,.105,x,y+.052,z); }
  function cup(x:number,y:number,z:number) { cylinder(scenery,palette.cream,.021,.032,x,y+.016,z); cylinder(scenery,palette.dark,.017,.003,x,y+.034,z); }
  function table(x:number,y:number,z:number,radius=.14) { cylinder(scenery,palette.cream,radius,.028,x,y+.20,z); cylinder(scenery,palette.dark,.022,.19,x,y+.095,z); cup(x-.05,y+.216,z); cup(x+.05,y+.216,z+.035); }

  // Button-side café: counter, striped canopy, espresso machine and an intimate table.
  box(scenery,palette.coral,[.80,.21,.18],[-1.85,FACE+.105,-2.59],.025);
  box(scenery,palette.cream,[.87,.03,.25],[-1.85,FACE+.225,-2.59],.016);
  for(const x of [-2.28,-1.42]) for(const z of [-3.02,-2.33]) pole(x,FACE,z,.61);
  for(let i=0;i<8;i++) {
    box(scenery,i%2?palette.cream:palette.coral,[.112,.027,.78],[-2.24+i*.112,FACE+.615,-2.675],.008);
    box(scenery,i%2?palette.cream:palette.coral,[.112,.07,.025],[-2.24+i*.112,FACE+.58,-2.285],.006);
  }
  box(scenery,palette.dark,[.15,.11,.13],[-2.08,FACE+.295,-2.60],.012);
  box(scenery,palette.glass,[.09,.047,.007],[-2.08,FACE+.31,-2.53],.005);
  cup(-1.88,FACE+.24,-2.56); cup(-1.66,FACE+.24,-2.56);
  cylinder(scenery,palette.wood,.058,.045,-1.52,FACE+.27,-2.61);
  table(-1.80,FACE,-3.40,.13); stool(-2.08,FACE,-3.4); stool(-1.51,FACE,-3.4);
  plant(-2.12,FACE,-2.13);

  // Joystick courtyard: a long bench, conversation table and planted corner.
  bench(2.24,FACE,.145,-Math.PI/2,.73);
  table(1.91,FACE,.15,.135); stool(1.58,FACE,.18);
  plant(2.15,FACE,1.10,true); plant(2.27,FACE,-.57);
  box(scenery,palette.yellow,[.07,.025,.055],[2.21,FACE+.15,.475],.004).name='courtyard-bench-book';

  // Two low homes use the nearby black packages as their surrounding architecture.
  function home(x:number,z:number,color:THREE.Material) {
    box(scenery,palette.cream,[.51,.38,.40],[x,BOARD+.19,z],.025);
    box(scenery,color,[.56,.055,.47],[x,BOARD+.395,z],.018);
    box(scenery,palette.dark,[.115,.26,.014],[x-.09,BOARD+.13,z+.207],.004);
    box(scenery,palette.glass,[.12,.13,.017],[x+.115,BOARD+.225,z+.211],.004);
    box(scenery,color,[.017,.14,.02],[x+.115,BOARD+.225,z+.225],.002);
    box(scenery,palette.cream,[.13,.014,.02],[x+.115,BOARD+.225,z+.225],.002);
    box(scenery,palette.wood,[.16,.012,.095],[x-.09,BOARD+.009,z+.265],.002);
    box(scenery,color,[.40,.024,.11],[x,BOARD+.32,z+.23],.004);
    cylinder(scenery,palette.yellow,.015,.015,x-.055,BOARD+.15,z+.218).rotation.x=Math.PI/2;
    const panel = box(scenery,palette.dark,[.25,.013,.24],[x,BOARD+.43,z-.02],.004);
    panel.rotation.x=-.14;
    for(let i=0;i<3;i++) box(scenery,palette.glass,[.062,.008,.21],[x-.076+i*.076,BOARD+.441,z-.02],.002);
  }
  home(-1.15,4.34,palette.turquoise); home(1.15,4.35,palette.coral);
  plant(-1.5,BOARD,5.02); plant(1.49,BOARD,4.74);
  bench(-.16,BOARD,5.30,0,.30);
  // Laundry, doorstep parcels, a mailbox and a book make the cavity a lived-in place.
  for(const x of [-1.38,-.67]) pole(x,BOARD,6.03,.37,palette.wood);
  line(scenery,palette.cream,[new THREE.Vector3(-1.38,BOARD+.37,6.03),new THREE.Vector3(-.67,BOARD+.37,6.03)],.007);
  for(let i=0;i<3;i++) box(scenery,[palette.coral,palette.cream,palette.turquoise][i],[.13,.18,.012],[-1.23+i*.2,BOARD+.27,6.03],.004);
  box(scenery,palette.wood,[.085,.07,.07],[1.41,BOARD+.035,4.60],.006);
  const book=box(scenery,palette.yellow,[.065,.013,.08],[-.045,BOARD+.145,5.30],.003);
  book.name='reading-bench-book';

  // A supported sloped walkway connects the decks; narrow rails preserve the visible opening.
  const rampX=-.32, startZ=2.72,endZ=3.92,drop=FACE-BOARD,angle=Math.atan2(drop,endZ-startZ), thickness=.045;
  const deckRise=.014;
  const ramp = box(scenery,palette.cream,[.47,thickness,Math.hypot(drop,endZ-startZ)],[rampX,(FACE+BOARD)/2+deckRise-thickness/(2*Math.cos(angle)),(startZ+endZ)/2],.002);
  ramp.rotation.x=angle; ramp.userData.walkSurface=true;
  for(const [z,y] of [[2.57,FACE],[4.035,BOARD]] as const) {
    const landing = box(scenery,palette.cream,[.47,.04,.30],[rampX,y+deckRise-.02,z],.003);
    landing.userData.walkSurface=true;
  }
  for(const sign of [-1,1]) {
    const x=rampX+sign*.24;
    for(let i=0;i<=4;i++) { const t=i/4; pole(x,FACE+deckRise-drop*t,startZ+(endZ-startZ)*t,.22,palette.coral); }
    line(scenery,palette.coral,[new THREE.Vector3(x,FACE+deckRise+.22,startZ),new THREE.Vector3(x,BOARD+deckRise+.22,endZ)],.012);
  }
  for(let i=1;i<8;i++) {
    const t=i/8;
    const stripe = box(scenery,palette.wood,[.40,.005,.017],[rampX,FACE+deckRise-drop*t+.006,startZ+(endZ-startZ)*t],.001); stripe.rotation.x=angle;
  }

  controller.updateMatrixWorld(true); scenery.updateMatrixWorld(true);
  const support: THREE.Object3D[]=[];
  const physical: THREE.Object3D[]=[];
  for(const root of [controller,scenery]) root.traverse(object=> { if(object instanceof THREE.Mesh) { physical.push(object); if(object.userData.walkSurface) support.push(object); } });
  const down = new THREE.Raycaster();
  function surfaceAt(x:number,z:number) {
    down.set(new THREE.Vector3(x,8,z),new THREE.Vector3(0,-1,0));
    return down.intersectObjects(support,false)[0]?.point.y;
  }
  function inspectPoint(x:number,y:number,z:number) {
    const failures:string[]=[];
    for(let i=0;i<9;i++) {
      const a=i*Math.PI/4, r=i===8?0:clearance;
      const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
      const floor = surfaceAt(px,pz);
      if(floor===undefined || Math.abs(floor-y)>.065) failures.push(`unsupported at ${px.toFixed(3)},${pz.toFixed(3)}`);
      down.set(new THREE.Vector3(px,8,pz),new THREE.Vector3(0,-1,0));
      const top=down.intersectObjects(physical,false)[0];
      if(top && top.point.y>y+.085) failures.push(`obstacle at ${px.toFixed(3)},${pz.toFixed(3)} above feet by ${(top.point.y-y).toFixed(3)}`);
    }
    return [...new Set(failures)];
  }
  function loop(name:string,points:Point[],speed=.12):Route {
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'catmullrom',.12);
    return {name,curve,length:curve.getLength(),speed,shuttle:false};
  }
  const routes:Route[]=[
    loop('shoulder stroll',[[-.80,-6.05],[1.78,-6.05],[1.78,-5.88],[-.80,-5.88]],.11),
    loop('rail promenade',[[-2.38,-4.78],[-2.17,-4.78],[-2.17,-3.82],[-2.38,-3.82]],.105),
    loop('cafe to courtyard',[[-1.10,-1.91],[1.79,-1.91],[1.79,-1.51],[-1.10,-1.51]],.15),
    loop('joystick garden',[[-2.3,-.88],[-1.90,-.88],[-1.90,1.93],[-2.3,1.93]],.115),
    loop('circuit lane',[[-.38,5.74],[.31,5.74],[.31,5.94],[-.38,5.94]],.09),
    loop('chip-side walk',[[-1.39,3.81],[-.68,3.81],[-.68,3.98],[-1.39,3.98]],.08),
    {name:'deck connection',curve:new THREE.LineCurve3(new THREE.Vector3(-.32,0,1.94),new THREE.Vector3(-.32,0,4.04)),length:2.1,speed:.12,shuttle:true},
  ];
  const walkers=[{route:0,phase:0},{route:1,phase:.35},{route:2,phase:.12},{route:2,phase:.62},{route:3,phase:.1},{route:4,phase:.1},{route:4,phase:.6},{route:5,phase:.3},{route:6,phase:.4}];
  const stationary: Array<[number,number,number,boolean,ResidentPose['activity']]>=[
    [-1.85,-2.85,0,false,'serve'],[-1.86,-2.16,Math.PI,false,'talk'],[-1.28,-2.20,-2.3,false,'talk'],
    [-2.08,-3.40,Math.PI/2,true,'talk'],[-1.51,-3.40,-Math.PI/2,true,'talk'],
    [2.24,-.08,-Math.PI/2,true,'talk'],[2.24,.37,-Math.PI/2,true,'relax'],[1.58,.18,Math.PI/2,true,'talk'],
    [1.83,1.1,Math.PI/2,false,'water'],[1.52,-.62,.8,false,'relax'],
    [-1.15,4.76,Math.PI,false,'relax'],[-1.48,4.79,0,false,'water'],[1.14,4.79,Math.PI,false,'talk'],
    [.76,4.56,Math.PI/2,false,'talk'],[-.16,5.30,0,true,'relax'],[-.99,5.87,0,false,'serve'],[1.90,-2.56,-.8,false,'relax'],
  ];
  // Watering lands on the authored soil meshes, including each pot's actual scale.
  const waterTargets = new Map<number, [number,number,number]>();
  for (const [residentId,plantIndex] of [[17,1],[20,3]]) {
    const soil = plants[plantIndex].getObjectByName('recessed-soil');
    if (!soil) throw new Error('A watering resident requires its plant soil surface.');
    const bounds = new THREE.Box3().setFromObject(soil), center = bounds.getCenter(new THREE.Vector3());
    waterTargets.set(residentId,[center.x,bounds.max.y,center.z]);
  }
  function sampleRoute(route:Route,time:number,phase:number) {
    let u:number, yaw:number,walking=true;
    if(route.shuttle) {
      const travel=route.length/route.speed, rest=2.4, cycle=2*(travel+rest),t=(time+phase*cycle)%cycle;
      if(t<travel) {u=t/travel;yaw=0;}
      else if(t<travel+rest) {u=1;walking=false;yaw=Math.PI*(t-travel)/rest;}
      else if(t<2*travel+rest) {u=1-(t-travel-rest)/travel;yaw=Math.PI;}
      else {u=0;walking=false;yaw=Math.PI+Math.PI*(t-2*travel-rest)/rest;}
    } else {u=(time*route.speed/route.length+phase)%1;const tangent=route.curve.getTangentAt(u);yaw=Math.atan2(tangent.x,tangent.z);}
    const p=route.curve.getPointAt(u);
    const y=surfaceAt(p.x,p.z)??-10;
    const slopeX=((surfaceAt(p.x+.01,p.z)??y)-(surfaceAt(p.x-.01,p.z)??y))/.02;
    const slopeZ=((surfaceAt(p.x,p.z+.01)??y)-(surfaceAt(p.x,p.z-.01)??y))/.02;
    return {x:p.x,y,z:p.z,yaw,walking,groundSlopeX:slopeX,groundSlopeZ:slopeZ};
  }
  let poses:ResidentPose[]=[];
  function update(time:number) {
    poses=walkers.map(({route,phase},id)=>({...sampleRoute(routes[route],time,phase),id,walkPhase:time*5.6+id,seated:false,activity:'walk',time}));
    stationary.forEach(([x,z,yaw,seated,activity],index)=> {
      const id=index+walkers.length;
      poses.push({id,x,y:surfaceAt(x,z)??-10,z,yaw,walking:false,walkPhase:0,seated,activity,time,waterTarget:waterTargets.get(id)});
    });
    residents.update(poses);
  }
  function auditRoutes() {
    let sampleCount=0; const failures:string[]=[];
    for(const route of routes) {
      const count=Math.ceil(route.length/.025);
      for(let i=0;i<=count;i++) {
        const p=route.curve.getPointAt(i/count),y=surfaceAt(p.x,p.z)??-10;
        const problems=inspectPoint(p.x,y,p.z); sampleCount++;
        if(problems.length) failures.push(`${route.name} ${i}/${count}: ${problems.join('; ')}`);
      }
    }
    return {routes:routes.length,residents:26,walkers:walkers.length,samples:sampleCount,clearance,failures};
  }
  // Expose the existing authored paths and real physical meshes to the mechanical sweep audit.
  function routeFootprints() {
    return routes.flatMap(route => {
      const count = Math.ceil(route.length / .025);
      return Array.from({ length: count + 1 }, (_, index) => {
        const p = route.curve.getPointAt(index / count);
        return { route: route.name, index, x: p.x, y: surfaceAt(p.x, p.z) ?? -10, z: p.z, radius: clearance, spacing: route.length / count };
      });
    });
  }
  function auditStationaryProps() {
    scenery.updateMatrixWorld(true); residents.group.updateMatrixWorld(true);
    const clothes=residents.group.getObjectByName('resident-clothes') as THREE.InstancedMesh;
    clothes.geometry.computeBoundingBox();
    const bounds=physical.map(object=>({object,box:new THREE.Box3().setFromObject(object)}));
    const failures:string[]=[];
    const matrix=new THREE.Matrix4();
    for(let id=walkers.length;id<26;id++) for(let part=0;part<2;part++) {
      clothes.getMatrixAt(id*2+part,matrix);
      const body=clothes.geometry.boundingBox!.clone().applyMatrix4(matrix);
      for(const candidate of bounds) {
        const overlap=body.clone().intersect(candidate.box);
        if(overlap.isEmpty())continue;
        const size=overlap.getSize(new THREE.Vector3());
        // Up to 4mm boundary contact is allowed for sitting on a seat; volume penetration is not.
        if(Math.min(size.x,size.y,size.z)>.004 && intersectsMeshVolume(candidate.object as THREE.Mesh,body.clone().expandByScalar(-.002))) failures.push(`resident ${id} ${part===0?'pelvis':'torso'} intersects ${candidate.object.name||'static furnishing'} by ${Math.min(size.x,size.y,size.z).toFixed(4)}`);
      }
    }
    return {stationary:stationary.length,bodyParts:stationary.length*2,failures};
  }
  group.add(batchFurnishings(scenery),residents.group);
  update(0);
  return {group,scenery,update,auditRoutes,auditStationaryProps,inspectPoint,routeFootprints,physicalMeshes:()=>[...physical] as THREE.Mesh[],snapshot:()=>poses.map(p=>({...p})),places:3,residentCount:26};
}

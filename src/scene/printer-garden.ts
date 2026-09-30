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

/** Small closed rosettes use rounded shading instead of folded radial wedges. */
function blossomGeometry() {
  const positions: number[] = [0, .035 + Math.SQRT2, 0], colors: number[] = [1, 1, 1], normals = [0, 1, 0], indices: number[] = [];
  for (let edge = 0; edge < 3; edge++) {
    const angle = (edge + .5) / 3 * Math.PI * 2;
    positions.push(Math.sin(angle), .035, Math.cos(angle));
    colors.push(.98, .98, .98); normals.push(Math.sin(angle), .60, Math.cos(angle));
  }
  for (let edge = 0; edge < 3; edge++) indices.push(0, 1 + edge, 1 + (edge + 1) % 3);
  // Three gently shaded rim points and one closed underside retain the small dome.
  indices.push(1, 3, 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); geometry.setIndex(indices); return geometry;
}

/** A closed tapered stalk needs four faces; its apex touches the blossom underside. */
function twigGeometry() {
  const geometry = new THREE.BufferGeometry(), positions = [0, .5, 0];
  for (let corner = 0; corner < 3; corner++) {
    const angle = corner / 3 * Math.PI * 2;
    positions.push(Math.sin(angle), -.5, Math.cos(angle));
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2]);
  geometry.computeVertexNormals(); return geometry;
}

/** Broad lanceolate pinnae close around a thin curved ridge. */
function fernBladeGeometry() {
  const positions = [0, 0, 0, -.18, .085, .43, 0, -.045, 1, .18, .085, .43, 0, .115, .43];
  const indices: number[] = [];
  for (let side = 0; side < 4; side++) indices.push(4, side, (side + 1) % 4);
  // Two underside faces close the same outline without a hidden second ridge.
  indices.push(0, 2, 1, 0, 3, 2);
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute([.88,.88,.88, 1,1,1, .91,.91,.91, 1,1,1, 1,1,1], 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

/** Dense fixed planting follows the reference's ground massing without occupying walking supports. */
export function createPrinterGarden(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'printer-reference-garden';
  // Preserve these authored instances if the world batches the surrounding fixed architecture.
  group.userData.printerFeature = true;
  const wood: Piece[] = [], foliage: Piece[] = [], earth: Piece[] = [];
  const frontCrown: Piece[] = [], rightCrown: Piece[] = [], shrubs: Piece[] = [], pinkShrub: Piece[] = [];
  const frontLeaves: Piece[] = [], rightLeaves: Piece[] = [];
  const fernLeaves: Piece[] = [], fernStems: Piece[] = [], pedicels: Piece[] = [];
  const pedicelBindings: {stem:number;pedicel:number;flower:number;batch:string}[] = [];
  const identity = new THREE.Quaternion();

  function piece(batch: Piece[], at: THREE.Vector3, size: Point, color: string, rotation = identity) {
    return batch.push({ at: at.clone(), size: new THREE.Vector3(...size), color, rotation: rotation.clone() }) - 1;
  }
  function branch(a: THREE.Vector3, b: THREE.Vector3, radius: number, color = '#715745', branches = wood) {
    const direction = b.clone().sub(a);
    return piece(branches, a.clone().add(b).multiplyScalar(.5), [radius, direction.length(), radius], color, new THREE.Quaternion().setFromUnitVectors(up, direction.normalize()));
  }
  function leaf(at: THREE.Vector3, direction: THREE.Vector3, length: number, width: number, seed: number, leaves = foliage, roll = .65) {
    const orientation = new THREE.Quaternion().setFromUnitVectors(forward, direction.clone().normalize());
    orientation.multiply(new THREE.Quaternion().setFromAxisAngle(forward, (variation(seed + 9) - .5) * roll));
    piece(leaves, at, [width * length, length, length], greens[Math.floor(variation(seed) * greens.length)], orientation);
  }
  /** Interior flowering shoots share a branching scaffold through the whole crown. */
  function volumePanicles(batch: Piece[], at: Point, radii: Point, seed: number, fork: THREE.Vector3, leaves: Piece[]) {
    const [rx,ry,rz]=radii, sites: {at:THREE.Vector3;key:number}[]=[];
    // Unequal overlapping clumps have interior depth, a raised leader and a lower
    // side bulge. Independent volume samples avoid bands tied to a world lattice.
    const lobes=[
      {center:[-.20,-.12,.04],radius:[.88,.88,.88]},
      {center:[.05,.44,-.02],radius:[.69,.82,.70]},
      {center:[.62,-.02,.03],radius:[.40,.73,.74]},
    ];
    let attempt=0;
    while(sites.length<(seed===2?445:435)) {
      const key=seed+attempt++*97, pick=variation(key),lobe=lobes[pick<.60?0:pick<.86?1:2];
      const q=new THREE.Vector3(variation(key+1)*2-1,variation(key+2)*2-1,variation(key+3)*2-1);
      if(q.lengthSq()>1)continue;
      const site=new THREE.Vector3(at[0]+(lobe.center[0]+q.x*lobe.radius[0])*rx,at[1]+(lobe.center[1]+q.y*lobe.radius[1])*ry,at[2]+(lobe.center[2]+q.z*lobe.radius[2])*rz);
      // Allow the full floral shoot, including its small corollas, beside the gallery.
      if(seed===2&&site.x<3.90&&site.z<4.58&&site.y>3.16)continue;
      if(site.x<1.94&&seed===2||site.x>7.01&&seed===91||site.z<1.02&&seed===91||site.z>2.75&&seed===91)continue;
      sites.push({at:site,key});
    }
    // Fill the largest interior spaces between existing shoots. This population
    // test is three-dimensional; it has no camera or projected-crop input.
    if(seed===2) {
      const candidates:typeof sites=[];
      for(let sample=0;sample<1600;sample++) {
        const key=seed+70001+sample*97,q=new THREE.Vector3(variation(key+1)*2-1,variation(key+2)*2-1,variation(key+3)*2-1);
        if(q.lengthSq()>1)continue;
        const candidate=new THREE.Vector3(at[0]+q.x*rx*.85,at[1]+q.y*ry*.75,at[2]+q.z*rz*.85);
        if(candidate.x<3.90&&candidate.z<4.58&&candidate.y>3.16)continue;
        candidates.push({at:candidate,key});
      }
      for(let added=0;added<30;added++) {
        let best=-1,greatestDistance=-Infinity;
        for(let candidate=0;candidate<candidates.length;candidate++) {
          const distance=Math.min(...sites.map(site=>site.at.distanceToSquared(candidates[candidate].at)));
          if(distance>greatestDistance){best=candidate;greatestDistance=distance;}
        }
        sites.push(candidates.splice(best,1)[0]);
      }
    }
    const core=new THREE.Vector3(...at);
    branch(fork,core,.025);
    function grow(points:typeof sites, parent:THREE.Vector3, depth:number) {
      if(points.length>1) {
        const center=points.reduce((sum,site)=>sum.add(site.at),new THREE.Vector3()).divideScalar(points.length);
        const join=parent.clone().lerp(center,.65);
        branch(parent,join,Math.min(.033,.004+Math.sqrt(points.length)*.001));
        const bounds=new THREE.Box3().setFromPoints(points.map(site=>site.at)),size=bounds.getSize(new THREE.Vector3()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';
        points.sort((a,b)=>a.at[axis]-b.at[axis]);const split=Math.floor(points.length/2);
        grow(points.slice(0,split),join,depth+1);grow(points.slice(split),join,depth+1);return;
      }
      const site=points[0], root=site.at, axis=root.clone().sub(parent).normalize();
      const end=root.clone().addScaledVector(axis,.12),flowerStem=branch(parent,end,.0035);
      // A single inner leaf supports the visible clump. Its varied upright plane
      // fills small channels without recreating the previous horizontal comb.
      const leafDirection=new THREE.Vector3(Math.sin(site.key),.85+variation(site.key+7)*.40,Math.cos(site.key)).normalize();
      const leafRotation=new THREE.Quaternion().setFromUnitVectors(forward,leafDirection).multiply(new THREE.Quaternion().setFromAxisAngle(forward,(variation(site.key+9)-.5)*Math.PI));
      const facing=Math.abs(up.clone().applyQuaternion(leafRotation).dot(root.clone().sub(core).normalize()));
      const leafRoot=core.clone().lerp(root,facing>.70?.40:.65);
      const leafSupport=branch(core,leafRoot,.0025);
      if(site.key%3===0) {
        leaf(leafRoot,leafDirection,.22,1.35,site.key,leaves,.65);
      } else {
        // A supported inner inflorescence replaces the former broad exposed leaf.
        const floweringEnd=leafRoot.clone().addScaledVector(leafDirection,.16);
        const floweringStalk=branch(leafRoot,floweringEnd,.0015,'#795d46',pedicels);
        const flowerRadial=new THREE.Vector3().crossVectors(leafDirection,up).normalize(),flowerLateral=new THREE.Vector3().crossVectors(leafDirection,flowerRadial).normalize();
        for(let floret=0;floret<6;floret++) {
          const key=site.key+5101+floret*37,size=.025+variation(key)*.0015,angle=floret*gold+site.key;
          const direction=flowerRadial.clone().multiplyScalar(Math.sin(angle)).addScaledVector(flowerLateral,Math.cos(angle)).addScaledVector(leafDirection,.40).normalize();
          const underside=leafRoot.clone().lerp(floweringEnd,.10+floret*.16),center=underside.clone().addScaledVector(direction,-size*.035);
          const orientation=new THREE.Quaternion().setFromUnitVectors(up,direction).multiply(new THREE.Quaternion().setFromAxisAngle(up,angle));
          const flower=piece(batch,center,[size,size,size],blossoms[0][Math.floor(variation(key+4)*3)],orientation);
          pedicelBindings.push({stem:leafSupport,pedicel:floweringStalk,flower,batch:batch===frontCrown?'printer-garden-front-pink-crown':'printer-garden-right-pink-crown'});
        }
      }
      const radial=new THREE.Vector3().crossVectors(axis,Math.abs(axis.z)<.9?forward:up).normalize(),lateral=new THREE.Vector3().crossVectors(axis,radial).normalize();
      for(let raceme=0;raceme<3;raceme++) {
        const angle=raceme*gold+site.key, parentPoint=root.clone().lerp(end,.12+raceme*.29);
        const reach=.16+variation(site.key+raceme)*.06;
        const stalkEnd=parentPoint.clone().addScaledVector(radial,Math.sin(angle)*reach).addScaledVector(lateral,Math.cos(angle)*reach).addScaledVector(axis,.03+variation(site.key+raceme+1)*.09);
        const stalk=branch(parentPoint,stalkEnd,.0012,'#795d46',pedicels),stalkAxis=stalkEnd.clone().sub(parentPoint).normalize();
        for(let floret=0;floret<7;floret++) {
          const bloomKey=site.key+raceme*23+floret*17,size=.025+variation(bloomKey)*.0015,bearing=angle+floret*gold;
          const direction=radial.clone().multiplyScalar(Math.sin(bearing)).addScaledVector(lateral,Math.cos(bearing)).addScaledVector(stalkAxis,.35).normalize();
          const underside=parentPoint.clone().lerp(stalkEnd,.08+floret*.146),center=underside.clone().addScaledVector(direction,-size*.035);
          const orientation=new THREE.Quaternion().setFromUnitVectors(up,direction).multiply(new THREE.Quaternion().setFromAxisAngle(up,bearing));
          const flower=piece(batch,center,[size,size,size],blossoms[0][Math.floor(variation(bloomKey+4)*3)],orientation);
          pedicelBindings.push({stem:flowerStem,pedicel:stalk,flower,batch:batch===frontCrown?'printer-garden-front-pink-crown':'printer-garden-right-pink-crown'});
        }
      }
    }
    grow(sites,fork,0);
    // Small secondary inflorescences occupy actual flower-free interior spaces.
    // Distances are initialized once, then updated only for newly emitted blooms.
    const vacant:{at:THREE.Vector3;key:number;distance:number;horizontalDistance:number}[]=[];
    for(let sample=0;sample<1600;sample++) {
      const key=seed+91001+sample*113,q=new THREE.Vector3(variation(key+1)*2-1,variation(key+2)*2-1,variation(key+3)*2-1);
      if(q.lengthSq()>1)continue;
      const atPoint=new THREE.Vector3(at[0]+q.x*rx*.85,at[1]+q.y*ry*.75,at[2]+q.z*rz*.85);
      if(seed===2&&atPoint.x<3.90&&atPoint.z<4.58&&atPoint.y>3.16)continue;
      if(seed===91&&(atPoint.x>7.01||atPoint.z<1.02||atPoint.z>2.75))continue;
      let distance=Infinity,horizontalDistance=Infinity;for(const bloom of batch){distance=Math.min(distance,bloom.at.distanceToSquared(atPoint));horizontalDistance=Math.min(horizontalDistance,(bloom.at.x-atPoint.x)**2+(bloom.at.z-atPoint.z)**2);}
      vacant.push({at:atPoint,key,distance,horizontalDistance});
    }
    for(let clump=0;clump<53;clump++) {
      const metric=clump%3===0?'horizontalDistance':'distance';let best=0;for(let n=1;n<vacant.length;n++)if(vacant[n][metric]>vacant[best][metric])best=n;
      const selected=vacant.splice(best,1)[0],axis=selected.at.clone().sub(core).normalize();
      const parentStem=branch(core,selected.at,.0035),tip=selected.at.clone().addScaledVector(axis,.13);
      const stalk=branch(selected.at,tip,.0015,'#795d46',pedicels);
      const radial=new THREE.Vector3().crossVectors(axis,Math.abs(axis.z)<.9?forward:up).normalize(),lateral=new THREE.Vector3().crossVectors(axis,radial).normalize();
      for(let floret=0;floret<7;floret++) {
        const key=selected.key+floret*37,size=.025+variation(key)*.0015,angle=floret*gold+selected.key;
        const direction=radial.clone().multiplyScalar(Math.sin(angle)).addScaledVector(lateral,Math.cos(angle)).addScaledVector(axis,.40).normalize();
        const underside=selected.at.clone().lerp(tip,.08+floret*.146),center=underside.clone().addScaledVector(direction,-size*.035);
        const orientation=new THREE.Quaternion().setFromUnitVectors(up,direction).multiply(new THREE.Quaternion().setFromAxisAngle(up,angle));
        const flower=piece(batch,center,[size,size,size],blossoms[0][Math.floor(variation(key+4)*3)],orientation);
        pedicelBindings.push({stem:parentStem,pedicel:stalk,flower,batch:batch===frontCrown?'printer-garden-front-pink-crown':'printer-garden-right-pink-crown'});
        for(const candidate of vacant){candidate.distance=Math.min(candidate.distance,center.distanceToSquared(candidate.at));candidate.horizontalDistance=Math.min(candidate.horizontalDistance,(center.x-candidate.at.x)**2+(center.z-candidate.at.z)**2);}
      }
    }
  }
  function branchPanicles(batch: Piece[], at: Point, radii: Point, seed: number, fork: THREE.Vector3, leaves: Piece[], small=false) {
    const [rx,ry,rz]=radii;
    const primaryCount=small?5:9, secondaryCount=small?3:4;
    const limit=(p:THREE.Vector3)=>{const q=new THREE.Vector3((p.x-at[0])/rx,(p.y-at[1])/ry,(p.z-at[2])/rz); if(q.length()>1.08){q.setLength(1.08);p.set(at[0]+q.x*rx,at[1]+q.y*ry,at[2]+q.z*rz);}return p;};
    for(let primary=0;primary<primaryCount;primary++) {
      const angle=primary*gold+seed, lean=.35+variation(seed+primary)*.23;
      const end=new THREE.Vector3(at[0]+Math.sin(angle)*rx*lean,at[1]+[-.60,.40,.64,.18,.48,.05,.53,.83,.30][primary]*ry,at[2]+Math.cos(angle)*rz*lean);
      const elbow=fork.clone().lerp(end,.55).add(new THREE.Vector3(.06*Math.sin(angle),.09,.06*Math.cos(angle)));
      branch(fork,elbow,small?.014:.025);branch(elbow,end,small?.011:.019);
      for(let secondary=0;secondary<secondaryCount;secondary++) {
        const bearing=angle+(secondary-1.5)*.70+(variation(seed+primary*51+secondary*13)-.5)*.56, reach=(small?.17:.34)+variation(seed+primary*9+secondary)*.14;
        const origin=.24+secondary*.20;
        const birth=origin<=.55?fork.clone().lerp(elbow,origin/.55):elbow.clone().lerp(end,(origin-.55)/.45);
        const node=limit(birth.clone().add(new THREE.Vector3(Math.sin(bearing)*reach,((secondary%2)*2-1)*reach*.52,Math.cos(bearing)*reach)));
        branch(birth,node,small?.005:.008);
        for(let terminal=0;terminal<3;terminal++) {
          const inner=terminal!==0, twigRoot=inner?birth.clone().lerp(node,terminal===1?.36:.15):node;
          const heading=bearing+(inner?(terminal===1?-Math.PI*.40:Math.PI*.55):-.75),key=seed+primary*191+secondary*43+terminal*13;
          const span=(small?.22:.36)+variation(key)*.20;
          const sweep=terminal===1?.46:1, lift=terminal===1?.78:(variation(key+1)-.35);
          const tip=limit(twigRoot.clone().add(new THREE.Vector3(Math.sin(heading)*span*sweep,lift*span,Math.cos(heading)*span*sweep)));
          const bend=twigRoot.clone().lerp(tip,.5).add(new THREE.Vector3(Math.cos(heading)*span*.15,.025,-Math.sin(heading)*span*.15));
          const curve=new THREE.QuadraticBezierCurve3(twigRoot,bend,tip);
          if(seed===2&&[twigRoot,bend,tip].some(p=>p.x+.10>=1.25&&p.x-.10<=3.61&&p.z+.10>=3.4&&p.z-.10<=4.28&&p.y+.10>=3.45))continue;
          const middle=curve.getPoint(.5),stemA=branch(twigRoot,middle,.0035),stemB=branch(middle,tip,.0025);
          leaf(curve.getPoint(.28),new THREE.Vector3(Math.sin(heading+1),.2,Math.cos(heading+1)),small?.11:.19,1.3,key,leaves);
          leaf(curve.getPoint(.65),new THREE.Vector3(Math.sin(heading-1),.1,Math.cos(heading-1)),small?.09:.17,1.2,key+1,leaves);
          const bunches=5;
          for(let bunch=0;bunch<bunches;bunch++) {
            const t=.12+bunch/(bunches-1)*.84,parent=t<=.5?twigRoot.clone().lerp(middle,t*2):middle.clone().lerp(tip,(t-.5)*2),normal=new THREE.Vector3(Math.sin(heading+bunch*1.5),.25+variation(key+bunch)*.65,Math.cos(heading+bunch*1.5)).normalize();
            const across=new THREE.Vector3().crossVectors(normal,up).normalize(),along=new THREE.Vector3().crossVectors(across,normal).normalize();
            for(let raceme=0;raceme<3;raceme++) {
              const racemeKey=key+bunch*67+raceme*23, bearing=raceme*gold+variation(racemeKey)*.8;
              const end=parent.clone().addScaledVector(across,Math.sin(bearing)*(.045+variation(racemeKey+1)*.022)).addScaledVector(along,Math.cos(bearing)*.050).addScaledVector(normal,.085+variation(racemeKey+2)*.030);
              const stalk=branch(parent,end,.0012,'#795d46',pedicels);
              const axis=end.clone().sub(parent).normalize(), radial=across.clone().addScaledVector(axis,-across.dot(axis)).normalize(), lateral=new THREE.Vector3().crossVectors(axis,radial).normalize();
              for(let floret=0;floret<4;floret++) {
                const bloomKey=racemeKey+floret*17, size=.021+variation(bloomKey+2)*.002;
                const angle=floret*gold+bearing;
                const direction=radial.clone().multiplyScalar(Math.sin(angle)).addScaledVector(lateral,Math.cos(angle)).addScaledVector(axis,.35+variation(bloomKey+3)*.20).normalize();
                // Several directly attached florets share a real short flowering stem.
                const underside=parent.clone().lerp(end,.18+floret*.25), center=underside.clone().addScaledVector(direction,-size*.035);
                const orientation=new THREE.Quaternion().setFromUnitVectors(up,direction).multiply(new THREE.Quaternion().setFromAxisAngle(up,bearing+floret*.8));
                const flower=piece(batch,center,[size,size,size],blossoms[0][Math.floor(variation(bloomKey+4)*3)],orientation);
                pedicelBindings.push({stem:t<=.5?stemA:stemB,pedicel:stalk,flower,batch:batch===frontCrown?'printer-garden-front-pink-crown':batch===rightCrown?'printer-garden-right-pink-crown':'printer-garden-left-pink-shrub'});
              }
            }
          }
        }
      }
    }
  }
  function cloud(batch: Piece[], at: Point, radii: Point, palette: number, seed: number, substantial = false, fork?: THREE.Vector3, crownLeaves = foliage) {
    const [rx, ry, rz] = radii, nx = substantial ? 8 : 3, ny = substantial ? 5 : 2, nz = substantial ? 7 : 3;
    const lobe = Math.min(rx / nx, ry / ny, rz / nz) * .74;
    if(substantial&&fork){volumePanicles(batch,at,radii,seed,fork,crownLeaves);return;}
    const cloudFork = new THREE.Vector3(at[0], Math.min(.14, at[1] * .30), at[2]);
    if (!substantial) {
      const root = new THREE.Vector3(at[0], 0, at[2]), fork = cloudFork;
      branch(root, fork, .022);
      for (let twig = 0; twig < 9; twig++) {
        const angle = twig * gold + seed, end = new THREE.Vector3(at[0] + Math.sin(angle) * rx * .65, at[1] + Math.sin(twig * 1.7) * ry * .55, at[2] + Math.cos(angle) * rz * .65);
        branch(fork, end, .010);
        for (let blade = 0; blade < 3; blade++) leaf(fork.clone().lerp(end, .15 + blade * .24), new THREE.Vector3(Math.sin(angle + blade), .35, Math.cos(angle + blade)), .22 + variation(seed + blade) * .09, 1.65, seed + twig * 3 + blade);
      }
    }
    if(palette===0){branchPanicles(pinkShrub,at,radii,seed,new THREE.Vector3(at[0],.14,at[2]),foliage,true);return;}
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
        branch(cloudFork, node, .0025);
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
  cloud(shrubs, [-4.85, .48, 5.04], [.46, .34, .46], 3, 151);
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
  const leafMaterial = material('garden-foliage', .78, true);
  const barkMaterial = material('garden-bark', .92);
  const smallWood=wood.map((part,index)=>({part,index})).filter(({part})=>part.size.x<=.05),woodIndices=new Map(smallWood.map(({index},position)=>[index,position]));
  group.userData.pedicelBindings=pedicelBindings.map(binding=>({...binding,stem:woodIndices.get(binding.stem),pedicel:smallWood.length+binding.pedicel}));
  const triangles = batch('printer-garden-branches', twigGeometry(), barkMaterial, [...smallWood.map(({part})=>part),...pedicels])
    + batch('printer-garden-trunks', new THREE.CylinderGeometry(.72, 1, 1, 8), barkMaterial, wood.filter(part => part.size.x > .05))
    + batch('printer-garden-fern-stems', new THREE.CylinderGeometry(.72, 1, 1, 3, 1, true), leafMaterial, fernStems)
    + batch('printer-garden-fern-leaves', fernBladeGeometry(), leafMaterial, fernLeaves)
    + batch('printer-garden-closed-leaves', fernBladeGeometry(), leafMaterial, foliage)
    + batch('printer-garden-front-crown-leaves', fernBladeGeometry(), leafMaterial, frontLeaves)
    + batch('printer-garden-right-crown-leaves', fernBladeGeometry(), leafMaterial, rightLeaves)
    + batch('printer-garden-root-beds', new THREE.CylinderGeometry(1, .9, 1, 8), material('garden-earth', 1), earth)
    + batch('printer-garden-front-pink-crown', cloudGeometry, cloudMaterial, frontCrown)
    + batch('printer-garden-right-pink-crown', cloudGeometry, cloudMaterial, rightCrown)
    + batch('printer-garden-left-pink-shrub', cloudGeometry, cloudMaterial, pinkShrub)
    + batch('printer-garden-layered-shrubs', fernBladeGeometry(), cloudMaterial, shrubs);
  group.userData.garden = { trees: 2, ferns: undergrowth.length, flowers: frontCrown.length + rightCrown.length + pinkShrub.length, closedLeaves: foliage.length + frontLeaves.length + rightLeaves.length + fernLeaves.length + shrubs.length, crownBlossoms: frontCrown.length + rightCrown.length, shrubLeaves: shrubs.length, draws: 12, triangles };
  if (triangles > 150000) throw new Error(`Printer garden emits ${triangles} triangles; simplify its source clusters to remain within 150000.`);
  return group;
}

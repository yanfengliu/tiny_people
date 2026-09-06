import * as THREE from 'three';

// Deterministic source-built grain; no image file, download or saved bitmap.
function grainTexture() {
  const size=256,data=new Uint8Array(size*size*4);let seed=43119;
  for(let i=0;i<size*size;i++) {seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=218+Math.floor((seed/4294967296)*37);data.set([value,value,value,255],i*4);}
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(.55,.55);
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

export function grainedPlastic(color:string,roughness=.76,bumpScale=.007,reflectionIntensity=0) {
  const texture=grainTexture();return new THREE.MeshStandardMaterial({color,roughness,map:texture,bumpMap:texture,bumpScale,
    envMap:reflectionIntensity?studioReflection():null,envMapIntensity:reflectionIntensity});
}

// Shared source-built surface fields keep each material family coherent without bitmap assets.
const surfaces = new Map<string, THREE.DataTexture>();
function surfaceTexture(kind: 'wood' | 'weave' | 'paper' | 'brushed') {
  const existing = surfaces.get(kind); if (existing) return existing;
  const size=128, data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const u=x/size,v=y/size;
    const noise=(Math.sin(x*127.1+y*311.7)*43758.5453)%1;
    const grain=kind==='wood'
      ? .58+.20*Math.sin(v*112+Math.sin(u*9)*1.8)+.09*Math.sin(v*251+Math.sin(u*17)*2.2)
      : kind==='weave' ? .72+.10*Math.sin(u*Math.PI*64)*Math.sin(v*Math.PI*64)
      : kind==='brushed' ? .78+.09*Math.sin(v*427)+.035*Math.sin(v*211+u*2)
      : .84+.025*Math.sin(v*378);
    const value=Math.max(0,Math.min(255,Math.round(218+grain*34+noise*3)));
    data.set([value,value,value,255],(y*size+x)*4);
  }
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  surfaces.set(kind,texture);return texture;
}

export function wovenFabric(color:string) {
  const texture=surfaceTexture('weave');return new THREE.MeshStandardMaterial({color,roughness:.92,map:texture,bumpMap:texture,bumpScale:.00055});
}
export function directionalWood(color:string) {
  const texture=surfaceTexture('wood');return new THREE.MeshStandardMaterial({color,roughness:.64,map:texture,bumpMap:texture,bumpScale:.0008});
}
export function mattePaper(color:string) {
  const texture=surfaceTexture('paper');return new THREE.MeshStandardMaterial({color,roughness:.96,map:texture});
}

let reflection: THREE.DataTexture | undefined;
function studioReflection() {
  if(reflection)return reflection;
  // Authored analytic roughness filtering in Three's public CubeUV layout. Direct source generation
  // avoids a GGX GPU-convolution precision warning on Windows; no compiler output is hidden.
  // Base faces are64px, with16px roughness tiles through mip-2 and one-pixel face gutters.
  const width=336,height=256,data=new Uint16Array(width*height*4);
  const roughnesses=[0,.152,.21,.305,.4,.533333,.666667,.8,1];
  const direction=new THREE.Vector3();
  for(let mip=6;mip>=-2;mip--) {
    const size=2**Math.max(mip,4),roughness=roughnesses[6-mip],spread=roughness*roughness*.42;
    for(let face=0;face<6;face++)for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const u=((x+.5-1)/(size-2))*2-1,v=((y+.5-1)/(size-2))*2-1;
      if(face===0)direction.set(1,v,u);else if(face===1)direction.set(-u,1,-v);
      else if(face===2)direction.set(-u,v,1);else if(face===3)direction.set(-1,v,-u);
      else if(face===4)direction.set(-u,-1,v);else direction.set(u,v,-1);
      direction.normalize();
      const longitude=Math.atan2(direction.z,direction.x)/(2*Math.PI)+.5;
      const latitude=Math.asin(direction.y)/Math.PI+.5;
      // Broader lobes lose peak intensity as roughness grows. This is a compact studio field,
      // not an exact GGX bake or a scene-wide lighting change.
      const panel=(cx:number,cy:number,sx:number,sy:number)=> {
        const dx=Math.min(Math.abs(longitude-cx),1-Math.abs(longitude-cx));
        return sx*sy/((sx+spread)*(sy+spread))*Math.exp(-Math.pow(dx/(sx+spread),4)-Math.pow((latitude-cy)/(sy+spread),4));
      };
      const value=.09+.20*Math.sin(latitude*Math.PI)+1.85*panel(.22,.30,.09,.18)+.75*panel(.73,.42,.14,.12);
      const px=(face%3)*size+Math.max(4-mip,0)*48+x,py=4*(64-size)+(face>2?size:0)+y;
      data.set([value*1.015,value,value*.975,1].map(THREE.DataUtils.toHalfFloat),(py*width+px)*4);
    }
  }
  reflection=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.HalfFloatType);
  reflection.mapping=THREE.CubeUVReflectionMapping;reflection.colorSpace=THREE.LinearSRGBColorSpace;
  reflection.minFilter=reflection.magFilter=THREE.LinearFilter;reflection.generateMipmaps=false;
  reflection.needsUpdate=true;return reflection;
}
export function brushedMetal(color:string,roughness=.3,metalness=.82) {
  const texture=surfaceTexture('brushed');
  return new THREE.MeshStandardMaterial({color,roughness,metalness,roughnessMap:texture,bumpMap:texture,bumpScale:.0003,envMap:studioReflection(),envMapIntensity:.85});
}
export function glazedCeramic(color:string) {
  return new THREE.MeshStandardMaterial({color,roughness:.3,envMap:studioReflection(),envMapIntensity:.16});
}

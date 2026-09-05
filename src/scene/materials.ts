import * as THREE from 'three';

// Deterministic source-built grain; no image file, download or saved bitmap.
function grainTexture() {
  const size=256,data=new Uint8Array(size*size*4);let seed=43119;
  for(let i=0;i<size*size;i++) {seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=218+Math.floor((seed/4294967296)*37);data.set([value,value,value,255],i*4);}
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(.55,.55);
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

export function grainedPlastic(color:string,roughness=.76,bumpScale=.007) {
  const texture=grainTexture();return new THREE.MeshStandardMaterial({color,roughness,map:texture,bumpMap:texture,bumpScale});
}

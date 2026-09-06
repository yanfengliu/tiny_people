import type * as THREE from 'three';

export type MechanismId = 'rail' | 'shoulder' | 'joystick';

export interface MechanismAssembly {
  id: MechanismId;
  label: string;
  root: THREE.Group;
  pickMeshes: THREE.Mesh[];
  movingMeshes: THREE.Mesh[];
  fixedMeshes: THREE.Mesh[];
  /** Conservative moving-vertex distance bound per unit progress, in controller world units. */
  maximumPointTravel: number;
  setProgress(progress: number): void;
}

/** Authoritative social data: scene sampling and pose rendering do not choose actions. */
export type SocialPoint = { x: number; y: number; z: number; groundSlopeX?: number; groundSlopeZ?: number };
export type SocialPath = { id: string; points: SocialPoint[]; length: number; speed: number; loop?: boolean; shuttle?: boolean };
export type SocialActivity = 'walk' | 'rest' | 'read' | 'greet' | 'cafe' | 'garden' | 'observe';
export type SocialTraits = { sociability: number; curiosity: number; helpfulness: number; patience: number; preferences: Record<SocialActivity, number> };
export type SocialClip = 'idle' | 'walk' | 'read' | 'speak' | 'listen' | 'greet' | 'read-lower' | 'read-return' | 'offer' | 'receive' | 'drink' | 'return' | 'water-prepare' | 'water' | 'water-drain' | 'water-lower' | 'acknowledge' | 'help' | 'react';
export type SocialResidentDefinition = { id: number; home: SocialPoint; yaw: number; seated: boolean; seat?: string; route?: string; routePhase?: number; baseActivity: SocialActivity; waterTarget?: [number, number, number]; personalProp?: 'book' | 'cup' | 'water' };
export type SocialOpportunity = { id: string; kind: 'greet' | 'cafe' | 'garden'; participants: [number, number]; place: string; approaches?: { resident: number; path: string }[]; prop?: string };
export type SocialLayout = { residents: SocialResidentDefinition[]; paths: SocialPath[]; opportunities: SocialOpportunity[]; openingTargets: Record<'rail' | 'shoulder' | 'joystick', [number, number, number]> };
export type SocialOpening = { sequence: number; lifeTime: number; mechanismTime: number; mechanism: 'rail' | 'shoulder' | 'joystick'; source: 'pointer' | 'keyboard' };
export type SocialCue = { clip: SocialClip; phase: number; weight: number; gazeTarget?: [number, number, number]; gazeWeight: number };
export type SocialActorFrame = SocialPoint & { id: number; yaw: number; seated: boolean; walking: boolean; walkPhase: number; activity: SocialActivity; cue: SocialCue; interaction: string | null; role: 'initiator' | 'partner' | null; waterTarget?: [number, number, number] };
/** One logical prop entry persists through contact and owner changes. */
export type SocialPropFrame = { id: string; kind: 'book' | 'cup' | 'water'; owner: number; participants: number[]; stage: string; phase: number; flow: number; dropPhases: number[] };
export type SocialInteractionFrame = { id: string; opportunity: string; kind: SocialOpportunity['kind']; participants: [number, number]; stage: string; phase: number; startedTick: number };
export type SocialFrame = { time: number; tick: number; actors: SocialActorFrame[]; props: SocialPropFrame[]; interactions: SocialInteractionFrame[] };
export type SocialHistory = { version: 1; time: number; openings: SocialOpening[] };

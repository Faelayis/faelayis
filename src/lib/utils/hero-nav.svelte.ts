export const HERO_NAV_RANGE = 560;
export const HERO_NAV_RANGE_COMPACT = 440;
export const COMPACT_BREAKPOINT = 720;

export function getHeroNavRange(): number {
	if (typeof window === "undefined") return HERO_NAV_RANGE;
	return window.innerWidth < COMPACT_BREAKPOINT ? HERO_NAV_RANGE_COMPACT : HERO_NAV_RANGE;
}

export function smoothstep(edgeA: number, edgeB: number, value: number): number {
	const clamped = Math.min(1, Math.max(0, (value - edgeA) / (edgeB - edgeA)));
	return clamped * clamped * (3 - 2 * clamped);
}

export function easeInOutCubic(progress: number): number {
	const clamped = Math.min(1, Math.max(0, progress));
	return clamped < 0.5 ? 4 * clamped * clamped * clamped : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

export const HANDOFF_AT = 0.78;
const HANDOFF_FADE = 0.04;

export function travelProgress(progress: number): number {
	return easeInOutCubic(progress / HANDOFF_AT);
}

export function swapProgress(progress: number): number {
	return smoothstep(HANDOFF_AT - HANDOFF_FADE, HANDOFF_AT, progress);
}

export function tailProgress(progress: number): number {
	return Math.min(1, Math.max(0, (progress - HANDOFF_AT) / (1 - HANDOFF_AT)));
}

export function tailLetterProgress(tail: number, index: number, count: number): number {
	const span = 0.4;
	const start = count > 1 ? (index / (count - 1)) * (1 - span) : 0;
	const local = Math.min(1, Math.max(0, (tail - start) / span));
	return 1 - Math.pow(1 - local, 3);
}

export const heroDock = $state({ distance: 0 });

export function heroNavProgress(scrollY: number) {
	const range = heroDock.distance > 0 ? heroDock.distance / HANDOFF_AT : getHeroNavRange();
	const progress = Math.min(1, Math.max(0, scrollY / range));
	return { progress, easedProgress: easeInOutCubic(progress) };
}

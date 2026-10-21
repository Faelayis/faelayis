import { browser } from "$app/environment";

export function prefersReducedMotion(): boolean {
	if (!browser) return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export async function copyToClipboard(value: string): Promise<boolean> {
	if (!browser || !navigator.clipboard?.writeText) return false;
	try {
		await navigator.clipboard.writeText(value);
		return true;
	} catch {
		return false;
	}
}

export function selectText(node: Node): void {
	const selection = window.getSelection();
	if (!selection) return;
	const range = document.createRange();
	range.selectNodeContents(node);
	selection.removeAllRanges();
	selection.addRange(range);
}

export function isTouchOnly(): boolean {
	if (!browser) return false;
	return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

export function isApplePlatform(): boolean {
	if (!browser) return false;
	return /Mac|iPhone|iPad/.test(navigator.userAgent);
}

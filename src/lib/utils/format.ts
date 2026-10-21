export function formatNumber(value: number): string {
	if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
	if (value >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
	return String(value);
}

export function formatDate(iso: string): string {
	const date = new Date(iso);
	return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export function timeAgo(iso: string): string {
	const now = Date.now();
	const then = new Date(iso).getTime();
	const diff = (now - then) / 1000;
	if (diff < 60) return "just now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
	if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))}mo ago`;
	return `${Math.floor(diff / (86400 * 365))}y ago`;
}

const DAY_MS = 86_400_000;

export function recencyLabel(iso: string, now: number | null): string {
	const date = new Date(iso);
	const monthYear = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
	if (now === null) return monthYear;
	const days = Math.floor((now - date.getTime()) / DAY_MS);
	if (days < 1) return "today";
	if (days === 1) return "yesterday";
	if (days < 14) return `${days} days ago`;
	if (days < 60) return `${Math.floor(days / 7)} wk ago`;
	if (days < 330) return `${Math.floor(days / 30)} mo ago`;
	return monthYear;
}

export function isInkHex(hex: string): boolean {
	const value = hex.replace("#", "");
	if (value.length !== 6) return false;
	const [r, g, b] = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18;
}

export function languageColor(language: string): string {
	const map: Record<string, string> = {
		TypeScript: "#3178c6",
		JavaScript: "#f1e05a",
		Python: "#3572A5",
		Svelte: "#ff3e00",
		Go: "#00ADD8",
		Rust: "#dea584",
		HTML: "#e34c26",
		CSS: "#563d7c",
		SCSS: "#c6538c",
		Vue: "#41b883",
		React: "#61dafb",
		Astro: "#ff5d01",
		C: "#555555",
		"C++": "#f34b7d",
		"C#": "#178600",
		Java: "#b07219",
		Kotlin: "#A97BFF",
		Swift: "#F05138",
		Ruby: "#701516",
		PHP: "#4F5D95",
		Shell: "#89e051",
		Lua: "#000080",
		Dart: "#00B4AB",
		Elixir: "#6e4a7e",
		Haskell: "#5e5086",
		Scala: "#c22d40",
		Zig: "#ec915c",
		Nim: "#ffc200",
		MDX: "#fcb32c",
		Markdown: "#083fa1",
	};
	return map[language] ?? "#888888";
}

const GITHUB_PAGES_API_BASES = [
	"https://faelayis.vercel.app",
	"https://me.faelayis.workers.dev",
] as const;

function clientApiBases(): readonly string[] {
	if (typeof window !== "undefined" && window.location.hostname === "faelayis.github.io") {
		return GITHUB_PAGES_API_BASES;
	}
	return [""];
}

function isAbortError(error: unknown): boolean {
	return error instanceof Error && error.name === "AbortError";
}

export async function fetchApiJson<T>(path: string, init?: RequestInit): Promise<T> {
	const bases = clientApiBases();
	const canFailOver = (init?.method ?? "GET").toUpperCase() === "GET";

	for (const [index, base] of bases.entries()) {
		let response: Response;
		try {
			response = await fetch(`${base}${path}`, {
				...init,
				headers: { Accept: "application/json", ...(init?.headers ?? {}) },
			});
		} catch (error) {
			if (isAbortError(error)) throw error;
			if (!canFailOver || index === bases.length - 1) throw error;
			continue;
		}

		const hasFallback = canFailOver && index < bases.length - 1;
		if (response.status >= 500 && hasFallback) continue;
		if (!response.ok) throw new Error(`API ${response.status}`);
		return (await response.json()) as T;
	}

	throw new Error("API request failed");
}

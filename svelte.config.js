import adapter from "@sveltejs/adapter-static";
import adapterVercel from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const buildTarget = process.env.BUILD_TARGET ?? "";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter:
			buildTarget === "vercel"
				? adapterVercel()
				: adapter({
						pages: "build",
						assets: "build",
						fallback: "404.html",
						precompress: false,
						strict: false,
					}),
		// paths: {
		// 	base: buildTarget === "static" ? "/me" : "",
		// },
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				if (path.startsWith("/api/")) return;
				throw new Error(`${message} (${path} from ${referrer})`);
			},
		},
		csp: {
			directives: {
				"default-src": ["'self'"],
				"script-src": ["'self'", "'unsafe-inline'"],
				"style-src": ["'self'", "'unsafe-inline'"],
				"img-src": ["'self'", "data:", "https:"],
				"font-src": ["'self'", "data:", "https:"],
				"connect-src": ["'self'", "https:"],
				"frame-ancestors": ["'none'"],
				"form-action": ["'none'"],
				"object-src": ["'none'"],
				"base-uri": ["'none'"]
			},
			mode: "auto"
		},
		alias: {
			$components: "src/lib/components",
			$icons: "src/lib/icons",
			$styles: "src/lib/styles",
			$utils: "src/lib/utils",
			$data: "src/lib/data",
			$actions: "src/lib/actions",
			$types: "src/lib/types",
		},
	},
};

export default config;

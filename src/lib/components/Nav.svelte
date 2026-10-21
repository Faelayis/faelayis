<script lang="ts">
	import { onMount } from "svelte";
	import { scroll } from "$utils/scroll.svelte";
	import { magnetic } from "$actions/magnetic";
	import { heroNavProgress, swapProgress, tailProgress, tailLetterProgress } from "$utils/hero-nav.svelte";
	import { prefersReducedMotion } from "$utils/browser";
	import { scrollThenReplay } from "$utils/replay";

	interface Props {
		name: string;
		handle: string;
		hasAbout?: boolean;
	}

	let { name, handle, hasAbout = false }: Props = $props();

	const brandRoot = $derived(handle.toLowerCase().startsWith(name.toLowerCase()) ? handle.slice(0, name.length) : handle);
	const brandTail = $derived(Array.from(handle.slice(brandRoot.length)));
	const navItems = $derived(
		[
			{ href: "#part-of-work", label: "Work" },
			{ href: "#side-projects", label: "Projects" },
			{ href: "#tech-skills", label: "Skills" },
			{ href: "#about", label: "About" },
			{ href: "#contact", label: "Contact" },
		].filter((navItem) => hasAbout || navItem.href !== "#about"),
	);

	let brandVisible = $state(false);

	type Theme = "light" | "dark";
	let theme = $state<Theme>("light");

	function systemTheme(): Theme {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}

	function toggleTheme(): void {
		theme = theme === "dark" ? "light" : "dark";
		document.documentElement.dataset.theme = theme;
		try {
			if (theme === systemTheme()) {
				localStorage.removeItem("theme");
				delete document.documentElement.dataset.theme;
			} else {
				localStorage.setItem("theme", theme);
			}
		} catch {}
	}

	let navEl: HTMLElement | null = $state(null);
	let brandRootEl: HTMLElement | null = $state(null);
	let brandTailEls: (HTMLElement | null)[] = $state([]);
	let navItemEls: (HTMLElement | null)[] = $state([null, null, null, null, null]);
	let indicatorEl: HTMLElement | null = $state(null);
	let indicatorStyle = $state({ left: "0px", width: "0px", opacity: 0 });

	function handleNavClick(event: MouseEvent): void {
		const anchor = event.currentTarget as HTMLAnchorElement | null;
		if (!anchor) return;
		scrollThenReplay(anchor.getAttribute("href") ?? "");
	}

	onMount(() => {
		scroll.start();
		const chosen = document.documentElement.dataset.theme;
		theme = chosen === "light" || chosen === "dark" ? chosen : systemTheme();
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onSystemChange = (): void => {
			if (!document.documentElement.dataset.theme) theme = systemTheme();
		};
		media.addEventListener("change", onSystemChange);
		return () => {
			scroll.stop();
			media.removeEventListener("change", onSystemChange);
		};
	});

	$effect(() => {
		const id = scroll.activeSection;
		const index = id ? navItems.findIndex((navItem) => navItem.href === `#${id}`) : -1;
		const navItem = index >= 0 ? navItemEls[index] : null;
		if (!navItem) {
			indicatorStyle.opacity = 0;
			return;
		}
		indicatorStyle = {
			left: `${navItem.offsetLeft}px`,
			width: `${navItem.offsetWidth}px`,
			opacity: 1,
		};
	});

	$effect(() => {
		if (!brandRootEl) return;
		const scrollY = scroll.scrollY;
		const reduceMotion = prefersReducedMotion();
		const { progress } = heroNavProgress(scrollY);
		const rootOpacity = reduceMotion ? (scrollY > 80 ? 1 : 0) : swapProgress(progress);
		const tail = reduceMotion ? rootOpacity : tailProgress(progress);

		brandRootEl.style.opacity = String(rootOpacity);
		brandTailEls.forEach((letterEl, index) => {
			if (!letterEl) return;
			const shown = reduceMotion ? tail : tailLetterProgress(tail, index, brandTail.length);
			const rest = 1 - shown;
			letterEl.style.opacity = String(shown);
			letterEl.style.transform = rest > 0 ? `translate3d(${(-0.25 * rest).toFixed(3)}em, ${(0.35 * rest).toFixed(3)}em, 0)` : "";
			letterEl.style.filter = rest > 0.01 ? `blur(${(1.5 * rest).toFixed(2)}px)` : "";
		});
		brandVisible = rootOpacity > 0.5;
	});
</script>

<header class="nav" class:scrolled={scroll.scrollY > 12} class:shrink={scroll.scrollY > 80}>
	<div class="wrap row" bind:this={navEl}>
		<span class="brand-mag" use:magnetic={{ strength: 0.4, range: 1.2 }}>
			<a
				href="#top"
				class="brand"
				tabindex={brandVisible ? undefined : -1}
				aria-hidden={brandVisible ? undefined : "true"}
				onclick={handleNavClick}
				><span class="brand-inner"
					><span class="brand-root" bind:this={brandRootEl}>{brandRoot}</span>{#each brandTail as letter, index}<span
							class="brand-tail-ch"
							bind:this={brandTailEls[index]}>{letter}</span
						>{/each}</span
				></a
			>
		</span>
		<div class="nav-end">
			<nav class="nav-items" aria-label="Primary">
				{#each navItems as navItem, index}
					<a
						href={navItem.href}
						bind:this={navItemEls[index]}
						class:active={scroll.activeSection === navItem.href.slice(1)}
						aria-current={scroll.activeSection === navItem.href.slice(1) ? "true" : undefined}
						use:magnetic={{ strength: 0.3, range: 1.4 }}
						onclick={handleNavClick}
					>
						{navItem.label}
					</a>
				{/each}
				<span
					class="indicator"
					bind:this={indicatorEl}
					style="left: {indicatorStyle.left}; width: {indicatorStyle.width}; opacity: {indicatorStyle.opacity}"
					aria-hidden="true"
				></span>
			</nav>
			<button
				type="button"
				class="theme-toggle"
				aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
				aria-pressed={theme === "dark"}
				onclick={toggleTheme}
			>
				<svg class="theme-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
					{#if theme === "dark"}
						<circle cx="12" cy="12" r="4.25" />
						<path
							d="M12 2.5v2.25M12 19.25v2.25M2.5 12h2.25M19.25 12h2.25M5.28 5.28l1.6 1.6M17.12 17.12l1.6 1.6M5.28 18.72l1.6-1.6M17.12 6.88l1.6-1.6"
						/>
					{:else}
						<path d="M20 14.6A8.25 8.25 0 0 1 9.4 4a8.25 8.25 0 1 0 10.6 10.6Z" />
					{/if}
				</svg>
			</button>
		</div>
	</div>
</header>

<style>
	.nav {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 50;
		padding-block: 1.1rem;
		background: color-mix(in oklch, var(--bg) 70%, transparent);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--line);
		transition:
			padding-block var(--duration-base) var(--easing-soft),
			background-color var(--duration-base) var(--easing-soft),
			border-color var(--duration-base) var(--easing-soft),
			box-shadow var(--duration-base) var(--easing-soft);
		will-change: padding-block, background-color;
	}
	.nav.shrink {
		padding-block: 0.5rem;
		background: color-mix(in oklch, var(--bg) 88%, transparent);
		border-bottom-color: var(--line-strong);
		box-shadow: 0 6px 24px -18px var(--shadow);
	}
	.nav .row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.5rem;
	}
	.nav-end {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.theme-toggle {
		position: relative;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		margin-right: -6px;
		border-radius: 999px;
		color: var(--ink-2);
		transition:
			color var(--duration-fast) var(--easing-soft),
			background var(--duration-fast) var(--easing-soft);
	}
	/* 44px hit area around the small visible button. */
	.theme-toggle::before {
		content: "";
		position: absolute;
		inset: -8px;
	}
	.theme-toggle:hover {
		color: var(--ink);
		background: var(--bg-elev);
	}
	.theme-icon {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.brand-mag {
		display: inline-block;
		will-change: transform;
	}
	.brand {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 400;
		letter-spacing: -0.04em;
		line-height: 0.92;
		display: inline-block;
		transition: font-size var(--duration-base) var(--easing-soft);
	}
	.brand-inner {
		display: inline-block;
		white-space: nowrap;
	}
	/* Both parts start hidden; the scroll handoff in the script reveals them. */
	.brand-root,
	.brand-tail-ch {
		display: inline-block;
		opacity: 0;
	}
	.nav.shrink .brand {
		font-size: 0.95rem;
	}
	.nav .nav-items {
		position: relative;
		display: flex;
		gap: 1.25rem;
		font-size: 0.9rem;
		color: var(--ink-2);
		transition: font-size var(--duration-base) var(--easing-soft);
	}
	.nav.shrink .nav-items {
		font-size: 0.85rem;
	}
	.nav .nav-items a {
		position: relative;
		display: inline-block;
		padding-block: 0.15rem;
		color: var(--ink-2);
		transition: color var(--duration-fast) var(--easing-soft);
	}
	/* Expands the hit area to ~44px without changing the visual rhythm. */
	.nav .nav-items a::before {
		content: "";
		position: absolute;
		inset: -10px -6px;
	}
	.nav .nav-items a.active {
		color: var(--ink);
	}
	.nav .nav-items a:hover {
		color: var(--ink);
	}
	.indicator {
		position: absolute;
		bottom: -4px;
		height: 1.5px;
		background: var(--accent);
		transform-origin: left center;
		transition:
			left 520ms var(--easing-soft),
			width 520ms var(--easing-soft),
			opacity 320ms var(--easing-soft);
		pointer-events: none;
		border-radius: 2px;
	}
	.indicator::after {
		content: "";
		position: absolute;
		inset: -3px 0;
		background: var(--accent);
		filter: blur(6px);
		opacity: 0.5;
		z-index: -1;
	}
	@media (max-width: 720px) {
		.nav .nav-items {
			gap: 0.9rem;
			font-size: 0.82rem;
		}
	}
	@media (max-width: 520px) {
		.nav .nav-items {
			gap: 0.7rem;
		}
		.nav-end {
			gap: 0.75rem;
		}
	}
</style>

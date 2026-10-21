<script lang="ts">
	import { onMount, untrack } from "svelte";
	import { animate } from "animejs";
	import { scroll } from "$utils/scroll.svelte";
	import { prefersReducedMotion } from "$utils/browser";
	import { HANDOFF_AT, heroDock, heroNavProgress, travelProgress, swapProgress, easeInOutCubic } from "$utils/hero-nav.svelte";
	import { scrambleText } from "$utils/scramble";
	import { revealOnView } from "$utils/anime";
	import { revealMeta } from "$utils/reveal-presets";
	import { scrollThenReplay } from "$utils/replay";
	import { prettify } from "$utils/text";
	import { recencyLabel } from "$utils/format";

	interface CurrentRole {
		name: string;
		role?: string;
		start: string;
		url?: string;
	}

	interface LatestPush {
		name: string;
		url: string;
		pushedAt: string;
	}

	interface Props {
		name: string;
		handle: string;
		role: string;
		location: string;
		bio: string;
		email: string;
		currentRoles: CurrentRole[];
		latestPush: LatestPush | null;
	}

	let { name, role, handle, location, bio, email, currentRoles, latestPush }: Props = $props();

	let now = $state<number | null>(null);
	const factsReveal = { ...revealMeta, delay: 650 };
	const actionsReveal = { ...revealMeta, delay: 780 };

	function handleWorkClick(event: MouseEvent): void {
		const anchor = event.currentTarget as HTMLAnchorElement | null;
		if (!anchor) return;
		scrollThenReplay(anchor.getAttribute("href") ?? "");
	}

	let heroNameEl: HTMLElement | null = $state(null);
	let heroLeft = $state(0);
	let heroDocTop = $state(0);
	let heroHeight = $state(0);
	let measured = $state(false);

	let nameTiltEl: HTMLElement | null = $state(null);
	let tiltRAF: number | null = null;
	let tiltActive = false;

	let brandRootEl: HTMLElement | null = null;
	let resizeRAF: number | null = null;
	let lastWidth = 0;
	let heroFontPx = 0;

	function measureHero(): void {
		if (!heroNameEl) return;
		const nameTransform = heroNameEl.style.transform;
		const tiltTransform = nameTiltEl?.style.transform ?? "";
		heroNameEl.style.transform = "none";
		if (nameTiltEl) nameTiltEl.style.transform = "none";
		const rect = heroNameEl.getBoundingClientRect();
		heroNameEl.style.transform = nameTransform;
		if (nameTiltEl) nameTiltEl.style.transform = tiltTransform;
		heroLeft = rect.left;
		heroDocTop = rect.top + window.scrollY;
		heroHeight = rect.height;
		heroFontPx = parseFloat(getComputedStyle(heroNameEl).fontSize) || 0;
		lastWidth = window.innerWidth;
		measured = true;
	}

	function getBrandRoot(): HTMLElement | null {
		if (!brandRootEl || !brandRootEl.isConnected) {
			brandRootEl = document.querySelector<HTMLElement>(".brand-root");
		}
		return brandRootEl;
	}

	function onResize(): void {
		if (window.innerWidth === lastWidth) return;
		if (resizeRAF !== null) return;
		resizeRAF = requestAnimationFrame(() => {
			resizeRAF = null;
			measureHero();
		});
	}

	const tiltHandlers: {
		move: (event: PointerEvent) => void;
		leave: (event: PointerEvent) => void;
	} = {
		move: () => {},
		leave: () => {},
	};

	function handleNameCharSettle(_i: number, el: HTMLSpanElement, _ch: string): void {
		animate(el, {
			translateY: [14, 0],
			rotateX: [-55, 0],
			duration: 900,
			ease: "out(4)",
		});
	}

	onMount(() => {
		const reduceMotion = prefersReducedMotion();

		now = Date.now();
		scroll.start();

		const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
		if (nameTiltEl && finePointer && !reduceMotion) {
			tiltActive = true;
			tiltHandlers.move = (event: PointerEvent) => {
				if (!tiltActive || !nameTiltEl) return;
				const rect = nameTiltEl.getBoundingClientRect();
				if (rect.bottom < 0 || rect.top > window.innerHeight) return;
				const rawX = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
				const rawY = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
				const pointerXRatio = Math.max(-0.5, Math.min(0.5, rawX));
				const pointerYRatio = Math.max(-0.5, Math.min(0.5, rawY));
				if (tiltRAF !== null) return;
				tiltRAF = requestAnimationFrame(() => {
					tiltRAF = null;
					if (!nameTiltEl) return;
					const rotateXDeg = (-pointerYRatio * 18).toFixed(2);
					const rotateYDeg = (pointerXRatio * 26).toFixed(2);
					nameTiltEl.style.transform = `rotateX(${rotateXDeg}deg) rotateY(${rotateYDeg}deg)`;
				});
			};
			tiltHandlers.leave = (event: PointerEvent) => {
				if (event.relatedTarget !== null) return;
				if (tiltRAF !== null) {
					cancelAnimationFrame(tiltRAF);
					tiltRAF = null;
				}
				if (!nameTiltEl) return;
				nameTiltEl.style.transform = "rotateX(0deg) rotateY(0deg)";
			};
			window.addEventListener("pointermove", tiltHandlers.move, { passive: true });
			window.addEventListener("pointerout", tiltHandlers.leave, { passive: true });
		}

		measureHero();
		requestAnimationFrame(measureHero);
		setTimeout(measureHero, 50);
		setTimeout(measureHero, 200);
		if (document.fonts?.ready) document.fonts.ready.then(measureHero).catch(() => {});
		window.addEventListener("resize", onResize, { passive: true });
		window.addEventListener("orientationchange", onResize, { passive: true });

		return () => {
			scroll.stop();
			window.removeEventListener("resize", onResize);
			window.removeEventListener("orientationchange", onResize);
			if (resizeRAF !== null) cancelAnimationFrame(resizeRAF);
			if (tiltRAF !== null) cancelAnimationFrame(tiltRAF);
			window.removeEventListener("pointermove", tiltHandlers.move);
			window.removeEventListener("pointerout", tiltHandlers.leave);
		};
	});

	$effect(() => {
		if (!heroNameEl) return;
		const scrollY = scroll.scrollY;
		const { easedProgress } = untrack(() => heroNavProgress(scrollY));

		if (easedProgress > 0.02 && tiltActive) {
			tiltActive = false;
			if (tiltRAF !== null) {
				cancelAnimationFrame(tiltRAF);
				tiltRAF = null;
			}
			if (nameTiltEl) nameTiltEl.style.transform = "rotateX(0deg) rotateY(0deg)";
		}

		if (prefersReducedMotion() || !measured) {
			heroNameEl.style.opacity = scrollY > 80 ? "0" : "1";
			heroNameEl.style.transform = "";
			heroNameEl.style.filter = "";
			heroNameEl.style.fontVariationSettings = "";
			return;
		}

		const brand = getBrandRoot();
		if (!brand) return;
		const brandRect = brand.getBoundingClientRect();

		const dockDistance = Math.max(1, heroDocTop - brandRect.top);
		if (Math.abs(heroDock.distance - dockDistance) > 0.5) heroDock.distance = dockDistance;
		const progress = Math.min(1, Math.max(0, (scrollY * HANDOFF_AT) / dockDistance));

		const deltaX = brandRect.left - heroLeft;
		const brandScale = brandRect.height / Math.max(heroHeight, 1);

		const transitionProgress = travelProgress(progress);
		const naturalTop = heroDocTop - scrollY;
		const translateX = deltaX * transitionProgress;
		const translateY = Math.max(0, brandRect.top - naturalTop);
		const scale = 1 + (brandScale - 1) * transitionProgress;

		heroNameEl.style.transformOrigin = "top left";
		heroNameEl.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
		heroNameEl.style.opacity = String(1 - swapProgress(progress));

		const traveling = scrollY > 0.5;
		heroNameEl.classList.toggle("travel", traveling);
		nameTiltEl?.classList.toggle("travel", traveling);
		const renderedPx = heroFontPx * scale;
		heroNameEl.style.fontVariationSettings = renderedPx > 0 ? `"opsz" ${Math.min(144, Math.max(9, renderedPx)).toFixed(1)}` : "";

		const velocityFactor = Math.min(1, Math.max(0, scroll.velocity) * 1.6) * (1 - easeInOutCubic(progress));
		const blurMax = window.innerWidth <= 720 ? 1.5 : 2.5;
		heroNameEl.style.filter = velocityFactor > 0.02 ? `blur(${(velocityFactor * blurMax).toFixed(2)}px)` : "";
	});
</script>

<section id="top" class="hero">
	<div class="wrap">
		<p class="meta" use:scrambleText={{ speed: 18, settleDelay: 10, settleDuration: 240 }}>{handle} — {role}, {location}</p>
		<div class="name-tilt" bind:this={nameTiltEl}>
			<h1
				class="name"
				bind:this={heroNameEl}
				use:scrambleText={{ speed: 24, settleDelay: 90, settleDuration: 360, charClass: "hero-char", onCharSettle: handleNameCharSettle }}
			>
				{name}
			</h1>
		</div>
		{#if bio.trim()}
			<p class="bio hero-bio">{bio}</p>
		{/if}

		{#if currentRoles.length || latestPush}
			<dl class="facts" use:revealOnView={factsReveal}>
				{#if currentRoles.length}
					<div class="fact">
						<dt>Now</dt>
						{#each currentRoles as currentRole (currentRole.name)}
							<dd>
								{#if currentRole.url}
									<a class="fact-name" href={currentRole.url} target="_blank" rel="noopener noreferrer">
										{currentRole.name}<span class="sr-only"> (opens in new tab)</span>
									</a>
								{:else}
									<span class="fact-name">{currentRole.name}</span>
								{/if}
								<span class="fact-meta">{currentRole.role ? `${currentRole.role} · ` : ""}since {currentRole.start}</span>
							</dd>
						{/each}
					</div>
				{/if}
				{#if latestPush}
					<div class="fact">
						<dt>Last push</dt>
						<dd>
							<a class="fact-name" href={latestPush.url} target="_blank" rel="noopener noreferrer">
								{prettify(latestPush.name)}<span class="sr-only"> (opens in new tab)</span>
							</a>
							<time class="fact-meta" datetime={latestPush.pushedAt}>{recencyLabel(latestPush.pushedAt, now)}</time>
						</dd>
					</div>
				{/if}
			</dl>
		{/if}

		<div class="hero-actions" use:revealOnView={actionsReveal}>
			<a class="hero-link" href="#part-of-work" onclick={handleWorkClick}>
				<span class="hero-link-text">See the work</span>
				<span class="hero-link-arrow down" aria-hidden="true">↓</span>
			</a>
			<a class="hero-link" href="mailto:{email}">
				<span class="hero-link-text">Email me</span>
				<span class="hero-link-arrow" aria-hidden="true">↗</span>
			</a>
		</div>
	</div>
</section>

<style>
	/* The opening screen: content centred in a full viewport, clear of the fixed nav. */
	.hero {
		min-height: 100svh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-block: clamp(6rem, 12svh, 9rem) clamp(5rem, 4rem + 6svh, 9rem);
	}
	.meta {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		color: var(--ink-muted);
		margin-bottom: 1.5rem;
	}
	/* will-change makes this a stacking context, so it carries the z-index: the name has to
	   travel over the nav's frosted bar (z 50), not under it. Pointer events pass through to the nav. */
	.name-tilt {
		position: relative;
		z-index: 55;
		pointer-events: none;
		width: fit-content;
		margin-bottom: 2rem;
		perspective: 1000px;
		perspective-origin: 50% 60%;
		transform-style: preserve-3d;
		will-change: transform;
	}
	.name {
		font-family: var(--font-display);
		font-size: clamp(3.5rem, 2.2rem + 8vw, 8rem);
		font-weight: 400;
		line-height: 0.92;
		letter-spacing: -0.04em;
		margin: 0;
		position: relative;
		z-index: 55;
		width: fit-content;
		transform-origin: top left;
		pointer-events: none;
		perspective: 1100px;
		perspective-origin: 50% 100%;
		transform-style: preserve-3d;
	}
	:global(.hero-char) {
		display: inline-block;
		transform-style: preserve-3d;
		backface-visibility: hidden;
		transform-origin: bottom center;
	}
	/* Travelling to the nav: drop the 3D context so the name is painted at its real size. */
	.name-tilt:global(.travel),
	.name:global(.travel) {
		perspective: none;
		transform-style: flat;
		will-change: auto;
	}
	.name:global(.travel) :global(.hero-char) {
		transform: none !important;
		transform-style: flat;
		backface-visibility: visible;
	}
	.facts {
		display: grid;
		gap: 1.1rem;
		max-width: 40rem;
		margin-top: 0.5rem;
	}
	.fact {
		display: grid;
		grid-template-columns: 6.5rem 1fr;
		column-gap: 1.25rem;
		row-gap: 0.4rem;
		align-items: baseline;
	}
	.fact dt {
		grid-row: span 4;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-muted);
	}
	.fact dd {
		grid-column: 2;
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		column-gap: 0.75rem;
		row-gap: 0.15rem;
	}
	.fact-name {
		font-family: var(--font-display);
		font-size: clamp(1.15rem, 1rem + 0.5vw, 1.4rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.2;
		color: var(--ink);
	}
	a.fact-name {
		position: relative;
		border-bottom: 1px solid var(--line-strong);
		transition:
			color var(--duration-fast) var(--easing-soft),
			border-color var(--duration-fast) var(--easing-soft);
	}
	a.fact-name::before {
		content: "";
		position: absolute;
		inset: -10px -4px;
	}
	a.fact-name:hover {
		border-color: var(--accent);
	}
	.fact-meta {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.02em;
		color: var(--ink-muted);
	}
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 2rem;
		margin-top: clamp(2rem, 4vw, 2.75rem);
	}
	.hero-link {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 44px;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink);
	}
	.hero-link-text {
		border-bottom: 1px solid var(--line-strong);
		transition: border-color var(--duration-fast) var(--easing-soft);
	}
	.hero-link:hover .hero-link-text {
		border-color: var(--ink);
	}
	.hero-link-arrow {
		color: var(--ink-muted);
		transition:
			transform var(--duration-base) var(--easing-soft),
			color var(--duration-base) var(--easing-soft);
	}
	.hero-link:hover .hero-link-arrow {
		color: var(--accent);
		transform: translate(2px, -2px);
	}
	.hero-link:hover .hero-link-arrow.down {
		transform: translateY(2px);
	}
	.hero-bio {
		font-size: clamp(1rem, 0.9rem + 0.5vw, 1.2rem);
		line-height: 1.5;
		color: var(--ink-2);
		max-width: 36ch;
	}
	@media (max-width: 520px) {
		.fact {
			grid-template-columns: 1fr;
		}
		.fact dt {
			grid-row: auto;
		}
		.fact dd {
			grid-column: 1;
		}
	}
	@media (max-width: 720px) {
		.hero {
			padding-block: clamp(5.5rem, 14svh, 8rem) clamp(3.5rem, 8svh, 5rem);
		}
	}
	@media (max-width: 380px) {
		.name {
			font-size: clamp(2.8rem, 14vw, 3.5rem);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.name-tilt {
			transform: none !important;
		}
	}
	@media (hover: none), (pointer: coarse) {
		.name-tilt {
			transform: none !important;
		}
	}
</style>

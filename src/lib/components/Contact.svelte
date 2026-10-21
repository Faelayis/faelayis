<script lang="ts">
	import { tick } from "svelte";
	import { animate } from "animejs";
	import { revealOnView, inView } from "$utils/anime";
	import { revealHint, revealMeta, revealTiltY } from "$utils/reveal-presets";
	import { copyToClipboard, isApplePlatform, isTouchOnly, prefersReducedMotion, selectText } from "$utils/browser";
	import { magnetic } from "$actions/magnetic";
	import { isInkHex } from "$utils/format";
	import type { Social } from "$types/data/personal-info";

	interface Props {
		email: string;
		socials: Social[];
	}

	let { email, socials }: Props = $props();

	type CopyState = "idle" | "copied" | "selected";

	let copyState = $state<CopyState>("idle");
	let emailCardEl: HTMLElement | null = $state(null);
	let addressEl: HTMLElement | null = $state(null);
	let revealAddress = $state(false);
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	const copyHint = $derived(isTouchOnly() ? "tap Copy on the selection" : `press ${isApplePlatform() ? "⌘C" : "Ctrl+C"}`);
	const copyLabel = $derived(copyState === "copied" ? "Copied" : copyState === "selected" ? "Selected" : "Copy address");
	const copyAnnouncement = $derived(
		copyState === "copied"
			? "Email address copied to clipboard"
			: copyState === "selected"
				? `Couldn't copy automatically. The address is selected; ${copyHint} to copy it.`
				: "",
	);

	async function copyEmail(): Promise<void> {
		const ok = await copyToClipboard(email);
		if (!ok) {
			revealAddress = true;
			await tick();
			if (addressEl) selectText(addressEl);
		}
		copyState = ok ? "copied" : "selected";

		if (ok && emailCardEl && !prefersReducedMotion()) {
			animate(emailCardEl, {
				scale: [
					{ to: 0.985, duration: 120, ease: "out(2)" },
					{ to: 1, duration: 320, ease: "out(3)" },
				],
			});
		}

		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => (copyState = "idle"), ok ? 1800 : 6000);
	}
</script>

<section id="contact" class="contact">
	<div class="wrap">
		<header class="head section-head" use:inView>
			<div class="title-3d">
				<h2 class="title" use:revealOnView={revealTiltY}>
					Get in touch<span class="accent">.</span>
				</h2>
			</div>
			<p class="intro" use:revealOnView={revealHint}>
				A short email is the fastest way in. The inbox is open for projects, questions, or just to say hi — every message gets a reply.
			</p>
		</header>

		<div class="email-card" class:is-copied={copyState === "copied"} bind:this={emailCardEl} use:revealOnView={revealMeta}>
			<span class="card-label">Email</span>
			<a class="email-link" href="mailto:{email}">
				<span class="email-address" bind:this={addressEl}>{revealAddress ? email : "Send me an email"}</span>
				<span class="card-arrow" aria-hidden="true">↗</span>
			</a>
			<div class="email-foot">
				<span class="email-hint">{copyState === "selected" ? `Address selected, ${copyHint}` : "Opens your mail app"}</span>
				<button type="button" class="copy-btn" class:is-done={copyState !== "idle"} onclick={copyEmail}>
					{copyLabel}
				</button>
			</div>
			<span class="sr-only" aria-live="polite">{copyAnnouncement}</span>
		</div>

		<div class="cards">
			{#each socials as social, index (social.url)}
				<a
					href={social.url}
					target="_blank"
					rel="noopener noreferrer"
					class="card card-social"
					aria-label="{social.label}{social.handle ? `, ${social.handle}` : ''} (opens in new tab)"
					use:revealOnView={{
						...revealMeta,
						delay: 100 + index * 50,
					}}
					use:magnetic={{ strength: 0.2, range: 1.4 }}
				>
					<span class="card-label">{social.label}</span>
					{#if social.icon}
						<svg
							class="card-icon"
							class:is-ink-icon={isInkHex(social.icon.hex)}
							viewBox="0 0 24 24"
							width="36"
							height="36"
							fill="#{social.icon.hex}"
							aria-hidden="true"
						>
							<path d={social.icon.path} />
						</svg>
					{:else}
						<span class="card-icon-fallback">{social.label.charAt(0)}</span>
					{/if}
					<span class="card-foot">
						{#if social.handle}
							<span class="card-handle">{social.handle}</span>
						{/if}
						<span class="card-action">
							Visit
							<span class="arrow" aria-hidden="true">↗</span>
						</span>
					</span>
				</a>
			{/each}
		</div>
	</div>
</section>

<style>
	.contact {
		padding-block: clamp(4rem, 8vw, 7rem);
		border-top: 1px solid var(--line);
		/* The headline swings in on rotateY; clip its start pose so it never widens the page. */
		overflow-x: clip;
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-bottom: 1.5rem;
	}

	.title-3d {
		perspective: 1100px;
		perspective-origin: 0% 50%;
	}
	.title {
		font-family: var(--font-display);
		font-size: clamp(2.4rem, 1.5rem + 4vw, 4.5rem);
		font-weight: 400;
		letter-spacing: -0.035em;
		line-height: 1.02;
		transform-style: preserve-3d;
		transform-origin: left center;
		backface-visibility: hidden;
	}
	.title .accent {
		color: var(--accent);
	}
	.intro {
		font-size: var(--fs-lead);
		line-height: 1.55;
		color: var(--ink-2);
		max-width: 42ch;
	}

	.card-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-muted);
	}
	.card-arrow,
	.arrow {
		transition:
			transform 360ms var(--easing-soft),
			color 360ms var(--easing-soft);
	}

	/* Email: the primary way in, shown in full and linked directly. */
	.email-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: clamp(2rem, 4vw, 3rem);
		padding: clamp(1.4rem, 1rem + 1.2vw, 2rem) clamp(1.4rem, 1rem + 1.4vw, 2.25rem);
		background: var(--bg-elev);
		border: 1px solid var(--line-strong);
		border-radius: 12px;
		transition:
			border-color var(--duration-base) var(--easing-soft),
			background var(--duration-base) var(--easing-soft);
	}
	.email-card:hover,
	.email-card:focus-within {
		border-color: var(--accent);
		background: var(--bg);
	}
	.email-card.is-copied {
		border-color: var(--accent);
	}
	.email-link {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		color: var(--ink);
	}
	/* The whole card opens mail; the copy button sits above this layer. */
	.email-link::after {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}
	.email-link:focus-visible {
		outline: none;
	}
	.email-card:has(.email-link:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
	.email-address {
		font-family: var(--font-display);
		font-size: clamp(1.5rem, 1rem + 2.4vw, 2.6rem);
		font-weight: 500;
		letter-spacing: -0.025em;
		line-height: 1.1;
		overflow-wrap: anywhere;
	}
	.email-card.is-copied .email-address {
		color: var(--accent);
	}
	.email-link .card-arrow {
		flex-shrink: 0;
		font-size: clamp(1.15rem, 1rem + 0.8vw, 1.6rem);
		color: var(--ink-muted);
	}
	.email-card:hover .card-arrow,
	.email-card:focus-within .card-arrow {
		transform: translate(4px, -4px);
		color: var(--accent);
	}
	.email-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.email-hint {
		font-size: 0.85rem;
		color: var(--ink-muted);
	}
	.copy-btn {
		position: relative;
		z-index: 1;
		min-height: 44px;
		padding: 0 1.1rem;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		background: var(--bg);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-2);
		transition:
			color var(--duration-fast) var(--easing-soft),
			border-color var(--duration-fast) var(--easing-soft),
			background var(--duration-fast) var(--easing-soft);
	}
	.copy-btn:hover {
		color: var(--ink);
		border-color: var(--ink);
	}
	.copy-btn.is-done {
		color: var(--ink);
		border-color: var(--accent);
	}

	/* Socials */
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1.25rem;
		padding: 1.5rem 1.6rem;
		min-height: 170px;
		border: 1px solid var(--line);
		background: var(--bg);
		border-radius: 12px;
		color: var(--ink);
		will-change: transform;
		transition:
			border-color var(--duration-base) var(--easing-soft),
			background var(--duration-base) var(--easing-soft),
			transform var(--duration-base) var(--easing-soft);
	}
	.card:hover {
		border-color: var(--accent);
		background: var(--bg-elev);
	}

	.card-icon {
		display: block;
		transition: transform 360ms var(--easing-soft);
	}
	.card:hover .card-icon {
		transform: scale(1.08);
	}
	.card-icon-fallback {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 500;
		color: var(--ink);
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 8px;
	}

	.card-foot {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.card-handle {
		font-family: var(--font-display);
		font-size: clamp(1.15rem, 0.95rem + 0.6vw, 1.5rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.card-action {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-muted);
		transition: color var(--duration-base) var(--easing-soft);
	}
	.card:hover .card-action {
		color: var(--ink);
	}
	.card:hover .card-action .arrow {
		transform: translate(3px, -3px);
		color: var(--accent);
	}

	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) .card-icon {
			filter: brightness(1.25) saturate(0.85);
		}
	}
	:global([data-theme="dark"]) .card-icon {
		filter: brightness(1.25) saturate(0.85);
	}
</style>

<script lang="ts">
	import { revealOnView, inView } from "$utils/anime";
	import { revealTitle, revealHint } from "$utils/reveal-presets";
	import type { PartOfWorkItem } from "$types/data/part-of-work";

	interface Props {
		partOfWork: PartOfWorkItem[];
	}

	let { partOfWork }: Props = $props();

	const isActive = (item: PartOfWorkItem) => item.end.trim().toLowerCase() === "present";
	const startYear = (item: PartOfWorkItem) => item.start.trim();
	const opensYear = (index: number) => index === 0 || startYear(partOfWork[index - 1]) !== startYear(partOfWork[index]);

	function tiltEntry(node: HTMLElement): { destroy: () => void } {
		if (typeof window === "undefined") return { destroy: () => {} };
		const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (!finePointer || reduceMotion) return { destroy: () => {} };

		const mark = node.querySelector<HTMLElement>(".entry-mark");
		const name = node.querySelector<HTMLElement>(".entry-name");
		const arrow = node.querySelector<HTMLElement>(".arrow");
		let rafId: number | null = null;

		function onMove(event: PointerEvent) {
			const rect = node.getBoundingClientRect();
			if (event.clientY < rect.top || event.clientY > rect.bottom) return;
			const pointerXRatio = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
			const pointerYRatio = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				const rotateXDeg = (-pointerYRatio * 14).toFixed(2);
				const rotateYDeg = (pointerXRatio * 20).toFixed(2);
				const nameDepth = (Math.abs(pointerXRatio) * 14 + 8).toFixed(2);
				const arrowDepth = (Math.abs(pointerXRatio) * 22 + 16).toFixed(2);
				if (mark) {
					mark.style.transition = "none";
					mark.style.transform = `perspective(500px) rotateX(${rotateXDeg}deg) rotateY(${rotateYDeg}deg)`;
				}
				if (name) {
					name.style.transition = "none";
					name.style.translate = "0 0";
					name.style.transform = `perspective(500px) translateZ(${nameDepth}px)`;
				}
				if (arrow) {
					arrow.style.transition = "none";
					arrow.style.translate = "0 0";
					arrow.style.transform = `perspective(500px) translateZ(${arrowDepth}px)`;
				}
			});
		}

		function onLeave() {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
			if (mark) {
				mark.style.transition = "";
				mark.style.transform = "";
			}
			if (name) {
				name.style.transition = "";
				name.style.translate = "";
				name.style.transform = "";
			}
			if (arrow) {
				arrow.style.transition = "";
				arrow.style.translate = "";
				arrow.style.transform = "";
			}
		}

		node.addEventListener("pointermove", onMove, { passive: true });
		node.addEventListener("pointerleave", onLeave, { passive: true });
		return {
			destroy() {
				node.removeEventListener("pointermove", onMove);
				node.removeEventListener("pointerleave", onLeave);
				if (rafId !== null) cancelAnimationFrame(rafId);
			},
		};
	}
</script>

<section id="part-of-work" class="part-of-work">
	<div class="wrap">
		<header class="head section-head" use:inView>
			<h2 class="section-title" use:revealOnView={revealTitle}>Work I've Been Part Of</h2>
			<p class="hint" use:revealOnView={revealHint}>Things I've been part of, past and present.</p>
		</header>

		{#if partOfWork?.length}
			<ol class="timeline" use:inView>
				{#each partOfWork as item, index (item.name)}
					{@const active = isActive(item)}
					<li
						class="entry"
						class:is-active={active}
						style="--i: {index}"
						use:revealOnView={{
							opacity: [0, 1],
							translateY: [16, 0],
							duration: 720,
							delay: 120 + index * 90,
							ease: "out(3)",
						}}
						use:tiltEntry
					>
						<span class="entry-year mono" aria-hidden="true">{opensYear(index) ? startYear(item) : ""}</span>
						<span class="entry-rail" aria-hidden="true"><span class="node"></span></span>

						{#snippet card()}
							<div class="entry-mark" aria-hidden="true">
								{#if item.logoUrl}
									<img src={item.logoUrl} alt="" loading="lazy" decoding="async" />
								{:else if item.logo}
									{item.logo}
								{:else}
									{item.name.charAt(0)}
								{/if}
							</div>
							<div class="entry-body">
								<p class="period mono">
									<time datetime={startYear(item)}>{startYear(item)}</time>
									<span class="dash" aria-hidden="true">—</span>
									<span class="sr-only">to</span>
									{item.end}
								</p>
								<h3 class="entry-name">
									{item.name}
									{#if item.role}<span class="role">— {item.role}</span>{/if}
								</h3>
								{#if item.description}
									<p class="entry-desc">{item.description}</p>
								{/if}
								{#if item.tags?.length}
									<ul class="tags">
										{#each item.tags as tag}
											<li class="tag mono">{tag}</li>
										{/each}
									</ul>
								{/if}
							</div>
							<span class="arrow" aria-hidden="true">↗</span>
						{/snippet}

						{#if item.url}
							<a class="entry-card" href={item.url} target="_blank" rel="noopener noreferrer" data-cursor="View">
								<span class="sr-only">Visit {item.name}{active ? ", current" : ""} (opens in new tab)</span>
								{@render card()}
							</a>
						{:else}
							<div class="entry-card is-static">{@render card()}</div>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</section>

<style>
	.part-of-work {
		padding-block: clamp(3rem, 6vw, 5rem);
		border-top: 1px solid var(--line);
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--line);
	}
	.section-title {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: 500;
		letter-spacing: var(--ls-tight);
		margin-bottom: 1.5rem;
	}
	.head .section-title {
		margin-bottom: 0;
	}
	.hint {
		font-size: 0.9rem;
		color: var(--ink-muted);
	}

	/* Timeline: year | rail | card. The rail is one hairline drawn through every entry,
	   with a node per entry; current work carries the vermilion signal. */
	.timeline {
		--node-top: 1.7rem;
		padding-top: 0.5rem;
	}
	.entry {
		position: relative;
		display: grid;
		grid-template-columns: 3.25rem 1.5rem 1fr;
		column-gap: clamp(0.5rem, 1.5vw, 1rem);
	}

	.entry-year {
		padding-top: calc(var(--node-top) - 0.6em);
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		text-align: right;
		color: var(--ink-muted);
	}
	.entry.is-active .entry-year {
		color: var(--ink);
	}

	.entry-rail {
		position: relative;
	}
	.entry-rail::before {
		content: "";
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--line-strong);
		transform-origin: top center;
	}
	.entry:first-child .entry-rail::before {
		top: var(--node-top);
	}
	.entry:last-child .entry-rail::before {
		bottom: calc(100% - var(--node-top));
	}
	.node {
		position: absolute;
		left: 50%;
		top: var(--node-top);
		width: 9px;
		height: 9px;
		border-radius: 50%;
		border: 1.5px solid var(--ink-faint);
		background: var(--bg);
		translate: -50% -50%;
		transition:
			border-color var(--duration-base) var(--easing-soft),
			transform 320ms var(--easing-soft);
	}
	.entry.is-active .node {
		border-color: var(--accent);
		background: var(--accent);
		box-shadow: 0 0 0 4px color-mix(in oklch, var(--accent) 18%, transparent);
	}
	.entry:hover .node {
		border-color: var(--ink);
		transform: scale(1.25);
	}
	.entry.is-active:hover .node {
		border-color: var(--accent);
	}
	/* The rail draws itself down the list once it scrolls in (only when scripts run). */
	@media (scripting: enabled) {
		.entry-rail::before {
			transform: scaleY(0);
			transition: transform 700ms var(--easing-out);
			transition-delay: calc(80ms + var(--i) * 90ms);
		}
		.timeline:global(.in) .entry-rail::before {
			transform: scaleY(1);
		}
	}

	.entry-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		column-gap: clamp(0.9rem, 2.5vw, 1.5rem);
		align-items: start;
		margin-block: 0.25rem;
		padding: 0.9rem clamp(0.6rem, 1.5vw, 1rem);
		border-radius: 12px;
		transition: background 320ms var(--easing-soft);
	}
	a.entry-card:hover {
		background: var(--bg-elev);
	}
	.entry-card.is-static {
		cursor: default;
	}

	.entry-mark {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 500;
		letter-spacing: var(--ls-tight);
		color: var(--ink);
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 10px;
		transition:
			border-color var(--duration-base) var(--easing-soft),
			background var(--duration-base) var(--easing-soft),
			transform 320ms var(--easing-soft);
	}
	.entry-mark img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
		border-radius: 10px;
	}
	a.entry-card:hover .entry-mark {
		border-color: var(--ink-faint);
	}

	.entry-body {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		min-width: 0;
	}
	.period {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.72rem;
		letter-spacing: 0.02em;
		color: var(--ink-muted);
		white-space: nowrap;
	}
	.period .dash {
		opacity: 0.5;
	}
	.entry.is-active .period {
		color: var(--ink-2);
	}

	.entry-name {
		font-family: var(--font-display);
		font-size: clamp(1.15rem, 0.95rem + 0.6vw, 1.5rem);
		font-weight: 500;
		letter-spacing: var(--ls-tight);
		line-height: 1.1;
		transition: transform 320ms var(--easing-soft);
	}
	.role {
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 400;
		letter-spacing: 0;
		color: var(--ink-muted);
	}
	.entry-desc {
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--ink-2);
		max-width: 56ch;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-top: 0.15rem;
	}
	.tag {
		font-size: 0.66rem;
		letter-spacing: 0.04em;
		padding: 3px 8px;
		border: 1px solid var(--line);
		border-radius: 999px;
		color: var(--ink-muted);
		transition:
			color var(--duration-fast) var(--easing-soft),
			border-color var(--duration-fast) var(--easing-soft);
	}
	a.entry-card:hover .tag {
		color: var(--ink-2);
		border-color: var(--ink-faint);
	}

	.arrow {
		font-size: 1.05rem;
		color: var(--ink-2);
		opacity: 0;
		translate: -4px 4px;
		transition:
			opacity 280ms var(--easing-soft),
			translate 280ms var(--easing-soft),
			transform 280ms var(--easing-soft);
	}
	a.entry-card:hover .arrow {
		opacity: 1;
		translate: 0 0;
	}

	/* Phones: the year column folds away (each card already shows its period). */
	@media (max-width: 620px) {
		.entry {
			grid-template-columns: 1rem 1fr;
			column-gap: 0.6rem;
		}
		.entry-year {
			display: none;
		}
		.entry-card {
			grid-template-columns: auto 1fr;
			padding-inline: 0.5rem;
		}
		.arrow {
			display: none;
		}
	}
</style>

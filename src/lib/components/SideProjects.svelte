<script lang="ts">
	import { onMount } from "svelte";
	import { revealOnView, inView } from "$utils/anime";
	import { revealTitle, revealHint } from "$utils/reveal-presets";
	import { prettify, prettifyTag } from "$utils/text";
	import { languageColor, recencyLabel } from "$utils/format";
	import { fetchApiJson } from "$lib/api/client";
	import { buildSideProjects } from "$lib/api/merge-projects";
	import { projects } from "$data/projects";
	import type { GitHubRepo } from "$types/api/github";

	interface SideProject {
		id: string;
		name: string;
		url: string;
		image: string | null;
		createdAt: string;
		topics: string[];
		primaryLanguage: { name: string; color?: string | null } | null;
		stargazerCount: number;
		isArchived: boolean;
		pushedAt: string;
	}

	interface Props {
		sideProjects: SideProject[];
		error: string | null;
		githubUsername: string;
	}

	let { sideProjects, error, githubUsername }: Props = $props();

	const DESKTOP_INITIAL = 6;
	const MOBILE_INITIAL = 4;
	const MAX_INLINE_REPOS = 24;
	const MAX_TOPICS = 3;
	let isSingleColumn = $state(false);
	let expanded = $state(false);
	let archiveOpen = $state(false);
	let refreshedProjects = $state<SideProject[] | null>(null);
	let retrying = $state(false);
	let now = $state<number | null>(null);

	const allProjects: SideProject[] = $derived(refreshedProjects ?? sideProjects);
	const liveProjects = $derived(allProjects.filter((project) => !project.isArchived));
	const archivedProjects = $derived(allProjects.filter((project) => project.isArchived));
	const showArchive = $derived(archiveOpen || liveProjects.length === 0);
	const displayError = $derived(refreshedProjects === null ? error : null);
	const initialVisible = $derived(isSingleColumn ? MOBILE_INITIAL : DESKTOP_INITIAL);

	const visibleLive = $derived(expanded ? liveProjects : liveProjects.slice(0, initialVisible));
	const hiddenCount = $derived(Math.max(0, liveProjects.length - initialVisible));
	const canToggle = $derived(liveProjects.length > initialVisible);

	async function refreshProjects(signal?: AbortSignal): Promise<void> {
		try {
			const { repos } = await fetchApiJson<{ repos: GitHubRepo[] }>("/api/github", { signal });
			refreshedProjects = buildSideProjects(repos, projects).slice(0, MAX_INLINE_REPOS);
		} catch {}
	}

	async function retry(): Promise<void> {
		retrying = true;
		await refreshProjects();
		retrying = false;
	}

	function starLabel(count: number): string {
		return `${count} star${count === 1 ? "" : "s"} on GitHub`;
	}

	onMount(() => {
		const abortController = new AbortController();
		now = Date.now();
		const mql = window.matchMedia("(max-width: 520px)");
		isSingleColumn = mql.matches;
		const onColChange = (): void => {
			isSingleColumn = mql.matches;
		};
		mql.addEventListener("change", onColChange);
		void refreshProjects(abortController.signal);

		return () => {
			abortController.abort();
			mql.removeEventListener("change", onColChange);
		};
	});
</script>

{#snippet projectCell(sideProject: SideProject, index: number)}
	<li class="cell" class:is-archived={sideProject.isArchived} style="--i: {index}">
		<a class="cell-link" href={sideProject.url} target="_blank" rel="noopener noreferrer" data-cursor="View">
			<span class="cell-top">
				<time class="updated-date" datetime={sideProject.pushedAt}>
					Updated {recencyLabel(sideProject.pushedAt, now)}
				</time>
				<span class="arrow" aria-hidden="true">↗</span>
			</span>
			<h3 class="name">
				{prettify(sideProject.name)}<span class="sr-only">{sideProject.isArchived ? ", archived" : ""} (opens in new tab)</span>
			</h3>
			{#if sideProject.topics.length}
				<ul class="topics" aria-label="Topics">
					{#each sideProject.topics.slice(0, MAX_TOPICS) as topic (topic)}
						<li class="topic">{prettifyTag(topic)}</li>
					{/each}
				</ul>
			{/if}
			<span class="meta">
				{#if sideProject.primaryLanguage}
					<span class="lang">
						<span class="dot" style="background: {sideProject.primaryLanguage.color || languageColor(sideProject.primaryLanguage.name)}"></span>
						{sideProject.primaryLanguage.name}
					</span>
				{/if}
				{#if sideProject.stargazerCount > 0}
					<span class="stars" title={starLabel(sideProject.stargazerCount)}>
						<svg class="star-icon" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
							<path d="M12 2.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 18.9 5.9 21.1l1.4-6.8L2.2 9.6l6.9-.8z" fill="currentColor" />
						</svg>
						{sideProject.stargazerCount}<span class="sr-only"> stars</span>
					</span>
				{/if}
				<span class="year" title="Created">
					<span class="sr-only">Created </span>{new Date(sideProject.createdAt).getFullYear()}
				</span>
			</span>
		</a>
	</li>
{/snippet}

<section id="side-projects" class="side-projects">
	<div class="wrap">
		<header class="head section-head" use:inView>
			<h2 class="section-title" use:revealOnView={revealTitle}>
				Side Projects <span class="badge-soft">(Public)</span>
			</h2>
			<p class="hint" use:revealOnView={revealHint}>
				Pulled live from my public
				<a href="https://github.com/{githubUsername}" target="_blank" rel="noopener" class="ulink"
					>GitHub<span class="sr-only"> (opens in new tab)</span></a
				>, latest first.
			</p>
		</header>

		{#if displayError}
			<div class="empty empty-error" role="status">
				<p>Couldn't reach GitHub to load projects.</p>
				<div class="empty-actions">
					<button type="button" class="toggle" onclick={retry} disabled={retrying}>
						{retrying ? "Trying again…" : "Try again"}
					</button>
					<a href="https://github.com/{githubUsername}" target="_blank" rel="noopener" class="ulink"
						>See them on GitHub<span class="sr-only"> (opens in new tab)</span></a
					>
				</div>
			</div>
		{:else if allProjects.length === 0}
			<p class="empty">No projects to show yet.</p>
		{:else}
			{#if liveProjects.length}
				<ol id="side-projects-grid" class="grid" use:inView>
					{#each visibleLive as sideProject, index (sideProject.id)}
						{@render projectCell(sideProject, index)}
					{/each}
				</ol>
			{/if}

			{#if canToggle || (archivedProjects.length && liveProjects.length)}
				<div class="actions">
					{#if canToggle}
						<button
							type="button"
							class="toggle"
							aria-expanded={expanded}
							aria-controls="side-projects-grid"
							onclick={() => (expanded = !expanded)}
						>
							<span class="toggle-rule" aria-hidden="true"></span>
							<span class="toggle-label">{expanded ? "Show less" : `Show ${hiddenCount} more`}</span>
							<span class="toggle-arrow" class:up={expanded} aria-hidden="true">↓</span>
						</button>
					{/if}
					{#if archivedProjects.length && liveProjects.length}
						<button
							type="button"
							class="toggle toggle-quiet"
							aria-expanded={showArchive}
							aria-controls="side-projects-archive"
							onclick={() => (archiveOpen = !archiveOpen)}
						>
							<span class="toggle-label">{showArchive ? "Hide archive" : `Archive (${archivedProjects.length})`}</span>
							<span class="toggle-arrow" class:up={showArchive} aria-hidden="true">↓</span>
						</button>
					{/if}
				</div>
			{/if}

			{#if showArchive && archivedProjects.length}
				<div class="archive-block">
					<h3 class="archive-title">
						<svg class="archive-icon" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
							<path d="M3 4h18v3H3V4zm1 5h16v11H4V9zm5 2v2h6v-2H9z" fill="currentColor" />
						</svg>
						Archived, no longer maintained
					</h3>
					<ol id="side-projects-archive" class="grid grid-archive" use:inView>
						{#each archivedProjects as sideProject, index (sideProject.id)}
							{@render projectCell(sideProject, index)}
						{/each}
					</ol>
				</div>
			{/if}
		{/if}
	</div>
</section>

<style>
	.side-projects {
		padding-block: clamp(3rem, 6vw, 5rem);
		border-top: 1px solid var(--line);
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--line);
	}
	.section-title {
		font-family: var(--font-display);
		font-size: clamp(1.4rem, 1.1rem + 1vw, 1.85rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		margin-bottom: 1.5rem;
	}
	.head .section-title {
		margin-bottom: 0;
	}
	.hint {
		font-size: 0.9rem;
		color: var(--ink-muted);
	}
	.badge-soft {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--ink-muted);
		margin-left: 0.35rem;
	}
	.empty {
		color: var(--ink-muted);
		font-size: 0.95rem;
	}
	.empty-error {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		padding-block: 1.5rem;
		color: var(--ink-2);
	}
	.empty-actions {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
		font-size: 0.9rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}
	@media (max-width: 820px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 520px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}

	.cell {
		display: flex;
		border: 1px solid var(--line);
		background: var(--bg);
		transition: background 240ms var(--easing-soft);
	}
	/* Only pre-hide for the entrance when scripts run; without JS the grid simply shows. */
	@media (scripting: enabled) {
		.cell {
			opacity: 0;
			transform: scale(0.82);
		}
	}
	.grid:global(.in) .cell {
		animation: cell-in 480ms var(--easing-out) forwards;
		animation-delay: calc(var(--i) * 45ms);
	}
	@keyframes cell-in {
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cell {
			opacity: 1;
			transform: none;
			animation: none;
		}
	}
	.cell:hover,
	.cell:active,
	.cell:focus-within {
		background: var(--bg-elev);
	}
	/* Height follows content; within a row the grid stretches cells so the meta lines align at the bottom. */
	.cell-link {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: 100%;
		padding: 1.15rem 1.3rem 1.2rem;
	}

	.cell-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.updated-date {
		white-space: nowrap;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--ink-muted);
		transition: color 240ms var(--easing-soft);
	}
	.cell:hover .updated-date,
	.cell:focus-within .updated-date {
		color: var(--ink-2);
	}
	.arrow {
		color: var(--ink-2);
		font-size: 0.95rem;
		line-height: 1;
		opacity: 0;
		transform: translate(-3px, 3px);
		transition:
			opacity 240ms var(--easing-soft),
			transform 240ms var(--easing-soft);
	}
	.cell:hover .arrow,
	.cell:active .arrow,
	.cell:focus-within .arrow {
		opacity: 1;
		transform: translate(0, 0);
	}

	.name {
		font-family: var(--font-display);
		font-size: clamp(1.1rem, 0.95rem + 0.5vw, 1.35rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}
	.topics {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.topic {
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
	.cell:hover .topic {
		color: var(--ink-2);
		border-color: var(--ink-faint);
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		margin-top: auto;
		padding-top: 0.35rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--ink-muted);
	}
	.lang {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.stars {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--ink-2);
		flex-shrink: 0;
	}
	.star-icon {
		color: oklch(82% 0.17 88);
		flex-shrink: 0;
	}
	.year {
		margin-left: auto;
		flex-shrink: 0;
	}

	/* Archive: same cells, quieter until touched. */
	.archive-block {
		margin-top: clamp(2rem, 4vw, 2.75rem);
	}
	.archive-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-muted);
	}
	.archive-icon {
		color: oklch(72% 0.13 65);
		flex-shrink: 0;
	}
	.grid-archive .cell {
		background: transparent;
	}
	.grid-archive .name {
		color: var(--ink-2);
	}
	.grid-archive .cell:hover .name,
	.grid-archive .cell:focus-within .name {
		color: var(--ink);
	}

	.actions {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 2rem;
	}
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.85rem;
		min-height: 44px;
		padding: 0 1.1rem;
		background: transparent;
		border: 1px solid var(--line);
		color: var(--ink-2);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		cursor: pointer;
		transition:
			color 240ms var(--easing-soft),
			border-color 240ms var(--easing-soft),
			background 240ms var(--easing-soft);
	}
	.toggle:hover {
		color: var(--ink);
		border-color: var(--line-strong);
		background: var(--bg-elev);
	}
	.toggle:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
	.toggle:disabled {
		cursor: progress;
		opacity: 0.7;
	}
	.toggle-quiet {
		border-color: transparent;
		color: var(--ink-muted);
	}
	.toggle-rule {
		display: inline-block;
		width: 24px;
		height: 1px;
		background: currentColor;
		opacity: 0.4;
		transition:
			width 320ms var(--easing-soft),
			opacity 240ms var(--easing-soft);
	}
	.toggle:hover .toggle-rule {
		width: 40px;
		opacity: 0.8;
	}
	.toggle-arrow {
		display: inline-block;
		font-size: 0.85rem;
		line-height: 1;
		transition: transform 360ms var(--easing-soft);
	}
	.toggle-arrow.up {
		transform: rotate(180deg);
	}
</style>

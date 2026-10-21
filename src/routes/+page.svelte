<script lang="ts">
	import Nav from "$components/Nav.svelte";
	import Hero from "$components/Hero.svelte";
	import PartOfWork from "$components/PartOfWork.svelte";
	import SideProjects from "$components/SideProjects.svelte";
	import TechSkills from "$components/TechSkills.svelte";
	import About from "$components/About.svelte";
	import Contact from "$components/Contact.svelte";
	import Footer from "$components/Footer.svelte";
	import SectionIndex from "$components/SectionIndex.svelte";
	import YearBadge from "$components/YearBadge.svelte";

	let { data } = $props();

	const hasAbout = $derived(data.personalInfo.longBio.trim() !== "");
	const currentRoles = $derived(
		data.partOfWork
			.filter((item) => item.end === "Present")
			.map((item) => ({ name: item.name, role: item.role, start: item.start, url: item.url })),
	);
	const latestPush = $derived.by(() => {
		const live = data.sideProjects.filter((project) => !project.isArchived);
		const pool = live.length ? live : data.sideProjects;
		const latest = pool.reduce<(typeof pool)[number] | null>(
			(best, project) => (!best || Date.parse(project.pushedAt) > Date.parse(best.pushedAt) ? project : best),
			null,
		);
		return latest ? { name: latest.name, url: latest.url, pushedAt: latest.pushedAt } : null;
	});
</script>

<svelte:head>
	<title>{data.personalInfo.name}</title>
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>
<Nav name={data.personalInfo.name} handle={data.personalInfo.handle} {hasAbout} />
<SectionIndex />
<YearBadge />

<main id="main" tabindex="-1">
	<Hero
		name={data.personalInfo.name}
		handle={data.personalInfo.handle}
		role={data.personalInfo.role}
		location={data.personalInfo.location}
		bio={data.personalInfo.bio}
		email={data.personalInfo.email}
		{currentRoles}
		{latestPush}
	/>
	<PartOfWork partOfWork={data.partOfWork} />
	<SideProjects sideProjects={data.sideProjects} error={data.sideProjectsError} githubUsername={data.username} />
	<TechSkills />
	{#if hasAbout}
		<About role={data.personalInfo.role} location={data.personalInfo.location} longBio={data.personalInfo.longBio} />
	{/if}
	<Contact email={data.personalInfo.email} socials={data.personalInfo.socials} />
</main>

<Footer name={data.personalInfo.name} />

<style>
	:global(.ulink) {
		border-bottom: 1px solid var(--line-strong);
		transition:
			color var(--duration-fast) var(--easing-soft),
			border-color var(--duration-fast) var(--easing-soft);
	}
	/* The underline carries the accent; small text stays ink (vermilion text is 3.6:1 here). */
	:global(.ulink:hover) {
		color: var(--ink);
		border-color: var(--accent);
	}
</style>

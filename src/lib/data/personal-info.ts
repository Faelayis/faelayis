import { siDiscord, siGithub, siX } from "simple-icons";
import type { PersonalInfo } from "$types/data/personal-info";

export const personalInfo: PersonalInfo = {
	name: "Fae",
	handle: "Faelayis",
	role: "Developer",
	location: "Chiang Mai, Thailand",
	email: "faelayis@proton.com",
	bio: "",
	longBio: "",
	socials: [
		{ label: "GitHub", url: "https://github.com/faelayis", handle: "faelayis", icon: siGithub },
		{ label: "Discord", url: "https://discord.com/users/328731868096888833", icon: siDiscord },
		{ label: "Twitter", url: "https://twitter.com/Faelayis", handle: "@Faelayis", icon: siX },
		// { label: "Telegram", url: "https://t.me/Faelayis", icon: siTelegram },
		// { label: "Read.cv", url: "https://read.cv/faelayis", icon: siReaddotcv },
	],
};

import type { Handle } from "@sveltejs/kit";

const LINK_PREVIEW_BOTS =
	/facebookexternalhit|Facebot|Twitterbot|Slackbot|Discordbot|TelegramBot|WhatsApp|LinkedInBot|SkypeUriPreview|vkShare|Pinterest|redditbot|Iframely|Embedly|Bitlybot|Linespider/i;

export const handle: Handle = async ({ event, resolve }) => {
	const useragent = event.request.headers.get("user-agent") ?? "";

	if (LINK_PREVIEW_BOTS.test(useragent)) {
		return new Response(null, { status: 404 });
	}

	const response = await resolve(event);

	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("Referrer-Policy", "no-referrer");
	response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
	response.headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=(), bluetooth=(), display-capture=(), accelerometer=(), gyroscope=()"
	);

	return response;
};

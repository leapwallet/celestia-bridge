import { APP_ORIGIN } from "./constants";

const defaultSocialPreview = "social/home.jpg";

const getSMOTags = (
	title: string,
	description: string,
	socialPreview: string,
	url: string,
) => {
	return {
		title,
		description,
		images: [socialPreview],
		type: "website",
		url,
	};
};

export const getMetadata = (
	title: string,
	description: string,
	url = "",
	socialPreview = defaultSocialPreview,
) => {
	const pageUrl = `${APP_ORIGIN}/${url}`;
	const socialPreviewUrl = `${APP_ORIGIN}/${socialPreview}`;

	return {
		title,
		description,
		openGraph: getSMOTags(title, description, socialPreviewUrl, pageUrl),
		twitter: getSMOTags(title, description, socialPreviewUrl, pageUrl),
	};
};

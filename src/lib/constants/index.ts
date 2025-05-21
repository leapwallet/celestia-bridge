export const APP_ORIGIN = `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}`;

export const cosmoshubChainId = "cosmoshub-4";

export const walletConnectOptions = {
	projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
	metadata: {
		name: "Bridge Page",
		description: "",
		url: APP_ORIGIN,
		icons: [`${APP_ORIGIN}/icon.png`],
	},
};

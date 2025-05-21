import { default as tailwindConfig } from "@leapwallet/ribbit-react/tailwind-config";
import deepmerge from "deepmerge";
import type { Config } from "tailwindcss";

const config: Config = {
	...tailwindConfig,
	content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
	plugins: Array.isArray(tailwindConfig.plugins)
		? [...tailwindConfig.plugins, import("tailwindcss-animate")]
		: [import("tailwindcss-animate")],
	theme: deepmerge(tailwindConfig.theme, {
		extend: {
			screens: {
				xs: "480px",
			},
			keyframes: {
				marquee: {
					from: {
						transform: "translateX(0)",
					},
					to: {
						transform: "translateX(calc(-100% - var(--gap)))",
					},
				},
				"marquee-vertical": {
					from: {
						transform: "translateY(0)",
					},
					to: {
						transform: "translateY(calc(-100% - var(--gap)))",
					},
				},
				"flow-gradient": {
					"0%": { backgroundPosition: "200% 0%" },
					"100%": { backgroundPosition: "-200% 0%" },
				},
			},
			animation: {
				marquee: "marquee var(--duration) infinite linear",
				"marquee-vertical": "marquee-vertical var(--duration) linear infinite",
				"flow-gradient": "flow-gradient 2s linear infinite",
			},
		},
	}),
};

export default config;

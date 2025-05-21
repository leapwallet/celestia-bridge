import { create } from "zustand/react";
import { persist } from "zustand/middleware";

export const useColorScheme = create(
	persist<{
		colorScheme: "dark" | "light";
		setColorScheme: (colorScheme: "dark" | "light") => void;
	}>(
		(set) => ({
			colorScheme: "dark",
			setColorScheme: (colorScheme) => {
				if (colorScheme === "dark") {
					document.body.classList.add("dark");
				} else {
					document.body.classList.remove("dark");
				}
				set({ colorScheme });
			},
		}),
		{
			name: "color-scheme",
		},
	),
);

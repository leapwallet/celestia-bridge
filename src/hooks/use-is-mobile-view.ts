import { useMediaQuery } from "use-media-query-react";

export function useIsMobileView() {
	const isMobile = useMediaQuery("(max-width: 768px)");

	return { isMobile } as const;
}

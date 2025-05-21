"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@leapwallet/ribbit-react";

export function NavLink({
	href,
	children,
	onClick,
}: { href: string; children: React.ReactNode; onClick?: () => void }) {
	const pathname = usePathname();

	return (
		<Link
			href={href}
			className={cn(
				"flex items-center gap-1.5 text-foreground/70 border border-transparent px-2 py-1 rounded-xs transition-all hover:bg-secondary",
				pathname === href && "text-foreground bg-secondary border-border",
			)}
			onClick={onClick}
		>
			{children}
		</Link>
	);
}

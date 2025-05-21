"use client";

import { useGlobalConfig } from "@/contexts/global-config";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEmbeddedWalletState } from "@/store";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@leapwallet/ribbit-react";
import { DotsThreeVertical, Moon, Sun, Wallet } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";

function ColorSchemeToggleMenuItem() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <DropdownMenuItem
      className="gap-2 p-2"
      onClick={() => setColorScheme(colorScheme === "dark" ? "light" : "dark")}
    >
      {colorScheme === "dark" ? <Sun weight="bold" /> : <Moon weight="bold" />}
      <span>{colorScheme === "dark" ? "Light" : "Dark"} Mode</span>
    </DropdownMenuItem>
  );
}

const DynamicEmbeddedWallet = dynamic(() => import("../embedded-wallet"), {
  ssr: false,
});

const DisplayLogo = () => {
  const { chain } = useGlobalConfig();
  const { colorScheme } = useColorScheme();

  const logoPath = useMemo(() => {
    if (chain === "celestia") {
      return  colorScheme ==="dark" ? "/logos/celestia-dark.svg" : "/logos/celestia.svg"
    } else if (chain === "eclipse") {
      return  colorScheme ==="dark" ? "/logos/eclipse.svg" : "/logos/eclipse-dark.svg";
    } else if (chain === "forma") {
      return "/logos/forma.png";
    } return undefined
  }, [chain, colorScheme]);

  return (
    <Link href="/" className="inline-block rounded-xs pr-1 shrink-0">
      {logoPath ? (
        <img
          src={logoPath}
          alt="bridge logo"
          className="h-8"
          height={32}
        />
      ) : (
        <p className="">Celestia Bridge</p>
      )}
    </Link>
  )

}

export function AppHeader() {
  const { connectedWallets } = useGlobalConfig();
  const { isEmbedWalletOpen, setEmbedWalletOpen } = useEmbeddedWalletState();

  return (
    <>
      <DynamicEmbeddedWallet
        isEmbedWalletOpen={isEmbedWalletOpen}
        setEmbedWalletOpen={setEmbedWalletOpen}
      />

      <header className="flex items-center justify-between px-6 py-3 xs:border-b bg-transparent z-[5] absolute w-full">
        <nav className="flex items-center gap-10">
          <DisplayLogo />
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-[2.125rem] w-[2.125rem]"
              >
                <DotsThreeVertical />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 rounded-lg w-[12rem]">
              <DropdownMenuSeparator className="md:hidden" />
              <ColorSchemeToggleMenuItem />
              <DropdownMenuItem
                disabled={connectedWallets.length === 0}
                className="gap-2 p-2 md:hidden"
                onClick={() => setEmbedWalletOpen(!isEmbedWalletOpen)}
              >
                <Wallet weight="bold" />
                <span>View Wallet Balance</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}

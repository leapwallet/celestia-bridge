import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { AppWrapper } from "@/components/app-wrapper";

import "@leapwallet/connect-kit-react/styles.css";
import "@leapwallet/elements/styles.css";
import "@leapwallet/embedded-wallet-sdk-react/styles.css";
import "@leapwallet/ribbit-react/styles.css";
import "./globals.css";
import { AppWrapperParent } from "@/components/app-wrapper-parent";

const facIconMap: Record<string, string> = {
  "forma": "/favicons/forma.webp",
  "eclipse": "/favicons/eclipse.svg",
  "celestia": "/favicons/celestia.ico",
}

// get static metadata based on the chain
 function getStaticMetadata() {
  const chain = process.env.NEXT_PUBLIC_CHAIN;
  switch (chain) {
    case "celestia":
      return {
        title: "Celestia Bridge",
        description: "Celestia Bridge",
      };
    case "eclipse": 
      return {
        title: "Eclipse Bridge",
        description: "Eclipse Bridge",
      };
    case 'forma': 
      return {
        title: "Forma Bridge",
        description: "Forma Bridge",
      };
    default: {
      return {
        title: "Celestia Bridge",
        description: "Celestia Bridge",
      };
    }
  }
}

export const metadata: Metadata = getStaticMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chain = process.env.NEXT_PUBLIC_CHAIN;

  return (
    <html lang="en">
      <head>
        <meta name="apple-itunes-app" content="app-id=1642465549"></meta>
        <link rel="shortcut icon" href={facIconMap[chain as string]} />
      </head>
      <body
        className={`leap-ui dark ${chain} ${GeistSans.variable} ${GeistMono.variable}`}
      >
        <AppWrapperParent>
          <AppWrapper>{children}</AppWrapper>
        </AppWrapperParent>
      </body>
    </html>
  );
}

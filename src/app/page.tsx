"use client";

import { AppHeader } from "@/components/header";
import { ElementsContainer } from "./elements-container";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function Home() {
  return (
    <NuqsAdapter>
      <AppHeader />
      <div className="py-[8rem] flex flex-col items-center justify-center">
        <ElementsContainer />
      </div>
    </NuqsAdapter>
  );
}

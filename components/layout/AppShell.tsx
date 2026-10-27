import type { ReactNode } from "react";
import { ShortcutsDialog } from "@/components/common/ShortcutsDialog";
import { TopBar } from "./TopBar";
import { MobileNav, Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg">
        Skip to content
      </a>
      <ShortcutsDialog />
      <Sidebar />
      <MobileNav />
      <div className="overflow-x-clip lg:pl-60">
        <TopBar />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-6 outline-none sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </>
  );
}

import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { MobileNav, Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg">
        Skip to content
      </a>
      <Sidebar />
      <MobileNav />
      <div className="lg:pl-60">
        <div className="no-print absolute right-4 top-16 z-10 lg:right-8 lg:top-5">
          <LanguageSwitcher />
        </div>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-24 outline-none sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </>
  );
}

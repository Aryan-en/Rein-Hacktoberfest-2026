import { HeroArt } from "./HeroArt";
import { SessionMix } from "./SessionMix";
import { ui } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function HeroBanner({ lang }: { lang: Lang }) {
  return (
    <div className="relative min-h-[250px] sm:min-h-[270px]">
      <div aria-hidden className="pointer-events-none absolute inset-y-[-24px] right-0 w-full max-w-[760px] opacity-50 [mask-image:linear-gradient(to_left,black_55%,transparent)] sm:opacity-80 lg:w-[46%]">
        <HeroArt />
      </div>
      <SessionMix lang={lang} />
      <header className="relative z-10 max-w-[760px] pt-4 lg:pt-14">
        <h1 className="text-[clamp(1.9rem,3vw,2.5rem)] font-bold leading-[1.12] tracking-tight">
          {lang === "hi" ? (
            <>
              <span className="text-high">ठगी</span> पकड़ें। <span className="text-accent">फ़िशिंग</span> बेनकाब करें।
              <br />एक कदम आगे रहें।
            </>
          ) : (
            <>
              Detect <span className="text-high">Scams.</span> Expose <span className="text-accent">Phishing.</span>
              <br />Stay One Step Ahead.
            </>
          )}
        </h1>
        <p className="mt-3 text-base text-[#cbd5e1] sm:text-lg">{ui("heroSub", lang)}</p>
      </header>
    </div>
  );
}

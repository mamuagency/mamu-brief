import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Moon, Sun, Languages, ShieldCheck, ArrowDown } from "lucide-react";
import { dict, type Lang } from "@/lib/i18n";
import { emptyBrief, type BriefDraft } from "@/lib/brief";
import { BriefForm } from "@/components/brief/BriefForm";
import { SOCIAL_ITEMS } from "@/lib/socials";
import logoDark from "@/assets/mamu-logo-dark-text.png";
import logoLight from "@/assets/mamu-logo-light-text.png";
import emblem from "@/assets/mamu-emblem.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAMU Brand Identity Brief | Logo & Visual Identity" },
      {
        name: "description",
        content:
          "Tell MAMU Agency about your business, audience and creative direction to start your logo and visual identity project.",
      },
      { property: "og:title", content: "MAMU Brand Identity Brief" },
      {
        property: "og:description",
        content: "Start your logo and visual identity project with MAMU Agency.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type View = "landing" | "form" | "success";
type RocketState = "idle" | "launching" | "gone";

/** اتجاه الطيران: متغيرات CSS بتتحدد عشوائيًا في كل إقلاع */
type Flight = { x: string; y: string; rot: string };

const FLY_DISTANCE_VMAX = 150;

// اهتزاز (1s) + طيران (1s delay + 1.5s) = 2.5s، والاحتياطي أطول منهم
const ROCKET_FALLBACK_MS = 3500;

// اتجاه عشوائي لفوق: من 12° لـ 70° يمين أو شمال من الرأسي
function randomFlight(): Flight {
  const side = Math.random() < 0.5 ? -1 : 1;
  const deg = side * (12 + Math.random() * 58);
  const rad = (deg * Math.PI) / 180;
  return {
    x: `${(Math.sin(rad) * FLY_DISTANCE_VMAX).toFixed(1)}vmax`,
    y: `${(-Math.cos(rad) * FLY_DISTANCE_VMAX).toFixed(1)}vmax`,
    rot: `${deg.toFixed(1)}deg`,
  };
}

// بيستخدم بس في السكرول السلس، مش في الصاروخ
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// useLayoutEffect على المتصفح (قبل أول رسم)، و useEffect على السيرفر عشان ميطلعش تحذير
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function Index() {
  const [lang, setLang] = useState<Lang>("en");
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BriefDraft>(emptyBrief);
  const [refId, setRefId] = useState("");
  const [rocket, setRocket] = useState<RocketState>("idle");
  const [flight, setFlight] = useState<Flight>({
    x: "0vmax",
    y: "-150vmax",
    rot: "0deg",
  });

  // يمنع onRocketGone من التنفيذ مرتين (أنيميشن + مؤقت احتياطي)
  const goneHandled = useRef(false);

  const t = dict[lang];

  // قراءة اللغة والثيم المحفوظين (مرة واحدة، قبل أول رسم)
  useIsoLayoutEffect(() => {
    try {
      const savedLang = localStorage.getItem("mamu-lang");
      const savedTheme = localStorage.getItem("mamu-theme");

      if (savedLang === "ar" || savedLang === "en") {
        setLang(savedLang);
      }

      const isDark =
        savedTheme === "dark" ||
        (savedTheme !== "light" && document.documentElement.classList.contains("dark"));

      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {
      /* storage unavailable */
    }
    setReady(true);
  }, []);

  // تطبيق وحفظ اللغة: بعد ما القراءة تخلص بس
  useEffect(() => {
    if (!ready) return;
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("mamu-lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang, ready]);

  // Scroll to the form only after it has actually been rendered
  useEffect(() => {
    if (view !== "form") return;
    document.getElementById("brief-section")?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, [view]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("mamu-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };

  const openForm = useCallback(() => {
    setData({ ...emptyBrief, draftId: crypto.randomUUID() });
    setStep(1);
    setView("form");
  }, []);

  // بتتنادى لما الصاروخ يخرج من الشاشة: وقتها بس بتفتح الفورم
  const onRocketGone = useCallback(() => {
    if (goneHandled.current) return;
    goneHandled.current = true;
    setRocket("gone");
    openForm();
  }, [openForm]);

  // مؤقت احتياطي: لو animationend ماحصلش (مثلًا التاب في الخلفية)
  useEffect(() => {
    if (rocket !== "launching") return;
    const id = window.setTimeout(onRocketGone, ROCKET_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [rocket, onRocketGone]);

  const start = () => {
    // Already launching: ignore repeated clicks
    if (rocket === "launching") return;

    // Rocket already flew away: just open the form
    if (rocket === "gone") {
      openForm();
      return;
    }

    // اتجاه عشوائي جديد في كل إقلاع، وبعدها الصاروخ يهتز ثم يطير
    goneHandled.current = false;
    setFlight(randomFlight());
    setRocket("launching");
  };

  const home = () => {
    // لو الصاروخ لسه طاير وضغط Home، نشيله من غير ما نفتح الفورم
    if (rocket === "launching") {
      goneHandled.current = true;
      setRocket("gone");
    }
    setData(emptyBrief);
    setStep(1);
    setView("landing");
    // Rocket state is NOT reset: it only comes back on page refresh
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-glow" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <button onClick={home} aria-label="MAMU" className="rounded-md">
          <img
            src={dark ? logoLight : logoDark}
            alt="MAMU Agency"
            className="h-16 w-16 object-contain sm:h-20 sm:w-20"
          />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            aria-label={t.langSwitchLabel}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Languages className="size-4" aria-hidden />
            <span lang={lang === "ar" ? "en" : "ar"}>{t.langSwitch}</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label={dark ? t.themeLight : t.themeDark}
            className="grid size-10 place-items-center rounded-full border transition-colors hover:bg-accent"
          >
            {dark ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {view === "success" ? (
          <Success t={t} refId={refId} onHome={home} />
        ) : (
          <>
            <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 sm:px-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:pt-16">
              <div className="animate-launch space-y-7">
                <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-lime" aria-hidden />
                  {t.eyebrow}
                </p>

                <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                  {t.heroTitle.split(" ").slice(0, -2).join(" ")}{" "}
                  <span className="text-brand-gradient font-black">
                    {t.heroTitle.split(" ").slice(-2).join(" ")}
                  </span>
                </h1>

                <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {t.heroDesc}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={start}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-8 py-4 text-base font-semibold text-primary-foreground shadow-card transition-transform hover:-translate-y-0.5"
                  >
                    {t.cta}
                    <ArrowDown className="size-4" aria-hidden />
                  </button>

                  <span className="text-sm text-muted-foreground">{t.heroMeta}</span>
                </div>

                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
                  {t.privacy}
                </p>
              </div>

              <Rocket state={rocket} flight={flight} onGone={onRocketGone} />
            </section>

            {view === "form" && (
              <div id="brief-section" className="scroll-mt-4">
                <BriefForm
                  t={t}
                  lang={lang}
                  data={data}
                  setData={setData}
                  step={step}
                  setStep={setStep}
                  onSuccess={(id) => {
                    setRefId(id);
                    setView("success");
                    window.scrollTo({ top: 0 });
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* ثابت في كل الصفحات (landing / form / success) */}
      <SocialFooter />
    </div>
  );
}

function SocialFooter() {
  if (SOCIAL_ITEMS.length === 0) return null;

  return (
    <footer className="relative z-10 mt-8 border-t py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 sm:px-8">
        <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {SOCIAL_ITEMS.map((s, i) => (
            <li key={s.href}>
              <a
                href={s.href}
                {...(s.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                aria-label={s.name}
                title={s.name}
                className="social-link grid size-11 place-items-center rounded-full border"
              >
                <span
                  aria-hidden
                  className="animate-social-shake grid place-items-center"
                  style={{ animationDelay: `${i * 0.35}s` }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {s.paths.map((d) => (
                      <path key={d} d={d} />
                    ))}
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground" dir="ltr">
          © {new Date().getFullYear()} MAMU Agency
        </p>
      </div>
    </footer>
  );
}

function Rocket({
  small,
  state = "idle",
  flight,
  onGone,
}: {
  small?: boolean;
  state?: RocketState;
  flight?: Flight;
  onGone?: () => void;
}) {
  const sizeClass = small ? "w-28" : "w-56 sm:w-72";

  // After the rocket has flown away, keep an empty placeholder
  // so the layout doesn't jump, and don't render the rocket again.
  if (state === "gone") {
    return <div aria-hidden className={`relative mx-auto aspect-square ${sizeClass}`} />;
  }

  const launching = state === "launching";

  return (
    <div aria-hidden className={`relative mx-auto ${sizeClass}`}>
      {!launching && (
        <div className="absolute inset-0 rounded-full bg-brand-gradient opacity-15 blur-3xl" />
      )}

      <div className="absolute inset-x-[30%] bottom-0 flex justify-around">
        {[0, 1.3, 2.6].map((d) => (
          <span
            key={d}
            className="block size-1.5 rounded-full bg-lime animate-rise"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>

      {/* طبقة 1: الطفو (بتفضل شغالة لحد ما الصاروخ يختفي، فمفيش قفزة) */}
      <div className="animate-float">
        {/* طبقة 2: الطيران في اتجاه عشوائي */}
        <div
          className={launching ? "rocket-flight" : undefined}
          style={
            launching && flight
              ? ({
                  "--fly-x": flight.x,
                  "--fly-y": flight.y,
                  "--fly-rot": flight.rot,
                } as CSSProperties)
              : undefined
          }
          onAnimationEnd={(e) => {
            // ننتظر نهاية أنيميشن الطيران نفسه (مش الاهتزاز)
            if (launching && e.target === e.currentTarget && e.animationName === "rocket-fly") {
              onGone?.();
            }
          }}
        >
          {/* طبقة 3: اهتزاز الاستعداد */}
          <img
            src={emblem}
            alt=""
            className={`relative block w-full ${launching ? "rocket-shake" : ""}`}
          />
        </div>
      </div>
    </div>
  );
}

function Success({
  t,
  refId,
  onHome,
}: {
  t: (typeof dict)["en"];
  refId: string;
  onHome: () => void;
}) {
  return (
    <section
      className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center sm:px-8"
      aria-live="polite"
    >
      <div className="animate-launch">
        <Rocket small />
      </div>

      <h1 className="mt-10 text-3xl font-semibold tracking-tight sm:text-4xl">{t.successTitle}</h1>

      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.successMsg}</p>

      {refId && (
        <p className="mt-6 rounded-full border bg-card px-4 py-1.5 text-xs text-muted-foreground">
          {t.reference}:{" "}
          <span dir="ltr" className="font-mono text-foreground">
            {refId.slice(0, 8).toUpperCase()}
          </span>
        </p>
      )}

      <button
        onClick={onHome}
        className="mt-10 rounded-full bg-brand-gradient px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t.home}
      </button>
    </section>
  );
}

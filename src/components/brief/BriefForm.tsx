import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Pencil, AlertCircle, ImagePlus, X } from "lucide-react";
import type { Dict, Lang } from "@/lib/i18n";
import {
  APP_CATEGORIES,
  ATTRIBUTES,
  BUDGETS,
  LOGO_LANGS,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  MAX_STYLES,
  SERVICES,
  STAGES,
  STYLES,
  YESNO,
  validateStep,
  type BriefDraft,
} from "@/lib/brief";
import {
  CategoryGroup,
  ChoiceGroup,
  Field,
  TextArea,
  TextInput,
} from "./fields";
import { cn } from "@/lib/utils";

const TOTAL = 6;

// الإيميل اللي هتوصله البريفات (بدّل النص ده بإيميلك الحقيقي)
const FORMSUBMIT_EMAIL = "mamuagency@gmail.com";
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${FORMSUBMIT_EMAIL}`;

type Picked = { id: string; file: File; url: string };

/** تصغير الصورة قبل الرفع عشان المساحة المجانية ما تخلصش بسرعة */
async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", 0.8),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** يبعت الصور في رسالة منفصلة عن طريق فورم عادي مخفي (الطريقة اللي FormSubmit بيدعمها للمرفقات) */
function sendImagesByForm(
  files: File[],
  fields: Record<string, string>,
): Promise<void> {
  return new Promise((resolve) => {
    const frameName = `fs-frame-${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = frameName;
    iframe.style.display = "none";

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `https://formsubmit.co/${FORMSUBMIT_EMAIL}`;
    form.enctype = "multipart/form-data";
    form.target = frameName;
    form.style.display = "none";

    const add = (name: string, value: string) => {
      const i = document.createElement("input");
      i.type = "hidden";
      i.name = name;
      i.value = value;
      form.appendChild(i);
    };
    add("_captcha", "false");
    add("_template", "table");
    for (const [k, v] of Object.entries(fields)) add(k, v);

    files.forEach((f, i) => {
      const input = document.createElement("input");
      input.type = "file";
      input.name = `image_${i + 1}`;
      const dt = new DataTransfer();
      dt.items.add(f);
      input.files = dt.files;
      form.appendChild(input);
    });

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.setTimeout(() => {
        iframe.remove();
        form.remove();
      }, 500);
      resolve();
    };
    iframe.addEventListener("load", finish);
    window.setTimeout(finish, 20000);

    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
  });
}

export function BriefForm({
  t,
  lang,
  data,
  setData,
  step,
  setStep,
  onSuccess,
}: {
  t: Dict;
  lang: Lang;
  data: BriefDraft;
  setData: (d: BriefDraft) => void;
  step: number;
  setStep: (n: number) => void;
  onSuccess: (id: string) => void;
}) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof BriefDraft, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [imgError, setImgError] = useState<string | null>(null);

  const addImages = async (files: FileList | File[]) => {
    setImgError(null);
    let count = picked.length;
    const added: Picked[] = [];
    for (const f of Array.from(files)) {
      if (count >= MAX_IMAGES) {
        setImgError(t.err.uploadCount);
        break;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        setImgError(t.err.uploadType);
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        setImgError(t.err.uploadSize);
        continue;
      }
      const small = await shrink(f);
      added.push({
        id: crypto.randomUUID(),
        file: small,
        url: URL.createObjectURL(small),
      });
      count++;
    }
    if (added.length) setPicked((p) => [...p, ...added]);
  };

  const removeImage = (id: string) => {
    setPicked((p) => {
      const hit = p.find((x) => x.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return p.filter((x) => x.id !== id);
    });
  };

  const Prev = lang === "ar" ? ArrowRight : ArrowLeft;
  const Next = lang === "ar" ? ArrowLeft : ArrowRight;

  const set = <K extends keyof BriefDraft>(
    k: K,
    v: BriefDraft[K],
  ) => {
    setData({ ...data, [k]: v });

    if (errors[k]) {
      setErrors({ ...errors, [k]: undefined });
    }
  };

  const errText = (k: keyof BriefDraft) =>
    errors[k] ? errors[k] : undefined;

  const check = (s: number) => {
    const e = validateStep(s, data);

    const mapped: Partial<Record<keyof BriefDraft, string>> = {};

    for (const [key, value] of Object.entries(e)) {
      if (value) {
        mapped[key as keyof BriefDraft] =
          t.err[value] ?? t.err.fix;
      }
    }

    setErrors(mapped);

    if (Object.keys(e).length > 0) {
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>(
          '[aria-invalid="true"], [role="alert"]',
        );

        first?.focus?.();
        first?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      });

      return false;
    }

    return true;
  };

  const goto = (n: number) => {
    setSubmitError(null);
    setStep(n);

    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const next = () => {
    if (check(step)) {
      goto(step + 1);
    }
  };

  const submit = async () => {
    if (inFlight.current) return;

    for (let s = 1; s <= TOTAL; s++) {
      const stepErrors = validateStep(s, data);

      if (Object.keys(stepErrors).length > 0) {
        if (s !== step) {
          goto(s);
        }

        window.setTimeout(() => check(s), 50);
        return;
      }
    }

    inFlight.current = true;
    setSending(true);
    setSubmitError(null);

    try {
      // لو بوت ملا الحقل المخفي، نتظاهر بالنجاح ومنبعتش حاجة
      if (data.website) {
        onSuccess(data.draftId);
        return;
      }

      const one = <K extends string>(map: Record<K, string>, v: K | "") =>
        v ? map[v] : "";
      const many = <K extends string>(map: Record<K, string>, v: K[]) =>
        v.map((x) => map[x]).join(", ");

      const lines: [string, string][] = [
        [t.f.fullName, data.fullName],
        [t.f.email, data.email],
        [t.f.brandName, data.brandName],
        [t.f.phone, data.phone],
        [t.f.industry, data.industry],
        [t.f.products, data.products],
        [t.f.audience, data.audience],
        [t.f.stage, one(t.o.stage, data.stage)],
        [t.f.website, data.websiteUrl],
        [t.f.socialLinks, data.socialLinks],
        [
          t.f.services,
          many(t.o.services, data.services) +
            (data.servicesOther ? ` — ${data.servicesOther}` : ""),
        ],
        [t.f.nameFinal, one(t.o.yesno, data.nameFinal)],
        [
          t.f.logoLang,
          one(t.o.logoLang, data.logoLang) +
            (data.logoLangOther ? ` — ${data.logoLangOther}` : ""),
        ],
        [t.f.attributes, many(t.o.attributes, data.attributes)],
        [t.f.styles, many(t.o.style, data.styles)],
        [t.f.colorsLike, data.colorsLike],
        [t.f.colorsAvoid, data.colorsAvoid],
        [t.f.references, data.references],
        [t.f.elements, data.elements],
        [
          t.f.applications,
          many(t.o.applications, data.applications) +
            (data.applicationsOther ? ` — ${data.applicationsOther}` : ""),
        ],
        [t.f.budget, one(t.o.budget, data.budget)],
        [t.f.deadline, data.deadline],
        [t.f.notes, data.notes],
        [t.f.extraLinks, data.extraLinks],
      ];

      const message = lines
        .filter(([, v]) => v && v.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n\n");

      const ref = data.draftId.slice(0, 8).toUpperCase();
      const brand = data.brandName;

      const imgNote =
        picked.length > 0
          ? `\n\n📎 الصور المرجعية (${picked.length}): ` +
            picked.map((p) => p.file.name).join(", ") +
            `\nستصلك الصور في رسالة منفصلة عنوانها "صور البريف - ${brand} (${ref})"`
          : "";

      // 1) البريف نفسه (نص) — ده الأساسي ومضمون
      const fd = new FormData();
      fd.append("_subject", `بريف جديد - ${brand}`);
      fd.append("_template", "table");
      fd.append("_captcha", "false");
      fd.append("name", data.fullName);
      fd.append("email", data.email);
      fd.append("message", message + imgNote);

      const res = await fetch(FORMSUBMIT_URL, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });

      let ok = res.ok;
      try {
        const j = await res.json();
        ok = ok && (j.success === true || j.success === "true");
      } catch {
        /* ignore */
      }

      if (!ok) {
        setSubmitError(t.err.send_failed);
        return;
      }

      // 2) الصور في رسالة منفصلة (لو فشلت، البريف وصل فعلاً)
      if (picked.length > 0) {
        try {
          await sendImagesByForm(
            picked.map((p) => p.file),
            {
              _subject: `صور البريف - ${brand} (${ref})`,
              name: data.fullName,
              email: data.email,
              message: `الصور المرجعية للبريف رقم ${ref} من ${data.fullName}`,
            },
          );
        } catch {
          /* ignore */
        }
      }

      onSuccess(data.draftId);
    } catch {
      setSubmitError(t.err.network);
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  const opt = t.optional;
  const needsLinks =
    data.stage === "established" || data.stage === "rebrand";

  return (
    <section
      ref={topRef}
      id="brief"
      className="scroll-mt-24 mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8"
    >
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span>{t.stepOf(step, TOTAL)}</span>
          <span>{Math.round((step / TOTAL) * 100)}%</span>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-valuenow={step}
          aria-label={t.stepOf(step, TOTAL)}
        >
          <div
            className="h-full rounded-full bg-lime transition-all duration-500"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>

        <ol className="mt-4 hidden grid-cols-6 gap-2 sm:grid">
          {t.steps.map((label, i) => {
            const n = i + 1;
            const done = n < step;

            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={n > step}
                  onClick={() => goto(n)}
                  aria-current={n === step ? "step" : undefined}
                  className={cn(
                    "w-full rounded-md py-1 text-xs transition-colors disabled:cursor-not-allowed",
                    n === step
                      ? "font-semibold text-foreground"
                      : done
                        ? "text-primary hover:underline"
                        : "text-muted-foreground/60",
                  )}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div
        key={step}
        className="rounded-2xl border bg-card p-6 shadow-card animate-in fade-in slide-in-from-bottom-2 duration-500 sm:p-10"
      >
        <header className="mb-8 space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.stepTitles[step - 1]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.stepIntros[step - 1]}
          </p>
        </header>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();

            if (step < TOTAL) {
              next();
            } else {
              void submit();
            }
          }}
          className="space-y-7"
        >
          {/* Honeypot */}
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={data.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </label>
          </div>

          {/* Step 1: Contact */}
          {step === 1 && (
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                id="fullName"
                label={t.f.fullName}
                error={errText("fullName")}
              >
                <TextInput
                  id="fullName"
                  autoComplete="name"
                  value={data.fullName}
                  invalid={!!errors.fullName}
                  maxLength={100}
                  aria-describedby={
                    errors.fullName ? "fullName-error" : undefined
                  }
                  onChange={(e) => set("fullName", e.target.value)}
                />
              </Field>

              <Field
                id="email"
                label={t.f.email}
                error={errText("email")}
              >
                <TextInput
                  id="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={data.email}
                  invalid={!!errors.email}
                  maxLength={255}
                  aria-describedby={
                    errors.email ? "email-error" : undefined
                  }
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>

              <Field
                id="brandName"
                label={t.f.brandName}
                error={errText("brandName")}
              >
                <TextInput
                  id="brandName"
                  value={data.brandName}
                  invalid={!!errors.brandName}
                  maxLength={150}
                  aria-describedby={
                    errors.brandName ? "brandName-error" : undefined
                  }
                  onChange={(e) => set("brandName", e.target.value)}
                />
              </Field>

              <Field
                id="phone"
                label={t.f.phone}
                error={errText("phone")}
              >
                <TextInput
                  id="phone"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  value={data.phone}
                  invalid={!!errors.phone}
                  maxLength={40}
                  aria-describedby={
                    errors.phone ? "phone-error" : undefined
                  }
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* Step 2: Business */}
          {step === 2 && (
            <>
              <Field
                id="industry"
                label={t.f.industry}
                error={errText("industry")}
              >
                <TextInput
                  id="industry"
                  value={data.industry}
                  invalid={!!errors.industry}
                  maxLength={150}
                  aria-describedby={
                    errors.industry ? "industry-error" : undefined
                  }
                  onChange={(e) => set("industry", e.target.value)}
                />
              </Field>

              <Field
                id="products"
                label={t.f.products}
                error={errText("products")}
              >
                <TextArea
                  id="products"
                  value={data.products}
                  maxLength={1000}
                  aria-invalid={!!errors.products || undefined}
                  aria-describedby={
                    errors.products ? "products-error" : undefined
                  }
                  onChange={(e) => set("products", e.target.value)}
                />
              </Field>

              <Field
                id="audience"
                label={t.f.audience}
                optional={opt}
                hint={t.f.audienceHint}
              >
                <TextArea
                  id="audience"
                  value={data.audience}
                  maxLength={1000}
                  onChange={(e) => set("audience", e.target.value)}
                />
              </Field>

              <ChoiceGroup
                name="stage"
                legend={t.f.stage}
                optional={opt}
                options={STAGES}
                labels={t.o.stage}
                value={data.stage}
                onChange={(v) =>
                  set("stage", v as BriefDraft["stage"])
                }
              />

              {needsLinks && (
                <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
                  {t.f.linksRequired}
                </p>
              )}

              <Field
                id="websiteUrl"
                label={t.f.website}
                optional={needsLinks ? undefined : opt}
                error={errText("websiteUrl")}
              >
                <TextInput
                  id="websiteUrl"
                  type="url"
                  dir="ltr"
                  placeholder="https://"
                  value={data.websiteUrl}
                  invalid={!!errors.websiteUrl}
                  maxLength={500}
                  aria-describedby={
                    errors.websiteUrl ? "websiteUrl-error" : undefined
                  }
                  onChange={(e) => set("websiteUrl", e.target.value)}
                />
              </Field>

              <Field
                id="socialLinks"
                label={t.f.socialLinks}
                optional={needsLinks ? undefined : opt}
                hint={t.f.socialLinksHint}
                error={errText("socialLinks")}
              >
                <TextArea
                  id="socialLinks"
                  dir="ltr"
                  rows={2}
                  placeholder="https://"
                  value={data.socialLinks}
                  maxLength={1500}
                  aria-invalid={!!errors.socialLinks || undefined}
                  aria-describedby={
                    errors.socialLinks ? "socialLinks-error" : undefined
                  }
                  onChange={(e) => set("socialLinks", e.target.value)}
                />
              </Field>
            </>
          )}

          {/* Step 3: Services */}
          {step === 3 && (
            <>
              <ChoiceGroup
                name="services"
                legend={t.f.services}
                multiple
                options={SERVICES}
                labels={t.o.services}
                value={data.services}
                onChange={(v) =>
                  set("services", v as BriefDraft["services"])
                }
                error={errText("services")}
              />

              {data.services.includes("other") && (
                <Field
                  id="servicesOther"
                  label={t.f.servicesOther}
                >
                  <TextInput
                    id="servicesOther"
                    value={data.servicesOther}
                    maxLength={300}
                    onChange={(e) =>
                      set("servicesOther", e.target.value)
                    }
                  />
                </Field>
              )}

              <ChoiceGroup
                name="nameFinal"
                legend={t.f.nameFinal}
                optional={opt}
                options={YESNO}
                labels={t.o.yesno}
                value={data.nameFinal}
                onChange={(v) =>
                  set("nameFinal", v as BriefDraft["nameFinal"])
                }
              />

              {(data.services.includes("logo") ||
                data.services.includes("identity")) && (
                <ChoiceGroup
                  name="logoLang"
                  legend={t.f.logoLang}
                  optional={opt}
                  options={LOGO_LANGS}
                  labels={t.o.logoLang}
                  value={data.logoLang}
                  onChange={(v) =>
                    set("logoLang", v as BriefDraft["logoLang"])
                  }
                />
              )}

              {data.logoLang === "other" && (
                <Field
                  id="logoLangOther"
                  label={t.f.logoLangOther}
                  error={errText("logoLangOther")}
                >
                  <TextInput
                    id="logoLangOther"
                    value={data.logoLangOther}
                    invalid={!!errors.logoLangOther}
                    maxLength={200}
                    aria-describedby={
                      errors.logoLangOther
                        ? "logoLangOther-error"
                        : undefined
                    }
                    onChange={(e) =>
                      set("logoLangOther", e.target.value)
                    }
                  />
                </Field>
              )}
            </>
          )}

          {/* Step 4: Creative direction */}
          {step === 4 && (
            <>
              <ChoiceGroup
                name="attributes"
                legend={t.f.attributes}
                hint={t.f.attributesHint}
                optional={opt}
                multiple
                options={ATTRIBUTES}
                labels={t.o.attributes}
                value={data.attributes}
                onChange={(v) =>
                  set("attributes", v as BriefDraft["attributes"])
                }
              />

              <ChoiceGroup
                name="styles"
                legend={t.f.styles}
                hint={t.f.stylesHint}
                optional={opt}
                multiple
                max={MAX_STYLES}
                options={STYLES}
                labels={t.o.style}
                value={data.styles}
                onChange={(v) =>
                  set("styles", v as BriefDraft["styles"])
                }
                error={errText("styles")}
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  id="colorsLike"
                  label={t.f.colorsLike}
                  optional={opt}
                >
                  <TextInput
                    id="colorsLike"
                    value={data.colorsLike}
                    maxLength={300}
                    onChange={(e) =>
                      set("colorsLike", e.target.value)
                    }
                  />
                </Field>

                <Field
                  id="colorsAvoid"
                  label={t.f.colorsAvoid}
                  optional={opt}
                >
                  <TextInput
                    id="colorsAvoid"
                    value={data.colorsAvoid}
                    maxLength={300}
                    onChange={(e) =>
                      set("colorsAvoid", e.target.value)
                    }
                  />
                </Field>
              </div>

              <Field
                id="references"
                label={t.f.references}
                optional={opt}
                hint={t.f.referencesHint}
              >
                <TextArea
                  id="references"
                  value={data.references}
                  maxLength={1500}
                  onChange={(e) => set("references", e.target.value)}
                />
              </Field>

              <Field
                id="referenceImages"
                label={t.f.referenceImages}
                optional={opt}
              >
                <ImagePicker
                  items={picked}
                  onAdd={(f) => void addImages(f)}
                  onRemove={removeImage}
                  error={imgError}
                  t={t}
                />
              </Field>

              <Field
                id="elements"
                label={t.f.elements}
                optional={opt}
              >
                <TextArea
                  id="elements"
                  value={data.elements}
                  maxLength={1000}
                  onChange={(e) => set("elements", e.target.value)}
                />
              </Field>
            </>
          )}

          {/* Step 5: Scope and budget */}
          {step === 5 && (
            <>
              <CategoryGroup
                name="applications"
                legend={t.f.applications}
                hint={t.f.applicationsHint}
                optional={opt}
                categories={APP_CATEGORIES}
                catLabels={t.o.appCats}
                labels={t.o.applications}
                value={data.applications}
                onChange={(v) => set("applications", v)}
              />

              {data.applications.includes("app_other") && (
                <Field
                  id="applicationsOther"
                  label={t.f.applicationsOther}
                >
                  <TextInput
                    id="applicationsOther"
                    value={data.applicationsOther}
                    maxLength={300}
                    onChange={(e) =>
                      set("applicationsOther", e.target.value)
                    }
                  />
                </Field>
              )}

              <ChoiceGroup
                name="budget"
                legend={t.f.budget}
                hint={t.f.budgetHint}
                optional={opt}
                options={BUDGETS}
                labels={t.o.budget}
                value={data.budget}
                onChange={(v) =>
                  set("budget", v as BriefDraft["budget"])
                }
              />

              <Field
                id="deadline"
                label={t.f.deadline}
                optional={opt}
                hint={t.f.deadlineHint}
              >
                <TextInput
                  id="deadline"
                  value={data.deadline}
                  maxLength={300}
                  onChange={(e) => set("deadline", e.target.value)}
                />
              </Field>
            </>
          )}

          {/* Step 6: Notes and review */}
          {step === 6 && (
            <>
              <Field id="notes" label={t.f.notes} optional={opt}>
                <TextArea
                  id="notes"
                  rows={4}
                  value={data.notes}
                  maxLength={2000}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Field>

              <Field
                id="extraLinks"
                label={t.f.extraLinks}
                optional={opt}
              >
                <TextArea
                  id="extraLinks"
                  dir="ltr"
                  rows={2}
                  value={data.extraLinks}
                  maxLength={1000}
                  onChange={(e) => set("extraLinks", e.target.value)}
                />
              </Field>

              <Review
                t={t}
                data={data}
                onEdit={goto}
                imageNames={picked.map((p) => p.file.name).join(", ")}
              />

              <div className="space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-4 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-primary"
                    checked={data.consent}
                    aria-invalid={!!errors.consent || undefined}
                    aria-describedby={
                      errors.consent ? "consent-error" : undefined
                    }
                    onChange={(e) =>
                      set("consent", e.target.checked)
                    }
                  />
                  <span>{t.f.consent}</span>
                </label>

                {errors.consent && (
                  <p
                    id="consent-error"
                    role="alert"
                    className="text-xs font-medium text-destructive"
                  >
                    {errors.consent}
                  </p>
                )}
              </div>
            </>
          )}

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden
              />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => goto(step - 1)}
              disabled={step === 1 || sending}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:invisible"
            >
              <Prev className="size-4" aria-hidden />
              {t.back}
            </button>

            <button
              type="submit"
              disabled={sending}
              aria-busy={sending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-7 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t.sending}
                </>
              ) : step < TOTAL ? (
                <>
                  {t.next}
                  <Next className="size-4" aria-hidden />
                </>
              ) : (
                t.submit
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Review({
  t,
  data,
  onEdit,
  imageNames,
}: {
  t: Dict;
  data: BriefDraft;
  onEdit: (n: number) => void;
  imageNames: string;
}) {
  const one = <K extends string>(
    map: Record<K, string>,
    v: K | "",
  ) => (v ? map[v] : "");

  const many = <K extends string>(map: Record<K, string>, v: K[]) =>
    v.map((x) => map[x]).join(", ");

  const sections: {
    step: number;
    rows: [string, string][];
  }[] = [
    {
      step: 1,
      rows: [
        [t.f.fullName, data.fullName],
        [t.f.email, data.email],
        [t.f.brandName, data.brandName],
        [t.f.phone, data.phone],
      ],
    },
    {
      step: 2,
      rows: [
        [t.f.industry, data.industry],
        [t.f.products, data.products],
        [t.f.audience, data.audience],
        [t.f.stage, one(t.o.stage, data.stage)],
        [t.f.website, data.websiteUrl],
        [t.f.socialLinks, data.socialLinks],
      ],
    },
    {
      step: 3,
      rows: [
        [
          t.f.services,
          many(t.o.services, data.services) +
            (data.servicesOther ? ` — ${data.servicesOther}` : ""),
        ],
        [t.f.nameFinal, one(t.o.yesno, data.nameFinal)],
        [
          t.f.logoLang,
          one(t.o.logoLang, data.logoLang) +
            (data.logoLangOther ? ` — ${data.logoLangOther}` : ""),
        ],
      ],
    },
    {
      step: 4,
      rows: [
        [t.f.attributes, many(t.o.attributes, data.attributes)],
        [t.f.styles, many(t.o.style, data.styles)],
        [t.f.colorsLike, data.colorsLike],
        [t.f.colorsAvoid, data.colorsAvoid],
        [t.f.references, data.references],
        [t.reviewImages, imageNames],
        [t.f.elements, data.elements],
      ],
    },
    {
      step: 5,
      rows: [
        [
          t.f.applications,
          many(t.o.applications, data.applications) +
            (data.applicationsOther
              ? ` — ${data.applicationsOther}`
              : ""),
        ],
        [t.f.budget, one(t.o.budget, data.budget)],
        [t.f.deadline, data.deadline],
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <section
          key={s.step}
          className="rounded-xl border bg-background p-5"
          aria-labelledby={`rev-${s.step}`}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3
              id={`rev-${s.step}`}
              className="text-sm font-semibold"
            >
              {t.stepTitles[s.step - 1]}
            </h3>

            <button
              type="button"
              onClick={() => onEdit(s.step)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-primary hover:bg-accent"
            >
              <Pencil className="size-3" aria-hidden />
              {t.edit}
            </button>
          </div>

          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
            {s.rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="min-w-0 whitespace-pre-wrap break-words">
                  {v?.trim() ? v : t.reviewEmpty}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function ImagePicker({
  items,
  onAdd,
  onRemove,
  error,
  t,
}: {
  items: Picked[];
  onAdd: (f: FileList | File[]) => void;
  onRemove: (id: string) => void;
  error: string | null;
  t: Dict;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onAdd(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          drag
            ? "border-primary bg-accent"
            : "border-input bg-background hover:border-primary/50 hover:bg-accent/50",
        )}
      >
        <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          {t.f.uploadTitle}{" "}
          <span className="font-semibold text-primary underline underline-offset-2">
            {t.f.uploadBrowse}
          </span>
        </p>
        <p className="text-xs text-muted-foreground/70" dir="ltr">
          {t.f.uploadHint}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) onAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((img) => (
            <li
              key={img.id}
              className="relative overflow-hidden rounded-xl border bg-background"
            >
              <img
                src={img.url}
                alt={img.file.name}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                aria-label={`${t.f.removeImage}: ${img.file.name}`}
                className="absolute end-2 top-2 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
              <p
                className="truncate px-2 py-1.5 text-xs text-muted-foreground"
                title={img.file.name}
              >
                {img.file.name}
              </p>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
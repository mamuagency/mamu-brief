import { z } from "zod";

export const SERVICES = ["logo", "identity", "guidelines", "stationery", "other"] as const;
export const ATTRIBUTES = [
  "luxury",
  "trust",
  "innovation",
  "simplicity",
  "energy",
  "professionalism",
  "friendliness",
  "boldness",
  "elegance",
  "sophistication",
  "creativity",
  "authenticity",
  "reliability",
  "quality",
  "approachability",
  "exclusivity",
  "playfulness",
  "timelessness",
  "heritage",
  "sustainability",
  "technology",
  "warmth",
  "minimalism",
  "competitiveness",
] as const;
export const STYLES = [
  "minimal",
  "luxury",
  "modern",
  "bold",
  "playful",
  "classic",
  "geometric",
  "organic",
  "elegant",
  "futuristic",
  "editorial",
  "experimental",
  "recommend",
] as const;
export const MAX_STYLES = 2;
export const STAGES = ["new", "established", "rebrand"] as const;
export const LOGO_LANGS = ["ar", "en", "both", "other"] as const;
export const YESNO = ["yes", "no"] as const;
export const BUDGETS = ["small", "medium", "large"] as const;

export const APP_CATEGORIES = [
  {
    id: "logo",
    items: [
      "logo_primary",
      "logo_secondary",
      "logo_versions",
      "logo_symbol",
      "logo_wordmark",
      "logo_mono",
      "logo_responsive",
      "logo_favicon",
      "logo_animated",
    ],
  },
  {
    id: "system",
    items: [
      "sys_colors",
      "sys_typography",
      "sys_graphics",
      "sys_icons",
      "sys_illustration",
      "sys_photo",
      "sys_guidelines",
    ],
  },
  {
    id: "stationery",
    items: [
      "st_cards",
      "st_letterhead",
      "st_envelopes",
      "st_notepads",
      "st_folders",
      "st_email_sig",
      "st_invoice",
      "st_profile",
      "st_proposal",
      "st_deck",
    ],
  },
  {
    id: "digital",
    items: [
      "dg_website_assets",
      "dg_website_ui",
      "dg_social_avatars",
      "dg_social_covers",
      "dg_social_kit",
      "dg_newsletter",
      "dg_app_icon",
      "dg_banners",
    ],
  },
  {
    id: "marketing",
    items: [
      "mk_brochures",
      "mk_flyers",
      "mk_posters",
      "mk_ads",
      "mk_catalogs",
      "mk_events",
      "mk_certificates",
      "mk_merch",
    ],
  },
  {
    id: "packaging",
    items: [
      "pk_packaging",
      "pk_labels",
      "pk_stickers",
      "pk_bags",
      "pk_boxes",
      "pk_tags",
      "pk_menu",
    ],
  },
  {
    id: "environmental",
    items: [
      "env_storefront",
      "env_office",
      "env_vehicle",
      "env_uniforms",
      "env_embroidery",
      "env_booth",
    ],
  },
  { id: "other", items: ["app_other", "app_unsure"] },
] as const;

export const APPLICATIONS = APP_CATEGORIES.flatMap((c) => c.items) as unknown as string[];
export type AppCategoryId = (typeof APP_CATEGORIES)[number]["id"];

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Non-empty lines of a textarea, each expected to be a URL. */
export function urlLines(v: string): string[] {
  return v
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

const s = (max: number) => z.string().trim().max(max);

export const referenceImageSchema = z.object({
  path: z.string().max(300),
  name: z.string().max(200),
  size: z.number().int().nonnegative().max(MAX_IMAGE_BYTES),
});

export const briefSchema = z
  .object({
    draftId: z.string().uuid(),
    fullName: s(100).min(1),
    email: s(255).email(),
    brandName: s(150).min(1),
    phone: s(40)
      .min(1)
      .regex(/^[+\d\s()-]+$/),
    industry: s(150).min(1),
    products: s(1000).min(1),
    audience: s(1000),
    stage: z.enum(STAGES).or(z.literal("")),
    websiteUrl: s(500),
    socialLinks: s(1500),
    services: z.array(z.enum(SERVICES)).min(1),
    servicesOther: s(300),
    nameFinal: z.enum(YESNO).or(z.literal("")),
    logoLang: z.enum(LOGO_LANGS).or(z.literal("")),
    logoLangOther: s(200),
    attributes: z.array(z.enum(ATTRIBUTES)),
    styles: z.array(z.enum(STYLES)).max(MAX_STYLES),
    colorsLike: s(300),
    colorsAvoid: s(300),
    references: s(1500),
    referenceImages: z.array(referenceImageSchema).max(MAX_IMAGES),
    elements: s(1000),
    applications: z.array(z.string()),
    applicationsOther: s(300),
    budget: z.enum(BUDGETS).or(z.literal("")),
    deadline: s(300),
    notes: s(2000),
    extraLinks: s(1000),
    consent: z.literal(true),
    lang: z.enum(["ar", "en"]),
    website: z.string().max(200), // honeypot
  })
  .superRefine((d, ctx) => {
    const needsLinks = d.stage === "established" || d.stage === "rebrand";
    if (d.websiteUrl && !isHttpUrl(d.websiteUrl)) {
      ctx.addIssue({ code: "custom", path: ["websiteUrl"], message: "url" });
    }
    if (needsLinks && !isHttpUrl(d.websiteUrl)) {
      ctx.addIssue({ code: "custom", path: ["websiteUrl"], message: "urlRequired" });
    }
    const socials = urlLines(d.socialLinks);
    if (socials.some((l) => !isHttpUrl(l))) {
      ctx.addIssue({ code: "custom", path: ["socialLinks"], message: "url" });
    }
    if (needsLinks && !socials.some(isHttpUrl)) {
      ctx.addIssue({ code: "custom", path: ["socialLinks"], message: "socialRequired" });
    }
    if (d.logoLang === "other" && !d.logoLangOther) {
      ctx.addIssue({ code: "custom", path: ["logoLangOther"], message: "logoLangOther" });
    }
    for (const img of d.referenceImages) {
      if (!img.path.startsWith(`${d.draftId}/`)) {
        ctx.addIssue({ code: "custom", path: ["referenceImages"], message: "invalid" });
      }
    }
  });

export type Brief = z.infer<typeof briefSchema>;
export type ReferenceImage = z.infer<typeof referenceImageSchema>;
export type BriefDraft = Omit<Brief, "consent"> & { consent: boolean };

export const emptyBrief: BriefDraft = {
  draftId: "",
  fullName: "",
  email: "",
  brandName: "",
  phone: "",
  industry: "",
  products: "",
  audience: "",
  stage: "",
  websiteUrl: "",
  socialLinks: "",
  services: [],
  servicesOther: "",
  nameFinal: "",
  logoLang: "",
  logoLangOther: "",
  attributes: [],
  styles: [],
  colorsLike: "",
  colorsAvoid: "",
  references: "",
  referenceImages: [],
  elements: "",
  applications: [],
  applicationsOther: "",
  budget: "",
  deadline: "",
  notes: "",
  extraLinks: "",
  consent: false,
  lang: "en",
  website: "",
};

export type FieldError =
  | "required"
  | "email"
  | "phone"
  | "services"
  | "consent"
  | "url"
  | "urlRequired"
  | "socialRequired"
  | "logoLangOther"
  | "styles";

/** Per-step validation; returns field -> error key. */
export function validateStep(
  step: number,
  d: BriefDraft,
): Partial<Record<keyof BriefDraft, FieldError>> {
  const e: Partial<Record<keyof BriefDraft, FieldError>> = {};
  if (step === 1) {
    if (!d.fullName.trim()) e.fullName = "required";
    if (!d.email.trim()) e.email = "required";
    else if (!z.string().email().safeParse(d.email.trim()).success) e.email = "email";
    if (!d.brandName.trim()) e.brandName = "required";
    if (!d.phone.trim()) e.phone = "required";
    else if (!/^[+\d\s()-]+$/.test(d.phone.trim())) e.phone = "phone";
  }
  if (step === 2) {
    if (!d.industry.trim()) e.industry = "required";
    if (!d.products.trim()) e.products = "required";
    const needsLinks = d.stage === "established" || d.stage === "rebrand";
    if (d.websiteUrl.trim() && !isHttpUrl(d.websiteUrl)) e.websiteUrl = "url";
    else if (needsLinks && !isHttpUrl(d.websiteUrl)) e.websiteUrl = "urlRequired";
    const socials = urlLines(d.socialLinks);
    if (socials.some((l) => !isHttpUrl(l))) e.socialLinks = "url";
    else if (needsLinks && !socials.some(isHttpUrl)) e.socialLinks = "socialRequired";
  }
  if (step === 3) {
    if (d.services.length === 0) e.services = "services";
    if (d.logoLang === "other" && !d.logoLangOther.trim()) e.logoLangOther = "logoLangOther";
  }
  if (step === 4 && d.styles.length > MAX_STYLES) e.styles = "styles";
  if (step === 6 && !d.consent) e.consent = "consent";
  return e;
}

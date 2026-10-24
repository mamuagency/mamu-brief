/* ============================================================
   روابطك: ده الجزء الوحيد اللي بتعدل فيه
   - ضيف أو احذف أو غيّر أي رابط
   - الترتيب هنا هو ترتيب الظهور في الموقع
   - أي سطر فاضي ("") بيتتجاهل
   - ممكن تكتب mailto:you@mail.com أو tel:+20100000000
   ============================================================ */
export const SOCIAL_LINKS: string[] = [
  "https://www.facebook.com/MAMUAgency",
  "https://www.instagram.com/mamuagency/",
  "https://www.behance.net/ElMahmooud/",
  "https://www.linkedin.com/in/mamuagency/",
  "https://x.com/MAMUAgency",
  "https://www.tiktok.com/@mamu.agency",
  "https://wa.me/201212789489",
  "mamuagency@gmail.com",
];

/* ============================================================
   من هنا لتحت مش محتاج تلمسه
   ============================================================ */
type Icon = { name: string; color: string; paths: string[] };
type Platform = Icon & { match: string[] };
export type ResolvedSocial = Icon & { href: string };

const PLATFORMS: Platform[] = [
  {
    name: "Facebook",
    color: "#1877F2",
    match: ["facebook.com", "fb.com", "fb.me"],
    paths: ["M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"],
  },
  {
    name: "Instagram",
    color: "#E4405F",
    match: ["instagram.com"],
    paths: [
      "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z",
      "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z",
      "M17.5 6.5h.01",
    ],
  },
  {
    name: "Behance",
    color: "#0054FF",
    match: ["behance.net"],
    paths: [
      "M14.5 6H20v1.7h-5.5zM21.8 16c-1 3.3-8.9 4-8.9-2.2 0-6.6 9.7-6.5 9.1.5h-6.7c.1 2.7 2.9 2.8 3.8 1.7zM15.4 12.7h4.1c-.2-2.5-3.7-2.5-4.1 0M2 6h5.8c4.6.1 4.7 4.5 2.3 5.8 2.9 1 3 6.7-2.7 6.7H2zM4.5 8.5V11h3c2.1 0 2.4-2.5-.3-2.5zM4.5 13.5V16h2.8c2.5 0 2.4-2.5 0-2.5z",
    ],
  },
  {
    name: "LinkedIn",
    color: "#0A66C2",
    match: ["linkedin.com"],
    paths: [
      "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",
      "M2 9h4v12H2z",
      "M4 4m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    ],
  },
  {
    name: "X",
    color: "#9CA3AF",
    match: ["x.com", "twitter.com"],
    paths: ["M4 4l11.733 16h4.267l-11.733-16z", "M4 20l6.768-6.768m2.46-2.46L20 4"],
  },
  {
    name: "TikTok",
    color: "#FF0050",
    match: ["tiktok.com"],
    paths: [
      "M21 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z",
    ],
  },
  {
    name: "WhatsApp",
    color: "#25D366",
    match: ["wa.me", "whatsapp.com"],
    paths: [
      "M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9",
      "M9 10a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1",
    ],
  },
  {
    name: "YouTube",
    color: "#FF0000",
    match: ["youtube.com", "youtu.be"],
    paths: [
      "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z",
      "M9.75 15.02l5.75-3.27-5.75-3.27v6.54z",
    ],
  },
  {
    name: "Telegram",
    color: "#26A5E4",
    match: ["t.me", "telegram.me", "telegram.org"],
    paths: ["M22 2L11 13", "M22 2l-7 20-4-9-9-4 20-7z"],
  },
  {
    name: "GitHub",
    color: "#A78BFA",
    match: ["github.com"],
    paths: [
      "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
    ],
  },
];

const MAIL: Icon = {
  name: "Email",
  color: "#F59E0B",
  paths: [
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    "M22 6l-10 7L2 6",
  ],
};

const PHONE: Icon = {
  name: "Phone",
  color: "#10B981",
  paths: [
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z",
  ],
};

// أيقونة افتراضية لأي موقع مش معروف (Behance, Pinterest, موقعك...)
const genericLink = (host: string): Icon => ({
  name: host,
  color: "#8B5CF6",
  paths: [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ],
});

export function resolveSocial(input: string): ResolvedSocial | null {
  const href = input.trim();
  if (!href) return null;
  // إيميل مكتوب عادي (بدون mailto:) يتعرف عليه تلقائيًا
  if (/^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(href)) {
    return { ...MAIL, href: `mailto:${href}` };
  }

  if (href.startsWith("mailto:")) return { ...MAIL, href };
  if (href.startsWith("tel:")) return { ...PHONE, href };

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null; // رابط غلط (ناقصه https://) بيتتجاهل
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const platform = PLATFORMS.find((p) => p.match.some((m) => host === m || host.endsWith("." + m)));

  return { ...(platform ?? genericLink(host)), href };
}

export const SOCIAL_ITEMS: ResolvedSocial[] = SOCIAL_LINKS.map(resolveSocial).filter(
  (s): s is ResolvedSocial => s !== null,
);

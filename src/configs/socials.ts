import { portfolio } from "./portfolio";

export type SocialId = keyof typeof portfolio.socials;

/** Display order, icons and brand colours of the profile links. */
export const SOCIALS: { id: SocialId; name: string; icon: string; brand: string }[] = [
  { id: "linkedin", name: "LinkedIn", icon: "i-ph-linkedin-logo-fill", brand: "#0a66c2" },
  { id: "telegram", name: "Telegram", icon: "i-ph-telegram-logo-fill", brand: "#229ed9" },
  {
    id: "instagram",
    name: "Instagram",
    icon: "i-ph-instagram-logo-fill",
    brand: "#e1306c"
  },
  { id: "github", name: "GitHub", icon: "i-ph-github-logo-fill", brand: "#6e5494" }
];

/** "https://www.instagram.com/name/" → "name" (for the Contact list and terminal). */
export function socialHandle(url: string) {
  try {
    const { pathname } = new URL(url);
    const part = pathname.split("/").filter(Boolean).pop();
    return part ? `@${part}` : url;
  } catch {
    return url;
  }
}

/** Filled links, in display order. */
export const filledSocials = () => SOCIALS.filter((s) => portfolio.socials[s.id]);

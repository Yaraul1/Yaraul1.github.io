import { portfolio } from "~/configs/portfolio";

export interface OutgoingMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  files: File[];
  /** honeypot: real people never fill it, bots usually do */
  honey: string;
}

export type SendError = "not-configured" | "needs-activation" | "rate-limited" | "failed";

/** FormSubmit accepts up to 10 MB of attachments per message. */
export const ATTACHMENT_LIMIT = 10 * 1024 * 1024;
export const ATTACHMENT_MAX_FILES = 5;

/** The form can send once an address (or FormSubmit's random alias) is set in configs/portfolio.ts. */
export const canSendMail = () => Boolean(portfolio.contactForm.formsubmit.trim());

/**
 * Sends the message, with attachments, through FormSubmit (https://formsubmit.co): the site
 * is static, so a form service delivers it to the owner's inbox. The visitor's address
 * becomes reply-to.
 */
export async function sendMessage(msg: OutgoingMessage, fallbackSubject: string) {
  const target = portfolio.contactForm.formsubmit.trim();
  if (!target) throw new Error("not-configured" satisfies SendError);
  const body = new FormData();
  body.append("name", msg.name.trim());
  body.append("email", msg.email.trim());
  body.append("message", msg.message.trim());
  body.append("_subject", msg.subject.trim() || fallbackSubject);
  body.append("_template", "table");
  body.append("_captcha", "false");
  body.append("_honey", msg.honey);
  msg.files.forEach((file) => body.append("attachment", file, file.name));

  let response: Response;
  try {
    response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(target)}`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body
    });
  } catch {
    throw new Error("failed" satisfies SendError);
  }
  if (response.status === 429) throw new Error("rate-limited" satisfies SendError);
  const result = (await response.json().catch(() => null)) as {
    success?: boolean | string;
    message?: string;
  } | null;
  if (response.ok && String(result?.success) === "true") return;
  // the very first message triggers FormSubmit's confirmation email to the owner
  if (/activat/i.test(result?.message ?? ""))
    throw new Error("needs-activation" satisfies SendError);
  throw new Error("failed" satisfies SendError);
}

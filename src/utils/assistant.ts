import type { Lang } from "~/i18n/lang";
import { ui } from "~/i18n/ui";

/** The assistant's face: a robot drawn for this site, not Yaroslav's photo */
export const assistantAvatar = "/assistant/robot.svg";

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  /** show "write an email" / Telegram under this reply */
  contact?: boolean;
};

/**
 * The assistant will answer through a small server that holds the API key and the
 * knowledge base. Until that server exists the chat says so honestly and offers to
 * write to Yaroslav directly; the status in the window header follows this flag.
 */
export const assistantOnline = false;

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true }
    );
  });

/**
 * Streams a reply into onDelta piece by piece and says whether to offer the contact
 * buttons under it. For now the reply is the "still learning" note, typed out the way
 * a real streamed answer arrives, so the window already behaves as it will later.
 */
export async function askAssistant(
  _history: ChatMessage[],
  lang: Lang,
  onDelta: (chunk: string) => void,
  signal: AbortSignal
): Promise<{ contact: boolean }> {
  await wait(900, signal);
  const words = ui[lang].assistant.offline.split(" ");
  for (let i = 0; i < words.length; i++) {
    onDelta(i ? ` ${words[i]}` : words[i]);
    await wait(28, signal);
  }
  return { contact: true };
}

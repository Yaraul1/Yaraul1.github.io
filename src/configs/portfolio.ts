import type { Lang } from "~/i18n/lang";
import type { ArtKind } from "~/components/cases/types";

type Localized<T> = Record<Lang, T>;

export const portfolio = {
  name: "Yaroslav Yuferev",
  role: "AI Engineer",
  initials: "YY",
  email: "",
  /**
   * Profile links shown as icons in "About me" and in Contact. An empty value hides the icon
   * on the published site (in `pnpm dev` it shows as a dimmed placeholder). Use full URLs,
   * without tracking parameters.
   */
  socials: {
    linkedin: "https://www.linkedin.com/in/yaroslav-yuferev/",
    telegram: "https://t.me/kencho2134",
    instagram: "https://www.instagram.com/yaraul228/",
    github: "https://github.com/Yaraul1"
  },
  /**
   * Mail window. Messages and attachments (up to 10 MB) go through FormSubmit:
   * 1. put the address that should receive them here, e.g. "you@example.com";
   * 2. send one message from the site — FormSubmit emails you a confirmation link;
   * 3. after confirming, it gives you a random string: put that here instead of the address,
   *    so the address isn't visible in the site's code.
   * Empty: the form still works as a draft, but sending offers Telegram instead.
   */
  contactForm: {
    formsubmit: ""
  },
  resume: "",
  /** Texts below are bilingual: always fill in both ru and en. */
  bio: {
    ru: "Это моё пространство в интернете: проекты, идеи и работа с искусственным интеллектом.",
    en: "My corner of the internet: projects, ideas and hands-on work with artificial intelligence."
  } as Localized<string>,
  projects: [
    {
      title: { ru: "Тендерный паук", en: "Tender Spider" },
      category: { ru: "Тендеры и почта", en: "Tenders and mail" },
      description: {
        ru: "Система тендерного отдела: сама собирает закупки из агрегатора и из писем площадок, ИИ раскладывает подборки на отдельные закупки, а тендер ведётся по статусам до 1С.",
        en: "A tender desk system: it gathers tenders from an aggregator and from marketplace e-mails by itself, AI splits digests into separate tenders, and each one moves through statuses to 1C."
      },
      tags: ["FastAPI", "Next.js", "PostgreSQL", "Dify", "Playwright", "IMAP"],
      caseId: "spider",
      art: "spider",
      link: {
        case: "filter",
        text: {
          ru: "Работает в связке с Фильтром заявок",
          en: "Works together with the Request Filter"
        }
      }
    },
    {
      title: { ru: "Фильтр заявок", en: "Request Filter" },
      category: { ru: "ИИ-оценка заявок", en: "AI request assessment" },
      description: {
        ru: "Заявка клиента или тендер в любом формате превращается в карточку: позиции, решение «брать / проверить / отклонить», балл 0–100 и правило, которое его определило.",
        en: "A customer request or a tender in any format becomes a card: items, a “take / check / reject” verdict, a 0–100 score and the rule that decided it."
      },
      tags: ["FastAPI", "Next.js", "SQLite", "Dify", "Tavily", "LDAP"],
      caseId: "filter",
      art: "filter",
      link: {
        case: "spider",
        text: {
          ru: "Получает тендеры из Тендерного паука",
          en: "Takes tenders from the Tender Spider"
        }
      }
    },
    {
      title: { ru: "Переводчик документов", en: "Document Translator" },
      category: { ru: "Перевод документов", en: "Document translation" },
      description: {
        ru: "Переводит сканы, PDF, Word и Excel так, что перевод встаёт на место оригинала: те же таблицы, печати и подписи. Поправить можно прямо на листе.",
        en: "Translates scans, PDFs, Word and Excel files so the translation takes the original's place: the same tables, seals and signatures. Edits happen right on the page."
      },
      tags: [
        "FastAPI",
        "Next.js",
        "PostgreSQL",
        "PaddleOCR",
        "OpenCV",
        "PyMuPDF",
        "Dify"
      ],
      caseId: "translator",
      art: "translator"
    },
    {
      title: "LegalHub",
      category: { ru: "Автоматизация документов", en: "Document automation" },
      description: {
        ru: "Сервис для юридического отдела: пачкой подписывает договоры факсимиле с печатью и заверяет копии штампом «Копия верна». ИИ находит место подписи на странице, а код решает, какой штамп туда поставить.",
        en: "A tool for a legal department: it signs contracts in batches with a facsimile signature and seal, and certifies copies with a “true copy” stamp. AI finds where the signature goes on the page; code decides which stamp to put there."
      },
      tags: ["Next.js", "FastAPI", "Dify", "PostgreSQL", "MinIO", "LibreOffice"],
      caseId: "legalhub"
    },
    {
      title: { ru: "Транскрибатор звонков", en: "Call Transcriber" },
      category: { ru: "Расшифровка речи", en: "Speech to text" },
      description: {
        ru: "Сервис для корпоративного портала: записи звонков расшифровываются в фоне через сменный движок, а готовый текст сам возвращается в портал.",
        en: "A service for a company portal: call recordings are transcribed in the background by a switchable engine, and the text returns to the portal by itself."
      },
      tags: ["NestJS", "React", "PostgreSQL", "Prisma", "Keycloak"],
      caseId: "transcriber",
      art: "transcriber"
    },
    {
      title: "BONADI",
      category: { ru: "Сайт бренда", en: "Brand website" },
      description: {
        ru: "Сайт фабрики женского трикотажа на 1С-Битриксе: каталог моделей с цветами и размерами, заявки в Telegram и админка для быстрого ввода ассортимента.",
        en: "The site of a women's knitwear factory on 1C-Bitrix: a catalogue of models with colours and sizes, enquiries to Telegram and an admin for entering the range fast."
      },
      tags: ["PHP", "1С-Битрикс", "MySQL", "JavaScript", "Telegram"],
      caseId: "bonadi",
      art: "bonadi",
      url: "https://bonadi.by/"
    }
  ] as {
    title: string | Localized<string>;
    category: Localized<string>;
    description: Localized<string>;
    tags: string[];
    url?: string;
    source?: string;
    /** case study opened from the card: "legalhub" or an id from components/cases */
    caseId?: string;
    /** illustration on the card (LegalHub draws its stamped sheets without one) */
    art?: ArtKind;
    /** a project this one works together with: a chip that opens its case */
    link?: { case: string; text: Localized<string> };
  }[]
};
export function openPortfolioApp(id: string) {
  window.dispatchEvent(new CustomEvent("yar:open", { detail: id }));
}

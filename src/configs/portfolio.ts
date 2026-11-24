import type { Lang } from "~/i18n/lang";
import type { ArtKind } from "~/components/cases/types";

export type Localized<T> = Record<Lang, T>;

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
    linkedin: "",
    telegram: "",
    instagram: "",
    github: ""
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
  /** The CV behind "Download CV" in "About me": a file in public/. */
  // empty when the CV file isn't in public/resume/ (it is not committed): no button then
  resume: __RESUME_URL__,
  /** Texts below are bilingual: always fill in both ru and en. */
  /** the line under the name in "About me", as in the CV */
  headline: {
    ru: "AI Engineer — LLM-интеграции и автоматизация бизнес-процессов",
    en: "AI Engineer — LLM integrations and business process automation"
  } as Localized<string>,
  bio: {
    ru: "Разрабатываю и внедряю внутренние ИИ-сервисы: обработку тендеров и почты, оценку заявок, перевод и обработку документов. Отвечаю за архитектуру решения и веду полный цикл — от анализа процессов до backend, frontend, ИИ-компонентов, запуска и сопровождения. Сервисами пользуются все отделы компании.",
    en: "I build and roll out internal AI services: tender and e-mail processing, request assessment, document translation and processing. I own the solution's architecture and the full cycle — from process analysis to backend, frontend, AI components, launch and support. Every department of the company uses them."
  } as Localized<string>,
  /**
   * "About me" below the greeting: the resume. `work` and `side` take their names from
   * `projects` by caseId and open that case; `own` marks systems built from scratch.
   */
  about: {
    stats: [
      {
        value: "5",
        label: {
          ru: "ИИ-систем в ЕМК — все построены с нуля",
          en: "AI systems at EMK, all built from scratch"
        }
      },
      {
        value: { ru: "3 500–4 000", en: "3,500–4,000" },
        label: {
          ru: "тендеров в день собирает и сортирует система",
          en: "tenders a day collected and sorted by the system"
        }
      },
      {
        value: "93%",
        label: {
          ru: "решений Фильтра об отклонении корректны",
          en: "of the Filter's rejection calls are correct"
        }
      }
    ],
    job: {
      company: {
        ru: "ЕМК — Европейская Металлургическая Компания",
        en: "EMK — European Metallurgical Company"
      },
      place: { ru: "Минск", en: "Minsk" },
      role: {
        ru: "Инженер-программист — ИИ-автоматизация бизнес-процессов",
        en: "Engineer Programmer — AI & Workflow Automation"
      },
      period: { ru: "декабрь 2025 — сейчас", en: "December 2025 — now" },
      summary: {
        ru: "Металлургия, поставки металлопроката.",
        en: "Metals and metal products supply."
      }
    },
    work: [
      {
        caseId: "spider",
        own: true,
        part: { ru: "С нуля", en: "From scratch" },
        result: {
          ru: "Каждый день собирает 3 500–4 000 тендеров и разбирает 2 000–3 000 писем: лишнее скрыто, остальное в очереди по приоритету. Раньше сотрудник тратил на это 4–6 часов в день.",
          en: "Every day it collects 3,500–4,000 tenders and sorts 2,000–3,000 e-mails: the noise is hidden, the rest is queued by priority. An employee used to spend 4–6 hours a day on this."
        }
      },
      {
        caseId: "filter",
        own: true,
        part: { ru: "С нуля · целиком", en: "From scratch · end to end" },
        result: {
          ru: "Единый свод правил вместо личных критериев: балл 0–100 и рекомендация по каждой заявке. 93% решений об отклонении корректны, 88% рекомендованных заявок менеджеры берут в работу.",
          en: "One rule set instead of personal criteria: a 0–100 score and a recommendation for every request. 93% of rejection calls are correct; managers take on 88% of the recommended requests."
        }
      },
      {
        caseId: "translator",
        own: true,
        part: {
          ru: "С нуля · единственный разработчик",
          en: "From scratch · sole developer"
        },
        result: {
          ru: "Документ из нескольких страниц переводится за 9,8 мин (медиана) с сохранением таблиц, печатей и подписей. Раньше переводчик тратил 5–10 минут на одну страницу.",
          en: "A multi-page document is translated in 9.8 min (median), keeping its tables, seals and signatures. A translator used to spend 5–10 minutes on a single page."
        }
      },
      {
        caseId: "legalhub",
        own: true,
        part: { ru: "С нуля · вдвоём", en: "From scratch · team of two" },
        result: {
          ru: "Пакет договоров с подписью и печатью или «Копия верна» — за несколько минут вместо часа. Моя часть — архитектура, весь интерфейс и правила выбора штампа.",
          en: "A batch of contracts with a signature and seal or a “true copy” stamp in a few minutes instead of an hour. My part: architecture, the whole interface and the stamp rules."
        }
      },
      {
        caseId: "transcriber",
        own: true,
        part: { ru: "С нуля · MVP", en: "From scratch · MVP" },
        result: {
          ru: "Один сервис распознавания для всех систем: записи расшифровываются в фоне, текст сам возвращается в портал; 4 языка.",
          en: "One speech-to-text service for every system: recordings are transcribed in the background and the text returns to the portal by itself; 4 languages."
        }
      }
    ],
    side: [
      {
        caseId: "bonadi",
        own: true,
        part: { ru: "Один · 1С-Битрикс", en: "Solo · 1C-Bitrix" },
        result: {
          ru: "Сайт фабрики женского трикотажа: UI/UX-дизайн, фронтенд, backend и панель администрирования; 8 разделов с каталогом и заявками.",
          en: "A women's knitwear factory's site: UI/UX design, frontend, backend and the admin panel; 8 sections with a catalogue and enquiries."
        }
      }
    ],
    skills: [
      {
        group: { ru: "ИИ", en: "AI" },
        items: [
          {
            ru: "LLM-интеграции (OpenAI, Claude)",
            en: "LLM integrations (OpenAI, Claude)"
          },
          "Dify",
          { ru: "vision-модели", en: "vision models" },
          "OCR (TextIn, PaddleOCR)",
          {
            ru: "распознавание речи (OpenAI, Deepgram)",
            en: "speech-to-text (OpenAI, Deepgram)"
          },
          "Claude Code",
          "Codex"
        ]
      },
      {
        group: { ru: "Backend", en: "Backend" },
        items: [
          "Python",
          "FastAPI",
          "SQLAlchemy",
          "Pydantic",
          "PostgreSQL",
          "SQLite",
          "TypeScript",
          "NestJS"
        ]
      },
      {
        group: { ru: "Frontend", en: "Frontend" },
        items: ["React", "Next.js", "TypeScript", "Tailwind CSS"]
      },
      {
        group: { ru: "Интеграции, инфраструктура", en: "Integrations, infrastructure" },
        items: [
          { ru: "1С", en: "1C" },
          "IMAP",
          "Telegram Bot API",
          "Playwright",
          "LDAP / AD",
          "Keycloak",
          "Docker",
          "GitHub Actions"
        ]
      },
      {
        group: { ru: "Языки", en: "Languages" },
        items: [
          { ru: "русский — родной", en: "Russian — native" },
          { ru: "английский — B2", en: "English — B2" }
        ]
      }
    ],
    education: [
      {
        when: { ru: "до 2030", en: "until 2030" },
        school: {
          ru: "РЭУ им. Г. В. Плеханова, Минский филиал",
          en: "Plekhanov Russian University of Economics, Minsk branch"
        },
        field: {
          ru: "Прикладная информатика. Обучаюсь; ожидаемый год окончания — 2030.",
          en: "Applied Informatics. Studying; expected to graduate in 2030."
        }
      },
      {
        when: { ru: "2020 — 2022", en: "2020 — 2022" },
        school: { ru: "Варшавский университет", en: "University of Warsaw" },
        field: {
          ru: "Управление, менеджмент. Обучение не завершено.",
          en: "Management. Not completed."
        }
      },
      {
        when: { ru: "Курсы", en: "Courses" },
        school: {
          ru: "Автоматизация бизнес-процессов с ИИ",
          en: "Business process automation with AI"
        },
        field: {
          ru: "Воркшоп Андрея Цыгана, 2025 · Python и JavaScript — Stepik, 2022–2023",
          en: "Andrey Tsygan's workshop, 2025 · Python and JavaScript — Stepik, 2022–2023"
        }
      }
    ]
  } as {
    stats: { value: string | Localized<string>; label: Localized<string> }[];
    job: Record<"company" | "place" | "role" | "period" | "summary", Localized<string>>;
    work: AboutSystem[];
    side: AboutSystem[];
    skills: { group: Localized<string>; items: (string | Localized<string>)[] }[];
    education: {
      when: Localized<string>;
      school: Localized<string>;
      field: Localized<string>;
    }[];
  },
  projects: [
    {
      title: { ru: "Тендеры и почта", en: "Tenders & Mail" },
      category: { ru: "Сбор закупок", en: "Tender intake" },
      description: {
        ru: "Система тендерного отдела: сама собирает тендеры с площадок и разбирает корпоративную почту — ИИ скрывает лишнее, остальное встаёт в очередь по приоритету.",
        en: "A tender desk system: it collects tenders from the platforms and sorts the company's e-mail by itself — AI hides what isn't needed, the rest is queued by priority."
      },
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
      caseId: "filter",
      art: "filter",
      link: {
        case: "spider",
        text: {
          ru: "Получает тендеры из «Тендеров и почты»",
          en: "Takes tenders from Tenders & Mail"
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
      caseId: "translator",
      art: "translator"
    },
    {
      title: { ru: "Подписание документов", en: "Document Signing" },
      category: { ru: "Подпись и печать", en: "Signature and seal" },
      description: {
        ru: "Сервис для юридического отдела: пачкой подписывает договоры факсимиле с печатью и заверяет копии штампом «Копия верна». ИИ находит место подписи на странице, а код решает, какой штамп туда поставить.",
        en: "A tool for a legal department: it signs contracts in batches with a facsimile signature and seal, and certifies copies with a “true copy” stamp. AI finds where the signature goes on the page; code decides which stamp to put there."
      },
      caseId: "legalhub"
    },
    {
      title: { ru: "Транскрибатор звонков", en: "Call Transcriber" },
      category: { ru: "Расшифровка речи", en: "Speech to text" },
      description: {
        ru: "Сервис для корпоративного портала: записи звонков расшифровываются в фоне через сменный движок, а готовый текст сам возвращается в портал.",
        en: "A service for a company portal: call recordings are transcribed in the background by a switchable engine, and the text returns to the portal by itself."
      },
      caseId: "transcriber",
      art: "transcriber"
    },
    {
      title: "BONADI",
      category: { ru: "Сайт бренда", en: "Brand website" },
      description: {
        ru: "Сайт фабрики женского трикотажа на 1С-Битриксе — красивая визитная карточка магазина.",
        en: "The website of a women's knitwear factory on 1C-Bitrix — a good-looking business card for the shop."
      },
      caseId: "bonadi",
      art: "bonadi",
      url: "https://bonadi.by/"
    }
  ] as {
    title: string | Localized<string>;
    category: Localized<string>;
    description: Localized<string>;
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
/** A system in the resume part of "About me". */
export type AboutSystem = {
  caseId: string;
  own: boolean;
  part: Localized<string>;
  result: Localized<string>;
};

export function openPortfolioApp(id: string) {
  window.dispatchEvent(new CustomEvent("yar:open", { detail: id }));
}

let pendingCase: string | null = null;
let pendingSection: string | null = null;

/**
 * Opens Projects straight on a case, and on one of its chapters when `section` is given
 * (e.g. "demo"). A Projects window that is already open hears the event; one that opens now
 * reads the case with peekPendingCase() and clears it once mounted (reading stays pure:
 * React may run a state initializer twice).
 */
export function openPortfolioCase(id: string, section?: string) {
  pendingCase = id;
  pendingSection = section ?? null;
  window.dispatchEvent(new CustomEvent("yar:case", { detail: id }));
  openPortfolioApp("projects");
}

export const peekPendingCase = () => pendingCase;

export function clearPendingCase() {
  pendingCase = null;
}

/** The chapter a case was asked to open on; taken once, by the case that opens. */
export function takePendingSection() {
  const section = pendingSection;
  pendingSection = null;
  return section;
}

import type { ProjectCaseData } from "../types";

/** Tenders & Mail: tenders and e-mail for a tender desk, told at the level of task and result. */
const spider: ProjectCaseData = {
  id: "spider",
  art: "spider",
  firstNode: "collect",
  bridge: true,
  stack: [
    "Python",
    "FastAPI",
    "SQLAlchemy",
    "PostgreSQL",
    "IMAP",
    "Playwright",
    "Dify",
    "LLM (OpenAI)",
    "Next.js",
    "React",
    "Tailwind CSS",
    "Telegram Bot API"
  ],
  ru: {
    title: "Тендеры и почта",
    kicker: "Кейс · тендеры и почта",
    lead: "Сам собирает тендеры с площадок и разбирает корпоративную почту: ИИ скрывает лишнее, остальное встаёт в очередь по приоритету, а сотрудник только принимает или отклоняет.",
    facts: [
      { icon: "i-ph-briefcase", term: "Что это", value: "Система тендерного отдела" },
      {
        icon: "i-ph-envelope-simple",
        term: "Источники",
        value: "Тендерные площадки и корпоративная почта"
      },
      {
        icon: "i-ph-link",
        term: "Связка",
        value: "Фильтр заявок — оценка одной кнопкой"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Сроки",
        value: "Декабрь 2025 — сейчас, в эксплуатации"
      }
    ],
    problem: {
      before: [
        "Каждый сотрудник вручную обходил свои площадки — 4–6 часов в день",
        "Часть площадок успевали смотреть только раз в неделю",
        "Тысячи писем в день разбирали руками в общем ящике"
      ],
      after: [
        "Система каждый день сама собирает тендеры отрасли и отбирает подходящие",
        "Нерелевантные письма скрыты, остальные — в очереди по приоритету",
        "Всё в одном месте: работу видно, по ней можно вести статистику"
      ]
    },
    steps: [
      {
        icon: "i-ph-stack",
        title: "Тендеры уже собраны",
        text: "Система сама забирает тендеры с площадок и отбирает подходящие по заданным критериям."
      },
      {
        icon: "i-ph-envelope-open",
        title: "Почта разобрана",
        text: "ИИ скрывает нерелевантные письма, остальные ставит в очередь: сначала самые важные."
      },
      {
        icon: "i-ph-hand-pointing",
        title: "Решение по карточке",
        text: "Сотрудник открывает карточку со всей информацией и принимает или отклоняет её."
      },
      {
        icon: "i-ph-funnel-simple",
        title: "Проверка в Фильтре",
        text: "Одной кнопкой тендер уходит на оценку, балл и рекомендация возвращаются в карточку."
      }
    ],
    stages: [
      {
        icon: "i-ph-download-simple",
        title: "Сбор",
        tool: "площадки · почта",
        detail:
          "Тендеры с площадок и письма из корпоративного ящика попадают в одну базу."
      },
      {
        icon: "i-ph-git-merge",
        title: "Без дублей",
        tool: "номер закупки",
        detail: "Один и тот же тендер из почты и с площадки склеивается в одну карточку."
      },
      {
        icon: "i-ph-brain",
        title: "ИИ-разбор",
        tool: "Dify · LLM",
        detail:
          "ИИ классифицирует заказчиков и письма, раскладывает подборки на отдельные закупки и выставляет приоритет."
      },
      {
        icon: "i-ph-kanban",
        title: "Очередь",
        tool: "FastAPI · Next.js",
        detail:
          "Сотрудник работает с готовой очередью по приоритету: принять или отклонить."
      },
      {
        icon: "i-ph-funnel-simple",
        title: "Оценка",
        tool: "Фильтр заявок",
        detail:
          "Тендер одной кнопкой уходит в Фильтр, вердикт и решение возвращаются в карточку."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Веб-интерфейс",
          tech: "Next.js · React",
          text: "Очереди тендеров и писем, карточка тендера, справочники."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "Бизнес-логика и права доступа."
        },
        {
          id: "sso",
          name: "Вход",
          tech: "корпоративные учётные записи",
          text: "Вход по рабочей учётке, права по ролям."
        }
      ],
      data: [
        {
          id: "db",
          name: "База",
          tech: "PostgreSQL",
          text: "Тендеры, письма, решения и справочники."
        },
        {
          id: "files",
          name: "Документы",
          tech: "хранилище",
          text: "Документы тендеров и вложения писем."
        }
      ],
      processing: [
        {
          id: "collect",
          name: "Сбор",
          tech: "фоновые задачи",
          text: "Забирает тендеры с площадок и письма из ящика."
        },
        {
          id: "ai",
          name: "ИИ",
          tech: "Dify · LLM",
          text: "Классифицирует заказчиков и письма, выставляет приоритет."
        },
        {
          id: "filter",
          name: "Связка с Фильтром",
          tech: "HTTP",
          text: "Отправляет тендер на оценку и получает вердикт."
        },
        {
          id: "alerts",
          name: "Мониторинг",
          tech: "Telegram",
          text: "Сбои и тихие остановки — сразу в чат."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-git-merge",
        title: "Одна закупка из двух каналов",
        summary: "Тендер с площадки и из почты — одна карточка",
        text: "Номер закупки приводится к единому виду, поэтому дубли из разных каналов склеиваются, а сотрудник не разбирает один тендер дважды."
      },
      {
        icon: "i-ph-brain",
        title: "Устойчивая ИИ-разметка",
        summary: "Сбой сервиса — не повод потерять письмо",
        text: "Если ИИ-сервис недоступен, письмо не помечается как неважное, а ждёт повторного разбора."
      },
      {
        icon: "i-ph-siren",
        title: "Тихие остановки",
        summary: "Сбой виден сразу, а не от пользователей",
        text: "Если почта перестала приходить или очередь встала, об этом сразу приходит сообщение в чат."
      }
    ],
    numbers: [
      {
        area: "Было",
        value: "4–6 ч",
        detail: "в день у сотрудника на обход площадок и почту"
      },
      { area: "Тендеры", value: "3 500–4 000", detail: "в день собирает система" },
      { area: "Почта", value: "2–3 тыс.", detail: "писем в день разбирает ИИ" },
      { area: "Скорость", value: "~30 с", detail: "от письма до карточки в системе" }
    ]
  },
  en: {
    title: "Tenders & Mail",
    kicker: "Case · tenders and mail",
    lead: "It collects tenders from the platforms and sorts the company's e-mail by itself: AI hides what isn't needed, the rest is queued by priority, and staff just accept or reject.",
    facts: [
      { icon: "i-ph-briefcase", term: "What", value: "A tender desk system" },
      {
        icon: "i-ph-envelope-simple",
        term: "Sources",
        value: "Tender platforms and company e-mail"
      },
      {
        icon: "i-ph-link",
        term: "Works with",
        value: "Request Filter — one-click assessment"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Timeline",
        value: "December 2025 — now, in use"
      }
    ],
    problem: {
      before: [
        "Each employee checked their platforms by hand — 4–6 hours a day",
        "Some platforms could only be checked once a week",
        "Thousands of e-mails a day were sorted by hand in a shared mailbox"
      ],
      after: [
        "Every day the system collects the industry's tenders and picks the relevant ones",
        "Irrelevant e-mails are hidden, the rest is queued by priority",
        "Everything in one place: the work is visible and can be measured"
      ]
    },
    steps: [
      {
        icon: "i-ph-stack",
        title: "Tenders already collected",
        text: "The system picks up tenders from the platforms and keeps the ones that match the criteria."
      },
      {
        icon: "i-ph-envelope-open",
        title: "E-mail sorted",
        text: "AI hides irrelevant e-mails and queues the rest, the most important first."
      },
      {
        icon: "i-ph-hand-pointing",
        title: "Decide on a card",
        text: "An employee opens a card with all the details and accepts or rejects it."
      },
      {
        icon: "i-ph-funnel-simple",
        title: "Check in the Filter",
        text: "One button sends the tender for assessment; the score and recommendation return to the card."
      }
    ],
    stages: [
      {
        icon: "i-ph-download-simple",
        title: "Collection",
        tool: "platforms · e-mail",
        detail:
          "Tenders from the platforms and e-mails from the company mailbox land in one database."
      },
      {
        icon: "i-ph-git-merge",
        title: "No duplicates",
        tool: "tender number",
        detail: "The same tender from e-mail and from a platform is merged into one card."
      },
      {
        icon: "i-ph-brain",
        title: "AI reading",
        tool: "Dify · LLM",
        detail:
          "AI classifies customers and e-mails, splits digests into separate tenders and sets the priority."
      },
      {
        icon: "i-ph-kanban",
        title: "Queue",
        tool: "FastAPI · Next.js",
        detail: "Staff work with a ready queue sorted by priority: accept or reject."
      },
      {
        icon: "i-ph-funnel-simple",
        title: "Assessment",
        tool: "Request Filter",
        detail:
          "One button sends a tender to the Filter; the verdict and decision return to the card."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Web app",
          tech: "Next.js · React",
          text: "Tender and e-mail queues, the tender card, reference lists."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "Business logic and access rights."
        },
        {
          id: "sso",
          name: "Sign-in",
          tech: "company accounts",
          text: "Sign-in with a work account, rights by role."
        }
      ],
      data: [
        {
          id: "db",
          name: "Database",
          tech: "PostgreSQL",
          text: "Tenders, e-mails, decisions and reference lists."
        },
        {
          id: "files",
          name: "Documents",
          tech: "storage",
          text: "Tender documents and e-mail attachments."
        }
      ],
      processing: [
        {
          id: "collect",
          name: "Collection",
          tech: "background jobs",
          text: "Picks up tenders from the platforms and e-mails from the mailbox."
        },
        {
          id: "ai",
          name: "AI",
          tech: "Dify · LLM",
          text: "Classifies customers and e-mails and sets the priority."
        },
        {
          id: "filter",
          name: "Filter link",
          tech: "HTTP",
          text: "Sends a tender for assessment and gets the verdict back."
        },
        {
          id: "alerts",
          name: "Monitoring",
          tech: "Telegram",
          text: "Failures and silent stalls go straight to a chat."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-git-merge",
        title: "One tender, two channels",
        summary: "A platform tender and an e-mailed one — one card",
        text: "The tender number is normalised, so duplicates from different channels merge and nobody reads the same tender twice."
      },
      {
        icon: "i-ph-brain",
        title: "Robust AI tagging",
        summary: "A service outage doesn't lose an e-mail",
        text: "If the AI service is down, the e-mail isn't marked unimportant — it waits to be read again."
      },
      {
        icon: "i-ph-siren",
        title: "Silent stalls",
        summary: "A failure shows up at once, not via users",
        text: "If e-mail stops arriving or the queue stalls, a message goes to a chat right away."
      }
    ],
    numbers: [
      {
        area: "Before",
        value: "4–6 h",
        detail: "a day per employee on platforms and e-mail"
      },
      { area: "Tenders", value: "3,500–4,000", detail: "collected by the system a day" },
      { area: "E-mail", value: "2–3k", detail: "e-mails a day sorted by AI" },
      { area: "Speed", value: "~30 s", detail: "from an e-mail to a card in the system" }
    ]
  }
};

export default spider;

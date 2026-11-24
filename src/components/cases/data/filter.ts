import type { ProjectCaseData } from "../types";

/** Request Filter: AI assessment of requests and tenders, told at the level of task and result. */
const filter: ProjectCaseData = {
  id: "filter",
  art: "filter",
  firstNode: "worker",
  bridge: true,
  stack: [
    "Python",
    "FastAPI",
    "Pydantic",
    "SQLite",
    "PyMuPDF",
    "LibreOffice",
    "Dify",
    "LLM",
    "Next.js",
    "React",
    "Tailwind CSS",
    "Telegram Bot API"
  ],
  ru: {
    title: "Фильтр заявок",
    kicker: "Кейс · ИИ-оценка заявок",
    lead: "Весь поток заявок — тендеры, письма и запросы — проходит через Фильтр: ИИ разбирает заявку по позициям, сверяет со сводом правил и выставляет балл 0–100 с рекомендацией. Решение остаётся за менеджером.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "Что это",
        value: "Оценка заявок для продаж и тендерного отдела"
      },
      { icon: "i-ph-files", term: "На входе", value: "Excel, Word, PDF, сканы, письма" },
      {
        icon: "i-ph-scales",
        term: "Итог",
        value: "Балл 0–100 и рекомендация с причиной"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Сроки",
        value: "Август 2026 — сейчас, в эксплуатации"
      }
    ],
    problem: {
      before: [
        "Каждый менеджер решал по своим критериям, брать заявку или нет",
        "Единых правил не было — нельзя понять, почему заявку взяли или отклонили",
        "Нецелевые заявки проходили всю цепочку специалистов"
      ],
      after: [
        "Единый свод правил для всех заявок",
        "По каждой заявке видны позиции, балл и правило, по которому дана рекомендация",
        "Нецелевые заявки видны сразу, а работу отдела легко отследить"
      ]
    },
    steps: [
      {
        icon: "i-ph-upload-simple",
        title: "Загрузить заявку",
        text: "Все файлы одной заявки сразу — или тендер одной кнопкой из «Тендеров и почты»."
      },
      {
        icon: "i-ph-hourglass-medium",
        title: "Дождаться разбора",
        text: "ИИ читает файлы и разбирает заявку по позициям."
      },
      {
        icon: "i-ph-identification-card",
        title: "Прочитать карточку",
        text: "Балл, рекомендация, правило и позиции заявки."
      },
      {
        icon: "i-ph-check-square-offset",
        title: "Решить",
        text: "Менеджер принимает или отклоняет заявку с причиной — решение сохраняется."
      }
    ],
    stages: [
      {
        icon: "i-ph-file-magnifying-glass",
        title: "Чтение файлов",
        tool: "PDF · Excel · Word · сканы",
        detail: "Из всех файлов заявки достаётся текст и таблицы."
      },
      {
        icon: "i-ph-brain",
        title: "Разбор по позициям",
        tool: "Dify · LLM",
        detail: "ИИ находит в заявке заказчика и позиции: что нужно и в каком количестве."
      },
      {
        icon: "i-ph-shield-check",
        title: "Проверка данных",
        tool: "Pydantic",
        detail: "Ответ ИИ проверяется: числа, единицы, обязательные поля."
      },
      {
        icon: "i-ph-list-checks",
        title: "Свод правил",
        tool: "правила",
        detail: "Позиции и заказчик сверяются с единым сводом правил."
      },
      {
        icon: "i-ph-gavel",
        title: "Итог",
        tool: "балл и рекомендация",
        detail:
          "Балл 0–100, рекомендация и правило, по которому она дана. Решает человек."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Веб-интерфейс",
          tech: "Next.js · React",
          text: "Загрузка, журнал заявок, карточка и свод правил."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "Заявки, решения и связка с «Тендерами и почтой»."
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
          id: "runs",
          name: "Заявки",
          tech: "база",
          text: "Заявки, позиции, баллы и решения."
        },
        {
          id: "files",
          name: "Оригиналы",
          tech: "хранилище",
          text: "Файлы заявки — их видно рядом с карточкой."
        },
        {
          id: "refs",
          name: "Справочники",
          tech: "каталог",
          text: "Каталог товаров и история предложений."
        }
      ],
      processing: [
        {
          id: "worker",
          name: "Обработчик",
          tech: "очередь",
          text: "Разбирает заявки по очереди и переживает перезапуск."
        },
        {
          id: "dify",
          name: "ИИ",
          tech: "Dify",
          text: "Разбор заявки, сопоставление с каталогом и итоговая рекомендация."
        },
        {
          id: "watchdog",
          name: "Мониторинг",
          tech: "Telegram",
          text: "Сломанные заявки и сбои — в чат."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-brain",
        title: "ИИ разбирает, правила решают",
        summary: "Рекомендация всегда с причиной",
        text: "ИИ достаёт из заявки позиции, а рекомендацию определяет свод правил — поэтому видно, почему заявка получила такой балл."
      },
      {
        icon: "i-ph-table",
        title: "Числа без искажений",
        summary: "Количества переносятся из файла как есть",
        text: "В больших таблицах ИИ указывает, где лежат данные, а сами числа берутся из файла — количества не искажаются."
      },
      {
        icon: "i-ph-user-check",
        title: "Решает человек",
        summary: "Фильтр рекомендует, менеджер решает",
        text: "Решения менеджеров сохраняются и сравниваются с рекомендациями — по ним видно, где правила стоит поправить."
      }
    ],
    numbers: [
      { area: "Заявки", value: "3 024", detail: "за 9 недель, около 77 тыс. позиций" },
      { area: "Отказы", value: "93%", detail: "решений об отклонении корректны" },
      {
        area: "В работу",
        value: "88%",
        detail: "рекомендованных заявок берут менеджеры"
      },
      {
        area: "Цикл",
        value: "~500 €",
        detail: "рабочего времени на заявку — внутренняя оценка"
      }
    ]
  },
  en: {
    title: "Request Filter",
    kicker: "Case · AI assessment of requests",
    lead: "The whole flow of requests — tenders, e-mails and enquiries — goes through the Filter: AI breaks each request into items, checks them against the rule set and gives a 0–100 score with a recommendation. The manager makes the decision.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "What",
        value: "Request assessment for sales and tenders"
      },
      { icon: "i-ph-files", term: "Input", value: "Excel, Word, PDF, scans, e-mails" },
      {
        icon: "i-ph-scales",
        term: "Output",
        value: "A 0–100 score and a recommendation with a reason"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Timeline",
        value: "August 2026 — now, in use"
      }
    ],
    problem: {
      before: [
        "Each manager decided by their own criteria whether to take a request",
        "There were no common rules — you couldn't tell why a request was taken or rejected",
        "Useless requests went through the whole chain of specialists"
      ],
      after: [
        "One rule set for every request",
        "Each request shows its items, score and the rule behind the recommendation",
        "Useless requests are visible at once, and the team's work is easy to trace"
      ]
    },
    steps: [
      {
        icon: "i-ph-upload-simple",
        title: "Upload",
        text: "All files of one request at once — or a tender in one click from Tenders & Mail."
      },
      {
        icon: "i-ph-hourglass-medium",
        title: "Wait for the reading",
        text: "AI reads the files and breaks the request into items."
      },
      {
        icon: "i-ph-identification-card",
        title: "Read the card",
        text: "Score, recommendation, rule and the request's items."
      },
      {
        icon: "i-ph-check-square-offset",
        title: "Decide",
        text: "The manager accepts or rejects the request with a reason — the decision is saved."
      }
    ],
    stages: [
      {
        icon: "i-ph-file-magnifying-glass",
        title: "Reading files",
        tool: "PDF · Excel · Word · scans",
        detail: "Text and tables are pulled out of every file of the request."
      },
      {
        icon: "i-ph-brain",
        title: "Items",
        tool: "Dify · LLM",
        detail: "AI finds the customer and the items: what is needed and how much."
      },
      {
        icon: "i-ph-shield-check",
        title: "Validation",
        tool: "Pydantic",
        detail: "AI's answer is checked: numbers, units, required fields."
      },
      {
        icon: "i-ph-list-checks",
        title: "Rule set",
        tool: "rules",
        detail: "The items and the customer are checked against one rule set."
      },
      {
        icon: "i-ph-gavel",
        title: "Result",
        tool: "score and recommendation",
        detail:
          "A 0–100 score, a recommendation and the rule behind it. A person decides."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Web app",
          tech: "Next.js · React",
          text: "Upload, the request log, the card and the rule set."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "Requests, decisions and the link with Tenders & Mail."
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
          id: "runs",
          name: "Requests",
          tech: "database",
          text: "Requests, items, scores and decisions."
        },
        {
          id: "files",
          name: "Originals",
          tech: "storage",
          text: "A request's files — shown next to the card."
        },
        {
          id: "refs",
          name: "Reference data",
          tech: "catalogue",
          text: "The product catalogue and quote history."
        }
      ],
      processing: [
        {
          id: "worker",
          name: "Worker",
          tech: "queue",
          text: "Reads requests one after another and survives restarts."
        },
        {
          id: "dify",
          name: "AI",
          tech: "Dify",
          text: "Reading the request, matching the catalogue and the final recommendation."
        },
        {
          id: "watchdog",
          name: "Monitoring",
          tech: "Telegram",
          text: "Broken requests and failures go to a chat."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-brain",
        title: "AI reads, rules decide",
        summary: "A recommendation always comes with a reason",
        text: "AI pulls the items out of the request and the rule set gives the recommendation — so you can see why a request got its score."
      },
      {
        icon: "i-ph-table",
        title: "Numbers as they are",
        summary: "Quantities are copied from the file",
        text: "In big tables AI points to where the data is, and the numbers are taken from the file itself — quantities aren't garbled."
      },
      {
        icon: "i-ph-user-check",
        title: "A person decides",
        summary: "The Filter recommends, the manager decides",
        text: "Managers' decisions are saved and compared with the recommendations — they show where the rules need tuning."
      }
    ],
    numbers: [
      { area: "Requests", value: "3,024", detail: "in 9 weeks, about 77k items" },
      { area: "Rejections", value: "93%", detail: "of rejection calls are correct" },
      {
        area: "Taken on",
        value: "88%",
        detail: "of recommended requests taken on by managers"
      },
      {
        area: "Cycle",
        value: "~€500",
        detail: "of staff time per request — internal estimate"
      }
    ]
  }
};

export default filter;

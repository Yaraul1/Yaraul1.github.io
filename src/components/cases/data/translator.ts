import type { ProjectCaseData } from "../types";

/** Document Translator: translation that keeps the layout, told at the level of task and result. */
const translator: ProjectCaseData = {
  id: "translator",
  art: "translator",
  firstNode: "pipeline",
  stack: [
    "Python",
    "FastAPI",
    "PostgreSQL",
    "Dify",
    "LLM (OpenAI)",
    "OCR",
    "PyMuPDF",
    "LibreOffice",
    "Next.js",
    "React",
    "Tailwind CSS",
    "Docker"
  ],
  ru: {
    title: "Переводчик документов",
    kicker: "Кейс · перевод с сохранением макета",
    lead: "Загружаешь скан, PDF, Word или Excel — получаешь тот же документ на другом языке: перевод стоит на месте оригинала, с теми же таблицами, печатями и подписями. Поправить можно прямо на листе.",
    facts: [
      { icon: "i-ph-briefcase", term: "Что это", value: "Сервис перевода документов" },
      { icon: "i-ph-files", term: "На входе", value: "PDF, сканы, фото, Word, Excel" },
      {
        icon: "i-ph-translate",
        term: "Языки",
        value: "На русский, английский и ещё 4 языка"
      },
      {
        icon: "i-ph-rocket-launch",
        term: "Статус",
        value: "Июль 2026 — сейчас, в эксплуатации"
      }
    ],
    problem: {
      before: [
        "Каждый документ отправляли переводчикам и ждали",
        "Текст переводили в Trados, сканы и картинки правили в Photoshop",
        "На одну страницу скана уходило 5–10 минут ручной работы"
      ],
      after: [
        "Загружаешь файл и через несколько минут забираешь готовый документ",
        "Перевод на месте оригинала: таблицы, печати и подписи сохраняются",
        "Огрехи исправляются прямо на листе, без других программ"
      ]
    },
    steps: [
      {
        icon: "i-ph-upload-simple",
        title: "Загрузка",
        text: "Файл и язык перевода — больше ничего не нужно."
      },
      {
        icon: "i-ph-hourglass-medium",
        title: "Обработка",
        text: "Видно, на каком этапе документ: распознавание, перевод, вёрстка, проверка."
      },
      {
        icon: "i-ph-columns",
        title: "Сравнение",
        text: "Оригинал и перевод рядом, страница к странице."
      },
      {
        icon: "i-ph-pencil-simple",
        title: "Правка и скачивание",
        text: "Исправить надпись прямо на листе и скачать готовый PDF."
      }
    ],
    stages: [
      {
        icon: "i-ph-scan",
        title: "Распознавание",
        tool: "OCR",
        detail: "Текст, таблицы и блоки страницы — со сканов, PDF, Word и Excel."
      },
      {
        icon: "i-ph-books",
        title: "Словарь документа",
        tool: "LLM · глоссарий",
        detail:
          "Сначала собираются термины и тема документа, чтобы один и тот же термин везде переводился одинаково."
      },
      {
        icon: "i-ph-translate",
        title: "Перевод",
        tool: "Dify · LLM",
        detail:
          "Страницы переводятся с этим словарём; числа и коды остаются как в оригинале."
      },
      {
        icon: "i-ph-eraser",
        title: "Удаление оригинала",
        tool: "обработка изображений",
        detail: "Исходный текст стирается, а линии таблиц, печати и подписи остаются."
      },
      {
        icon: "i-ph-text-aa",
        title: "Вёрстка",
        tool: "PDF",
        detail:
          "Перевод встаёт на место оригинала тем же размером; если не помещается — подбирается короче."
      },
      {
        icon: "i-ph-magnifying-glass",
        title: "Проверка",
        tool: "автоматически",
        detail:
          "Готовый лист проверяется: текст не залез на печать, не вышел из клетки, оригинал стёрт."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Веб-интерфейс",
          tech: "Next.js · React",
          text: "Загрузка, ход обработки, сравнение с оригиналом и правка на листе."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "Документы, задания, правки и права доступа."
        },
        {
          id: "sso",
          name: "Вход",
          tech: "корпоративные учётные записи",
          text: "Вход по рабочей учётке."
        }
      ],
      data: [
        {
          id: "db",
          name: "База",
          tech: "PostgreSQL",
          text: "Документы, страницы, правки и словарь переводов."
        },
        {
          id: "files",
          name: "Файлы",
          tech: "хранилище",
          text: "Оригиналы и версии готовых документов."
        }
      ],
      processing: [
        {
          id: "pipeline",
          name: "Конвейер страниц",
          tech: "Python",
          text: "Распознавание, перевод, стирание, вёрстка и проверка — страница за страницей."
        },
        {
          id: "dify",
          name: "ИИ",
          tech: "Dify · LLM",
          text: "Словарь документа, перевод, сокращение и проверка — отдельными задачами."
        },
        {
          id: "worker",
          name: "Очередь",
          tech: "фоновый процесс",
          text: "Задания переживают перезапуск и не теряются."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-files",
        title: "Перевод на месте оригинала",
        summary: "Документ остаётся тем же документом",
        text: "Перевод встаёт туда, где был исходный текст, — таблицы, печати и подписи на своих местах, документ не нужно собирать заново."
      },
      {
        icon: "i-ph-books",
        title: "Одни термины на весь документ",
        summary: "Сначала словарь, потом перевод",
        text: "Термины и тема документа собираются до перевода страниц, поэтому одно и то же слово переводится везде одинаково."
      },
      {
        icon: "i-ph-pencil-simple",
        title: "Правка прямо на листе",
        summary: "Без других программ",
        text: "Заметил огрех — исправляешь надпись прямо на странице, сохраняешь и получаешь новую версию PDF."
      }
    ],
    numbers: [
      {
        area: "Скорость",
        value: "9,8 мин",
        detail: "медиана на документ из нескольких страниц"
      },
      { area: "Было", value: "5–10 мин", detail: "ручной работы на одну страницу скана" },
      { area: "Форматы", value: "4", detail: "PDF, сканы, Word и Excel" },
      { area: "Языки", value: "6", detail: "русский, английский и ещё 4" }
    ]
  },
  en: {
    title: "Document Translator",
    kicker: "Case · translation that keeps the layout",
    lead: "Upload a scan, PDF, Word or Excel file — get the same document in another language: the translation sits where the original was, with the same tables, seals and signatures. Fix it right on the page.",
    facts: [
      { icon: "i-ph-briefcase", term: "What", value: "A document translation service" },
      { icon: "i-ph-files", term: "Input", value: "PDFs, scans, photos, Word, Excel" },
      {
        icon: "i-ph-translate",
        term: "Languages",
        value: "Into Russian, English and 4 more"
      },
      { icon: "i-ph-rocket-launch", term: "Status", value: "July 2026 — now, in use" }
    ],
    problem: {
      before: [
        "Every document went to the translators, and you waited",
        "Text was translated in Trados; scans and images were fixed in Photoshop",
        "A scanned page took 5–10 minutes of manual work"
      ],
      after: [
        "Upload a file and take the finished document a few minutes later",
        "The translation sits where the original was: tables, seals and signatures stay",
        "Flaws are fixed right on the page, with no other software"
      ]
    },
    steps: [
      {
        icon: "i-ph-upload-simple",
        title: "Upload",
        text: "A file and a target language — nothing else."
      },
      {
        icon: "i-ph-hourglass-medium",
        title: "Processing",
        text: "You see the stage: recognition, translation, typesetting, checks."
      },
      {
        icon: "i-ph-columns",
        title: "Compare",
        text: "The original and the translation side by side, page by page."
      },
      {
        icon: "i-ph-pencil-simple",
        title: "Edit and download",
        text: "Fix a caption right on the page and download the finished PDF."
      }
    ],
    stages: [
      {
        icon: "i-ph-scan",
        title: "Recognition",
        tool: "OCR",
        detail: "Text, tables and blocks of the page — from scans, PDFs, Word and Excel."
      },
      {
        icon: "i-ph-books",
        title: "Document glossary",
        tool: "LLM · glossary",
        detail:
          "The terms and topic are gathered first, so the same term is translated the same way everywhere."
      },
      {
        icon: "i-ph-translate",
        title: "Translation",
        tool: "Dify · LLM",
        detail:
          "Pages are translated with that glossary; numbers and codes stay as in the original."
      },
      {
        icon: "i-ph-eraser",
        title: "Erasing the original",
        tool: "image processing",
        detail: "The source text is erased while table lines, seals and signatures stay."
      },
      {
        icon: "i-ph-text-aa",
        title: "Typesetting",
        tool: "PDF",
        detail:
          "The translation takes the original's place at the same size; if it doesn't fit, a shorter wording is chosen."
      },
      {
        icon: "i-ph-magnifying-glass",
        title: "Checks",
        tool: "automatic",
        detail:
          "The finished page is checked: no text over a seal, nothing out of a cell, the original erased."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Web app",
          tech: "Next.js · React",
          text: "Upload, progress, comparison with the original and editing on the page."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "Documents, jobs, edits and access rights."
        },
        {
          id: "sso",
          name: "Sign-in",
          tech: "company accounts",
          text: "Sign-in with a work account."
        }
      ],
      data: [
        {
          id: "db",
          name: "Database",
          tech: "PostgreSQL",
          text: "Documents, pages, edits and the translation glossary."
        },
        {
          id: "files",
          name: "Files",
          tech: "storage",
          text: "Originals and versions of the finished documents."
        }
      ],
      processing: [
        {
          id: "pipeline",
          name: "Page pipeline",
          tech: "Python",
          text: "Recognition, translation, erasing, typesetting and checks — page by page."
        },
        {
          id: "dify",
          name: "AI",
          tech: "Dify · LLM",
          text: "The document glossary, translation, shortening and checks as separate tasks."
        },
        {
          id: "worker",
          name: "Queue",
          tech: "background process",
          text: "Jobs survive restarts and aren't lost."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-files",
        title: "Translation in place",
        summary: "The document stays the same document",
        text: "The translation goes where the source text was — tables, seals and signatures stay put, so the document doesn't have to be rebuilt."
      },
      {
        icon: "i-ph-books",
        title: "One set of terms per document",
        summary: "Glossary first, then translation",
        text: "The terms and topic are gathered before the pages are translated, so the same word is translated the same way everywhere."
      },
      {
        icon: "i-ph-pencil-simple",
        title: "Editing on the page",
        summary: "No other software",
        text: "Spot a flaw — fix the caption right on the page, save, and get a new PDF version."
      }
    ],
    numbers: [
      { area: "Speed", value: "9.8 min", detail: "median per multi-page document" },
      { area: "Before", value: "5–10 min", detail: "of manual work per scanned page" },
      { area: "Formats", value: "4", detail: "PDF, scans, Word and Excel" },
      { area: "Languages", value: "6", detail: "Russian, English and 4 more" }
    ]
  }
};

export default translator;

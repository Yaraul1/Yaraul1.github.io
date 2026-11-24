import type { ProjectCaseData } from "../types";

/** BONADI: the site of a women's knitwear brand on 1C-Bitrix (built June–August 2026, live). */
const bonadi: ProjectCaseData = {
  id: "bonadi",
  art: "bonadi",
  firstNode: "aggregates",
  site: "https://bonadi.by/",
  stack: [
    "PHP 8.3",
    "1С-Битрикс «Старт»",
    "MySQL 8",
    "JavaScript (ES2020, без сборщика)",
    "CSS",
    "GD · WebP",
    "Telegram Bot API",
    "Docker",
    "Bash · rsync"
  ],
  ru: {
    title: "BONADI",
    kicker: "Кейс · сайт бренда",
    lead: "Сайт фабрики женского трикотажа — красивая визитная карточка магазина.",
    facts: [
      { icon: "i-ph-t-shirt", term: "Что это", value: "Сайт-витрина бренда трикотажа" },
      {
        icon: "i-ph-stack",
        term: "Платформа",
        value: "1С-Битрикс «Старт»"
      },
      { icon: "i-ph-layout", term: "Сайт", value: "8 разделов, каталог и админка" },
      {
        icon: "i-ph-calendar-blank",
        term: "Сроки",
        value: "Июнь — август 2026, работает"
      }
    ],
    stages: [
      {
        icon: "i-ph-browser",
        title: "Шаблон сайта",
        tool: "PHP · JS",
        detail:
          "Страницы на PHP и вся логика интерфейса в одном модуле на чистом JavaScript, без сборщика; 18 файлов стилей."
      },
      {
        icon: "i-ph-tag",
        title: "Каталог",
        tool: "инфоблоки",
        detail:
          "Две связанные сущности — модели и цветовые варианты. На событиях Битрикса пересчитываются цена «от», цвета и размеры модели."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Заявки",
        tool: "OnProlog → Telegram",
        detail:
          "Отправка формы перехватывается до штатного редиректа: проверки и антиспам, запись в инфоблок заявок и уведомление в Telegram."
      },
      {
        icon: "i-ph-sliders",
        title: "Админка",
        tool: "Битрикс + свои страницы",
        detail:
          "Переписанная админка — понятнее и удобнее штатной, но не отдельная система: надстройка над админкой Битрикса, работает с теми же данными."
      },
      {
        icon: "i-ph-rocket-launch",
        title: "Эксплуатация",
        tool: "rsync · cron",
        detail:
          "Деплой из Git с проверкой живого сайта и откатом; логи с request-id и ночная очистка временных фото."
      }
    ],
    architecture: {
      request: [
        {
          id: "site",
          name: "Сайт",
          tech: "PHP + JS",
          text: "Публичные страницы и каталог, который обновляется без перезагрузки."
        },
        {
          id: "forms",
          name: "Формы",
          tech: "PHP",
          text: "Вопрос о товаре, сотрудничество и контакты."
        },
        {
          id: "admin",
          name: "Админка",
          tech: "Битрикс + BONADI",
          text: "Надстройка над штатной админкой: свои страницы на тех же данных."
        }
      ],
      data: [
        {
          id: "mysql",
          name: "Каталог и заявки",
          tech: "MySQL 8 · инфоблоки",
          text: "Модели, цвета и варианты, заявки и справочники."
        },
        {
          id: "photos",
          name: "Фото",
          tech: "WebP",
          text: "Все фото приводятся к WebP до 2000 px."
        },
        {
          id: "logs",
          name: "Логи",
          tech: "JSONL",
          text: "Сквозной request-id и журнал событий."
        }
      ],
      processing: [
        {
          id: "aggregates",
          name: "Пересчёт модели",
          tech: "PHP",
          text: "Обработчики событий собирают цену «от», палитру и размеры модели из её вариантов."
        },
        {
          id: "leads",
          name: "Приём заявок",
          tech: "PHP",
          text: "Проверка сессии, ловушка для ботов, согласие на обработку данных и лимит частоты."
        },
        {
          id: "webp",
          name: "Фото",
          tech: "GD",
          text: "Сжатие в WebP, качество 85, до 2000 px по большей стороне."
        },
        {
          id: "telegram",
          name: "Уведомления",
          tech: "Telegram Bot API",
          text: "Каждая заявка приходит менеджеру в Telegram."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-tag",
        title: "Модель и её цвета",
        summary: "Две связанные сущности, пересчёт на событиях",
        text: "Цена «от», цвета и размеры модели пересчитываются на событиях добавления, изменения и удаления. При удалении родитель запоминается до события, а пересчёт идёт после."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Заявки без форм и CRM",
        summary: "Перехват отправки до штатного редиректа",
        text: "Проверки: сессия, скрытое поле-ловушка для ботов, согласие и не чаще раза в 8 секунд. Для Telegram сделано своё событие, чтобы уведомление не мешало сохранению."
      },
      {
        icon: "i-ph-image",
        title: "Чистка фото без потерь",
        summary: "Удаляется только то, на что никто не ссылается",
        text: "Битрикс хранит одинаковые файлы один раз, поэтому живые фото остаются во временной папке. Очистка удаляет файлы старше 48 часов и только без ссылок из галерей и превью."
      },
      {
        icon: "i-ph-squares-four",
        title: "Каталог без перезагрузок",
        summary: "AJAX, история браузера и стабильная вёрстка",
        text: "Сетка и фильтры меняются без перезагрузки, «назад» работает, высота фиксируется против скачков. Поиск идёт через свой параметр: стандартный переводил каталог в режим, где страница падала."
      },
      {
        icon: "i-ph-text-aa",
        title: "Текст в петле на фото",
        summary: "Пересчёт геометрии object-fit: cover",
        text: "Панель с текстом ставится в экранные координаты петли на фотографии при любом размере окна, масштабе и на телефоне; есть спокойный вариант анимации."
      },
      {
        icon: "i-ph-rocket-launch",
        title: "Деплой с откатом",
        summary: "Проверка живого сайта и возврат версии",
        text: "Скрипт деплоя проверяет живой сайт и при ошибке откатывается на прошлый коммит. Обёртка лежит вне репозитория, чтобы не перезаписать саму себя."
      }
    ],
    numbers: [
      {
        area: "Код",
        value: "≈24k",
        detail: "строк своего PHP, JS и CSS без ядра Битрикса"
      },
      {
        area: "Админка",
        value: "4",
        detail: "свои страницы для быстрого ввода ассортимента"
      },
      {
        area: "История",
        value: "41",
        detail: "коммит, июнь — август 2026"
      },
      { area: "Сайт", value: "8", detail: "разделов с каталогом и заявками" }
    ]
  },
  en: {
    title: "BONADI",
    kicker: "Case · brand website",
    lead: "The website of a women's knitwear factory — a good-looking business card for the shop.",
    facts: [
      { icon: "i-ph-t-shirt", term: "What", value: "Showcase site of a knitwear brand" },
      {
        icon: "i-ph-stack",
        term: "Platform",
        value: "1C-Bitrix “Start”"
      },
      {
        icon: "i-ph-layout",
        term: "Site",
        value: "8 sections, a catalogue and an admin"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Timeline",
        value: "June — August 2026, live"
      }
    ],
    stages: [
      {
        icon: "i-ph-browser",
        title: "Site template",
        tool: "PHP · JS",
        detail:
          "Pages in PHP and all interface logic in one plain JavaScript module, no bundler; 18 stylesheets."
      },
      {
        icon: "i-ph-tag",
        title: "Catalogue",
        tool: "info blocks",
        detail:
          "Two linked entities — models and colour variants. Bitrix events recalculate a model's starting price, colours and sizes."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Enquiries",
        tool: "OnProlog → Telegram",
        detail:
          "The form post is caught before Bitrix redirects: checks and anti-spam, a record in the enquiries block and a Telegram message."
      },
      {
        icon: "i-ph-sliders",
        title: "Admin",
        tool: "Bitrix + own pages",
        detail:
          "A rewritten admin — clearer and easier than the stock one, but not a separate system: an add-on over the Bitrix admin that works with the same data."
      },
      {
        icon: "i-ph-rocket-launch",
        title: "Operations",
        tool: "rsync · cron",
        detail:
          "Deploys from Git with a live-site check and rollback; logs with a request id and a nightly clean-up of temporary photos."
      }
    ],
    architecture: {
      request: [
        {
          id: "site",
          name: "Site",
          tech: "PHP + JS",
          text: "Public pages and a catalogue that updates without reloading."
        },
        {
          id: "forms",
          name: "Forms",
          tech: "PHP",
          text: "Product questions, partnership and contacts."
        },
        {
          id: "admin",
          name: "Admin",
          tech: "Bitrix + BONADI",
          text: "An add-on over the stock admin: custom pages on the same data."
        }
      ],
      data: [
        {
          id: "mysql",
          name: "Catalogue & enquiries",
          tech: "MySQL 8 · info blocks",
          text: "Models, colours and variants, enquiries and reference lists."
        },
        {
          id: "photos",
          name: "Photos",
          tech: "WebP",
          text: "Every photo is brought to WebP, up to 2000 px."
        },
        {
          id: "logs",
          name: "Logs",
          tech: "JSONL",
          text: "A request id end to end, plus an event log."
        }
      ],
      processing: [
        {
          id: "aggregates",
          name: "Model totals",
          tech: "PHP",
          text: "Event handlers build a model's starting price, palette and sizes from its variants."
        },
        {
          id: "leads",
          name: "Enquiry intake",
          tech: "PHP",
          text: "Session check, a honeypot for bots, consent to data processing and a rate limit."
        },
        {
          id: "webp",
          name: "Photos",
          tech: "GD",
          text: "WebP at quality 85, up to 2000 px on the long side."
        },
        {
          id: "telegram",
          name: "Notifications",
          tech: "Telegram Bot API",
          text: "Every enquiry reaches the manager in Telegram."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-tag",
        title: "A model and its colours",
        summary: "Two linked entities, recalculated on events",
        text: "A model's starting price, colours and sizes are recalculated on add, update and delete. On delete the parent is remembered before the event and recalculated after it."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Enquiries without forms or CRM",
        summary: "Catching the post before Bitrix redirects",
        text: "Checks: session, a hidden honeypot field, consent and at most one post every 8 seconds. Telegram gets its own event, so a slow message never blocks saving."
      },
      {
        icon: "i-ph-image",
        title: "Safe photo clean-up",
        summary: "Only files nothing points to are removed",
        text: "Bitrix stores identical files once, so live photos stay in the temporary folder. The clean-up removes files older than 48 hours and only those no gallery or preview refers to."
      },
      {
        icon: "i-ph-squares-four",
        title: "A catalogue without reloads",
        summary: "AJAX, browser history and stable layout",
        text: "The grid and filters change in place, back works and the height is held against jumps. Search uses its own parameter: the standard one switched the catalogue into a mode where the page crashed."
      },
      {
        icon: "i-ph-text-aa",
        title: "Text inside the loop",
        summary: "Recomputing object-fit: cover",
        text: "The text panel is placed at the loop's screen position on the photo at any window size, zoom level and on phones; there is a calm motion variant."
      },
      {
        icon: "i-ph-rocket-launch",
        title: "Deploys with rollback",
        summary: "Live-site check, version restore",
        text: "The deploy script probes the live site and on failure rolls back to the previous commit. Its wrapper lives outside the repo so it never overwrites itself."
      }
    ],
    numbers: [
      {
        area: "Code",
        value: "≈24k",
        detail: "lines of own PHP, JS and CSS, without the Bitrix core"
      },
      {
        area: "Admin",
        value: "4",
        detail: "custom pages for entering the range fast"
      },
      {
        area: "History",
        value: "41",
        detail: "commits, June — August 2026"
      },
      { area: "Site", value: "8", detail: "sections with the catalogue and enquiries" }
    ]
  }
};

export default bonadi;

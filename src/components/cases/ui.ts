import type { Lang } from "~/i18n/lang";

const ru = {
  sectionsNav: "Разделы кейса",
  back: "Проекты",
  expand: "На весь экран",
  collapse: "Уменьшить",
  expandTitle: "На весь экран",
  collapseTitle: "Выйти из полноэкранного режима (Esc)",
  howItWorks: "Как устроено",
  tryDemo: "Попробовать демо",
  openSite: "Открыть сайт",
  siteHint: "Сайт работает — откройте и посмотрите вживую",
  siteNote: "Откроется в новой вкладке",
  sections: {
    overview: "Обзор",
    flow: "Как пользоваться",
    demo: "Демо",
    site: "Сайт",
    inside: "Внутри",
    architecture: "Архитектура",
    bridge: "Связка",
    decisions: "Решения",
    code: "Код"
  },
  chapters: {
    problem: { title: "Задача", lead: "Что было до проекта и что стало." },
    flow: { title: "Как пользоваться", lead: "Путь пользователя по шагам." },
    demo: {
      title: "Попробуйте сами",
      lead: "Интерфейс как в настоящем приложении, данные вымышленные. Всё можно нажимать."
    },
    site: {
      title: "Живой сайт",
      lead: "Проект работает в интернете — его можно открыть и пройти самому."
    },
    inside: { title: "Что внутри", lead: "Что происходит с данными, этап за этапом." },
    architecture: { title: "Архитектура", lead: "Из чего состоит система." },
    decisions: { title: "Решения", lead: "Что было непросто и как это решено." },
    code: { title: "Код", lead: "Ключевые фрагменты с пояснениями." }
  },
  before: "Было",
  after: "Стало",
  step: (n: number, total: number) => `Этап ${n} из ${total}`,
  archHint: "Нажмите на блок, чтобы узнать, что он делает",
  lanes: { request: "Вход", data: "Данные", processing: "Обработка" },
  more: "Подробнее",
  less: "Свернуть",
  numbers: "В цифрах",
  stack: "Стек",
  codeTabs: "Фрагменты кода"
};

type CaseUi = typeof ru;

const en: CaseUi = {
  sectionsNav: "Case sections",
  back: "Projects",
  expand: "Full screen",
  collapse: "Exit full screen",
  expandTitle: "Full screen",
  collapseTitle: "Exit full screen (Esc)",
  howItWorks: "How it works",
  tryDemo: "Try the demo",
  openSite: "Open the site",
  siteHint: "The site is live — open it and see for yourself",
  siteNote: "Opens in a new tab",
  sections: {
    overview: "Overview",
    flow: "How to use",
    demo: "Demo",
    site: "Website",
    inside: "Inside",
    architecture: "Architecture",
    bridge: "Connection",
    decisions: "Decisions",
    code: "Code"
  },
  chapters: {
    problem: { title: "The problem", lead: "What it was like before, and after." },
    flow: { title: "How to use it", lead: "The user's path, step by step." },
    demo: {
      title: "Try it yourself",
      lead: "The interface of the real app with made-up data. Everything is clickable."
    },
    site: {
      title: "The live site",
      lead: "The project is online — open it and go through it yourself."
    },
    inside: { title: "Inside", lead: "What happens to the data, stage by stage." },
    architecture: { title: "Architecture", lead: "What the system is made of." },
    decisions: { title: "Decisions", lead: "What was hard and how it was solved." },
    code: { title: "Code", lead: "Key fragments, explained." }
  },
  before: "Before",
  after: "After",
  step: (n: number, total: number) => `Stage ${n} of ${total}`,
  archHint: "Click a block to see what it does",
  lanes: { request: "Input", data: "Data", processing: "Processing" },
  more: "More",
  less: "Less",
  numbers: "In numbers",
  stack: "Stack",
  codeTabs: "Code samples"
};

export const caseUi: Record<Lang, CaseUi> = { ru, en };

export const portfolio = {
  name: "Yaroslav Yuferev",
  role: "AI Engineer",
  initials: "YY",
  email: "",
  github: "",
  telegram: "",
  resume: "",
  bio: "Это моё пространство в интернете: проекты, идеи и работа с искусственным интеллектом.",
  projects: [
    {
      title: "LegalHub",
      category: "DOCUMENT AUTOMATION",
      description:
        "Пакетная обработка документов: подписание с поиском места для штампа через Dify и заверение копий. Интерактивный пример, архитектура и фрагменты кода.",
      tags: ["Next.js", "FastAPI", "Dify", "PostgreSQL", "MinIO"],
      demo: "legalhub"
    }
  ] as {
    title: string;
    category: string;
    description: string;
    tags: string[];
    url?: string;
    source?: string;
    demo?: string;
  }[]
};
export function openPortfolioApp(id: string) {
  window.dispatchEvent(new CustomEvent("yar:open", { detail: id }));
}

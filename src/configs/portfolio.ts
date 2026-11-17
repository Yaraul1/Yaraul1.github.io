export const portfolio = {
  name: "Yaroslav Yuferev",
  role: "AI Engineer",
  initials: "YY",
  email: "",
  github: "",
  telegram: "",
  resume: "",
  bio: "Привет, я Ярослав. Это моё пространство в интернете: проекты, идеи и работа с искусственным интеллектом.",
  projects: [] as {
    title: string;
    category: string;
    description: string;
    tags: string[];
    url?: string;
    source?: string;
  }[]
};
export function openPortfolioApp(id: string) {
  window.dispatchEvent(new CustomEvent("yar:open", { detail: id }));
}

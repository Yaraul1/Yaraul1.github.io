import type { AppsData } from "~/types";
import { Profile, Projects, Contact, Readme } from "~/components/apps/Portfolio";
import Terminal from "~/components/apps/Terminal";
const apps: AppsData[] = [
  {
    id: "profile",
    title: "Обо мне",
    desktop: true,
    img: "/icons/profile.png",
    width: 900,
    height: 562,
    show: true,
    x: -40,
    y: -10,
    content: <Profile />
  },
  {
    id: "projects",
    title: "Проекты",
    desktop: true,
    img: "/icons/projects.png",
    width: 1120,
    height: 700,
    x: 25,
    y: 0,
    content: <Projects />
  },
  {
    id: "terminal",
    title: "Терминал",
    desktop: true,
    img: "/icons/terminal.png",
    width: 700,
    height: 440,
    x: 40,
    y: 20,
    content: <Terminal />
  },
  {
    id: "contact",
    dock: false,
    title: "Контакты",
    desktop: true,
    img: "/icons/contact.png",
    width: 620,
    height: 560,
    x: 70,
    y: 0,
    content: <Contact />
  },
  {
    id: "readme",
    title: "Об этой ОС",
    desktop: true,
    img: "/icons/readme.png",
    width: 640,
    height: 530,
    x: 0,
    y: 0,
    content: <Readme />
  }
];
export default apps;

import type { AppsData } from "~/types";
import { Profile, Projects, Readme } from "~/components/apps/Portfolio";
import Mail from "~/components/apps/Mail";
import Terminal from "~/components/apps/Terminal";
const apps: AppsData[] = [
  {
    id: "profile",
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
    desktop: true,
    toolbar: true,
    img: "/icons/projects.png",
    width: 1180,
    height: 780,
    x: 25,
    y: 0,
    content: <Projects />
  },
  {
    id: "terminal",
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
    desktop: true,
    toolbar: true,
    img: "/icons/contact.png",
    width: 920,
    height: 640,
    x: 70,
    y: 0,
    content: <Mail />
  },
  {
    id: "readme",
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

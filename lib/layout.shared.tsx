import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "InkHive Docs",
    },
    githubUrl: "https://github.com/Abhiraj35/ai-content-marketing",
    themeSwitch: {
      enabled: false,
    },
    links: [
      {
        text: "App",
        url: "/",
        active: "none",
      },
      {
        text: "Docs",
        url: "/docs",
        active: "url",
      },
    ],
  };
}

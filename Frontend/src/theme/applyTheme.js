import { themeColors } from "./themeColors";

export function applyTheme(themeKey) {
  const theme = themeColors[themeKey];
  if (!theme) return;

  const root = document.documentElement;

  root.style.setProperty("--user-primary", theme.primary);
  root.style.setProperty("--user-secondary", theme.secondary);
  root.style.setProperty("--user-primary-foreground", theme.foreground);

  root.setAttribute("data-theme", "custom");

  // persist theme
  localStorage.setItem("theme", themeKey);
}

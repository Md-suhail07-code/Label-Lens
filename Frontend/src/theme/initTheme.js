import { applyTheme } from "./applyTheme";

export function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    applyTheme(savedTheme);
  }
}

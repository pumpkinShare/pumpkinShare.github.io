export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "shokax-color-scheme";

function getStoredTheme(win: Window): ThemeMode | null {
  try {
    const stored = win.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch (err) {
    // Ignore storage errors (private mode, etc.)
    console.warn("[ShokaX] Unable to read theme from storage", err);
  }
  return null;
}

function getPreferredTheme(win: Window): ThemeMode {
  return win.matchMedia && win.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(doc: Document, theme: ThemeMode) {
  doc.documentElement.setAttribute("data-theme", theme);
}

export function initTheme(doc: Document, win: Window): ThemeMode {
  const theme = getStoredTheme(win) ?? getPreferredTheme(win);
  applyTheme(doc, theme);
  return theme;
}

/**
 * 检查是否支持 View Transitions API
 */
function supportsViewTransitions(doc: Document): boolean {
  return "startViewTransition" in doc;
}

/**
 * 检查用户是否偏好减少动画
 */
function prefersReducedMotion(win: Window): boolean {
  return win.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 带淡入淡出动画的主题切换
 * 使用 View Transitions API 实现平滑的主题切换动画
 * @param doc Document 对象
 * @param win Window 对象
 * @param current 当前主题
 * @returns 切换后的主题
 */
export function toggleThemeWithTransition(
  doc: Document,
  win: Window,
  current: ThemeMode,
): ThemeMode {
  const next: ThemeMode = current === "dark" ? "light" : "dark";

  // 降级处理：不支持 View Transitions 或用户偏好减少动画
  if (!supportsViewTransitions(doc) || prefersReducedMotion(win)) {
    applyTheme(doc, next);
    try {
      win.localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      console.warn("[ShokaX] Unable to persist theme", err);
    }
    return next;
  }

  // 执行视图过渡
  const transition = doc.startViewTransition(() => {
    applyTheme(doc, next);
  });

  transition.finished
    .then(() => {
      try {
        win.localStorage.setItem(STORAGE_KEY, next);
      } catch (err) {
        console.warn("[ShokaX] Unable to persist theme", err);
      }
    })
    .catch((err) => {
      console.warn("[ShokaX] Theme transition failed", err);
    });

  return next;
}

/**
 * 兼容旧版本的无动画切换（保留向后兼容）
 */
export function toggleTheme(doc: Document, win: Window, current: ThemeMode): ThemeMode {
  const next: ThemeMode = current === "dark" ? "light" : "dark";
  applyTheme(doc, next);
  try {
    win.localStorage.setItem(STORAGE_KEY, next);
  } catch (err) {
    console.warn("[ShokaX] Unable to persist theme", err);
  }
  return next;
}

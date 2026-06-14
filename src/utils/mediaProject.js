/**
 * mediaProject.js
 *
 * Lightweight shared state so a single creative project can flow across
 * Media Studio -> Script Writer -> Video Editor without a backend round-trip.
 * Uses sessionStorage (artifacts/localStorage caveats don't apply in the
 * real Vite app; this is production app code, not a sandboxed artifact).
 */

const KEY = "media_project_v1";

export function emptyProject() {
  return {
    id: `proj_${Date.now()}`,
    title: "",
    vision: "",
    brandId: "",
    tone: "Professional",
    platform: "Instagram",
    ratio: "9:16",
    script: "",
    scenes: [], // [{ text, imagePrompt, imageUrl }]
    audioUrl: "",
    videoUrl: "",
    updatedAt: Date.now(),
  };
}

export function loadProject() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

export function saveProject(project) {
  try {
    const next = { ...project, updatedAt: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch (_e) {
    return project;
  }
}

export function clearProject() {
  try { sessionStorage.removeItem(KEY); } catch (_e) {}
}

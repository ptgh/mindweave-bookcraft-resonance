// Runtime deploy hardening:
// Safari (and others) can keep stale HTML/chunk maps after deploys.
// When a dynamic import/chunk load fails, we reload once with a cache-busting query.

declare const __APP_BUILD_ID__: string | undefined;

const BUILD_ID = typeof __APP_BUILD_ID__ === "string" ? __APP_BUILD_ID__ : "dev";
const RELOAD_KEY = `leafnode:app_update_reloaded:${BUILD_ID}`;

function isChunkLoadError(err: unknown): boolean {
  const message =
    typeof err === "string"
      ? err
      : (err as any)?.message ?? (err as any)?.toString?.() ?? "";

  return /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module|Unable to preload CSS/i.test(
    String(message)
  );
}

function reloadOnceWithCacheBust() {
  if (typeof window === "undefined") return;

  try {
    if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
    sessionStorage.setItem(RELOAD_KEY, "1");

    const url = new URL(window.location.href);
    url.searchParams.set("v", BUILD_ID);
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

export function setupAppUpdateRecovery() {
  if (typeof window === "undefined") return;

  // Vite emits this event when preloading dynamic imports fails.
  window.addEventListener("vite:preloadError", (event: Event) => {
    // Some browsers attach error details differently.
    const anyEvent = event as any;
    if (isChunkLoadError(anyEvent?.reason ?? anyEvent?.message ?? "vite:preloadError")) {
      reloadOnceWithCacheBust();
    }
  });

  // Covers Safari's "Failed to fetch dynamically imported module" cases.
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    if (isChunkLoadError(event.reason)) {
      event.preventDefault?.();
      reloadOnceWithCacheBust();
    }
  });

  window.addEventListener("error", (event: Event) => {
    const e = event as ErrorEvent;
    if (isChunkLoadError(e.error ?? e.message)) {
      e.preventDefault?.();
      reloadOnceWithCacheBust();
    }
  });
}

export const APP_BUILD_ID = BUILD_ID;

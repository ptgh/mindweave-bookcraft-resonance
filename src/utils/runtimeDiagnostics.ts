import type { ErrorInfo } from "react";
import { APP_BUILD_ID } from "@/utils/appUpdateRecovery";

export type RuntimeErrorKind =
  | "react_error_boundary"
  | "window_error"
  | "unhandled_rejection";

export type RuntimeErrorReport = {
  id: string;
  kind: RuntimeErrorKind;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  buildId: string;
  timestamp: string;
  extra?: Record<string, unknown>;
};

const STORAGE_KEY = "leafnode:last_runtime_error";

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function makeErrorId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeToError(reason: unknown): Error {
  if (reason instanceof Error) return reason;
  if (typeof reason === "string") return new Error(reason);
  return new Error(safeStringify(reason));
}

export function getLastRuntimeError(): RuntimeErrorReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RuntimeErrorReport;
  } catch {
    return null;
  }
}

export function reportRuntimeError(
  kind: RuntimeErrorKind,
  error: unknown,
  extra?: Record<string, unknown>
): string {
  if (typeof window === "undefined") return "server";

  const err = normalizeToError(error);
  const report: RuntimeErrorReport = {
    id: makeErrorId(),
    kind,
    message: err.message || "(no message)",
    stack: err.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    buildId: APP_BUILD_ID,
    timestamp: new Date().toISOString(),
    extra,
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, safeStringify(report));
  } catch {
    // ignore
  }

  // High-signal console output for debugging across browsers.
  console.error("[Leafnode][RuntimeError]", report);

  return report.id;
}

export function captureReactErrorBoundary(error: Error, info: ErrorInfo): string {
  return reportRuntimeError("react_error_boundary", error, {
    componentStack: info.componentStack,
  });
}

export async function copyLastRuntimeErrorToClipboard(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const report = getLastRuntimeError();
  if (!report) return false;

  const text = safeStringify(report);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function setupRuntimeDiagnostics() {
  if (typeof window === "undefined") return;

  // Avoid double-registration in HMR/dev.
  const w = window as any;
  if (w.__LEAFNODE_DIAGNOSTICS_SETUP__) return;
  w.__LEAFNODE_DIAGNOSTICS_SETUP__ = true;

  window.addEventListener("error", (event: Event) => {
    const e = event as ErrorEvent;
    reportRuntimeError("window_error", e.error ?? e.message ?? "window_error", {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    reportRuntimeError("unhandled_rejection", event.reason, {
      reasonType: typeof event.reason,
    });
  });

  // Expose a tiny, read-only debug surface for support.
  w.__LEAFNODE_DIAGNOSTICS__ = {
    buildId: APP_BUILD_ID,
    getLastRuntimeError,
  };
}

import type { CategorySummary, LoginResponse, RecommendationResponse } from "@/types/pipeline";

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL as string;
  }
  if (typeof window !== "undefined") {
    if (["5173", "4173"].includes(window.location.port)) {
      return "http://localhost:3300/api";
    }
    return `${window.location.origin.replace(/\/$/, "")}/api`;
  }
  return "/api";
};

const API_BASE_URL = resolveApiBaseUrl();

const withBase = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, "")}${normalized}`;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(withBase(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res.json() as Promise<T>;
}

export const api = {
  login(payload: { username: string; password: string }) {
    return request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  listCategories() {
    return request<{ items: CategorySummary[] }>("/categories");
  },
  getRecommendations(payload: { username: string; category: string }) {
    return request<RecommendationResponse>("/recommendations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  logEvent(payload: { event_type: string; metadata?: Record<string, unknown>; username?: string | null }) {
    return request<{ ok: boolean }>("/events", {
      method: "POST",
      body: JSON.stringify({
        event_type: payload.event_type,
        metadata: payload.metadata ?? {},
        username: payload.username ?? null,
      }),
    });
  },
};

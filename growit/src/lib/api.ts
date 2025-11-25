import type { CategorySummary, LoginResponse, RecommendationResponse } from "@/types/pipeline";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
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
};

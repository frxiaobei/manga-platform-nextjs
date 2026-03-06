const ACCESS_TOKEN_KEY = "manga_access_token";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (init?.body && typeof init.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw Object.assign(new Error(payload.detail ?? `Request failed: ${res.status}`), {
      status: res.status,
      detail: payload.detail,
    });
  }
  return res.json();
}

export type ApiTag = {
  id: number;
  name: string;
  slug: string;
};

export type ApiAsset = {
  id: string;
  category: string;
  url: string;
  nsfw_score: number | null;
  is_high_risk: boolean;
};

export type ApiCharacter = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  owner_id: string | null;
  review_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  price?: number;
  hot_score?: number;
  tags: ApiTag[];
  assets: ApiAsset[];
};

export type CharacterListResponse = {
  items: ApiCharacter[];
  next_cursor: string | null;
};

export type ApiCharacterDetail = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_purchased: boolean;
  locked_asset_count: number;
  assets: Array<{
    id: string;
    category: string;
    url: string | null;
    locked: boolean;
  }>;
};

export type UserPublic = {
  id: string;
  email: string;
  role: string;
  authProvider: string;
  avatar: string | null;
  createdAt: string;
};

export type AuthResponse = {
  user: UserPublic;
  token: string;
};

export type MyPurchaseItem = {
  character_id: string;
  character_name: string;
  hero_image_url: string | null;
  purchased_at: string;
  price_paid: number;
};

export type CheckoutSessionResponse = {
  checkout_url: string;
  session_id: string;
};

export type RatingSummary = {
  average: number;
  count: number;
};

export type MyRating = {
  score: number | null;
};

export const api = {
  characters: {
    list: (params?: {
      q?: string;
      tags?: string[];
      min_price?: number;
      max_price?: number;
      sort?: "latest" | "hot" | "price";
      cursor?: string;
      limit?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.q) sp.set("q", params.q);
      if (params?.tags?.length) sp.set("tags", params.tags.join(","));
      if (params?.min_price != null) sp.set("min_price", String(params.min_price));
      if (params?.max_price != null) sp.set("max_price", String(params.max_price));
      if (params?.sort) sp.set("sort", params.sort);
      if (params?.cursor) sp.set("cursor", params.cursor);
      if (params?.limit != null) sp.set("limit", String(params.limit));
      const qs = sp.toString();
      return fetchJson<CharacterListResponse>(`/api/characters${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => fetchJson<ApiCharacterDetail>(`/api/characters/${id}`),
    rate: (id: string, score: number) =>
      fetchJson<{ success: boolean; score: number }>(`/api/characters/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ score }),
      }),
  },
  tags: {
    list: () => fetchJson<ApiTag[]>("/api/tags"),
  },
  auth: {
    login: (email: string, password: string) =>
      fetchJson<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string) =>
      fetchJson<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => fetchJson<UserPublic>("/api/auth/me"),
    googleUrl: () => fetchJson<{ url: string; state: string }>("/api/auth/google/url"),
  },
  checkout: {
    createSession: (characterId: string, successUrl: string, cancelUrl: string) =>
      fetchJson<CheckoutSessionResponse>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ character_id: characterId, success_url: successUrl, cancel_url: cancelUrl }),
      }),
  },
  me: {
    purchases: () => fetchJson<MyPurchaseItem[]>("/api/me/purchases"),
  },
};

export const getCharacterPreviewImage = (character: { assets: Array<{ category: string; url: string | null }> }): string => {
  const hero = character.assets.find((a) => a.category === "hero");
  return hero?.url ?? character.assets[0]?.url ?? "/placeholder.svg";
};

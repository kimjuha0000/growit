import { api } from "./api";

export const trackEvent = async (
  type: string,
  metadata: Record<string, unknown>,
  username?: string | null,
) => {
  try {
    await api.logEvent({
      event_type: type,
      metadata,
      username: username ?? null,
    });
  } catch {
    // 로깅 실패는 사용자 경험에 영향을 주지 않도록 무시
  }
};

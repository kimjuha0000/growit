import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";

const CLICK_DEBOUNCE_MS = 150;

const GlobalAnalytics = () => {
  const { user } = useAuth();
  const location = useLocation();
  const lastClick = useRef(0);

  // 페이지 진입/라우트 변경
  useEffect(() => {
    void trackEvent(
      "page_view",
      { path: location.pathname, search: location.search || undefined },
      user?.username,
    );
  }, [location.pathname, location.search, user?.username]);

  // 모든 클릭 이벤트 캡처 (컴포넌트별 상세 이름은 data-track-name으로 구분 가능)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastClick.current < CLICK_DEBOUNCE_MS) return;
      lastClick.current = now;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const named = target.closest("[data-track-name]") as HTMLElement | null;
      const trackName = named?.dataset.trackName ?? null;
      const tag = target.tagName.toLowerCase();
      const text = (target.textContent || "").trim().slice(0, 80);

      void trackEvent(
        "ui_click",
        {
          path: location.pathname,
          tag,
          text: text || undefined,
          track_name: trackName || undefined,
        },
        user?.username,
      );
    };

    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      const field = target.getAttribute("name") || target.id || target.dataset.trackName || tag;
      const inputType = (target as HTMLInputElement).type || tag;
      void trackEvent(
        "ui_change",
        {
          path: location.pathname,
          field,
          tag,
          input_type: inputType,
        },
        user?.username,
      );
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("change", handleChange, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("change", handleChange, true);
    };
  }, [location.pathname, user?.username]);

  return null;
};

export default GlobalAnalytics;

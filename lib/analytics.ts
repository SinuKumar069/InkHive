type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("inkhive:analytics", {
      detail: { eventName, ...payload },
    }),
  );
}

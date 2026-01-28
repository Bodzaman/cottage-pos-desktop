import { useEffect } from "react";
import CookieConsent from "react-cookie-consent";
import { initAnalytics } from "utils/analytics";

const COOKIE_NAME = "cottage_tandoori_consent";

export function CookieConsentBanner() {
  // Auto-init analytics if consent was previously granted
  useEffect(() => {
    if (document.cookie.includes(`${COOKIE_NAME}=true`)) {
      initAnalytics();
    }
  }, []);

  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      onAccept={() => {
        initAnalytics();
      }}
      cookieName={COOKIE_NAME}
      expires={365}
      style={{
        background: "#1a1a1a",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: "12px 24px",
        alignItems: "center",
        fontSize: "14px",
        zIndex: 9998,
      }}
      contentStyle={{
        color: "rgba(255,255,255,0.7)",
        flex: "1 0 200px",
        margin: "8px 0",
      }}
      buttonStyle={{
        background: "#8B1538",
        color: "#fff",
        borderRadius: "6px",
        padding: "8px 24px",
        fontWeight: 500,
        fontSize: "14px",
        border: "none",
        cursor: "pointer",
      }}
      declineButtonStyle={{
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.6)",
        borderRadius: "6px",
        padding: "8px 24px",
        fontSize: "14px",
        cursor: "pointer",
      }}
    >
      We use cookies to understand how you use our site and improve your
      experience.{" "}
      <a
        href="/contact"
        style={{
          color: "#8B1538",
          textDecoration: "underline",
        }}
      >
        Learn more
      </a>
    </CookieConsent>
  );
}

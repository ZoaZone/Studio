import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = "342662050420-hjsrds4v122ggc6np9hlcgp0n2dt5rqd.apps.googleusercontent.com";

/**
 * GoogleLoginButton — ZoaZone Shared Component
 * Uses Google Identity Services (GSI) One Tap + Button flow.
 * On success, exchanges the Google ID token with Base44 auth.
 *
 * Props:
 *   onSuccess(credential) — called with the Base44 session after login
 *   onError(err)          — called if login fails
 *   theme                 — "filled_black" | "filled_blue" | "outline" (default: "filled_black")
 *   text                  — "signin_with" | "signup_with" | "continue_with" (default: "signin_with")
 */
export default function GoogleLoginButton({
  onSuccess,
  onError,
  theme = "filled_black",
  text = "signin_with",
  base44,
}) {
  const btnRef = useRef(null);

  useEffect(() => {
    // Load GSI script if not already loaded
    if (!window.google?.accounts) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogle();
      document.head.appendChild(script);
    } else {
      initGoogle();
    }

    function initGoogle() {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the standard Google button
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme,
          size: "large",
          text,
          shape: "rectangular",
          width: btnRef.current.offsetWidth || 320,
          logo_alignment: "left",
        });
      }

      // Also show One Tap prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap not shown - button is the fallback
          console.log("[GoogleLogin] One Tap not shown:", notification.getNotDisplayedReason?.());
        }
      });
    }

    async function handleCredential(response) {
      try {
        const { credential } = response;
        if (!credential) throw new Error("No credential returned from Google");

        // Exchange Google ID token with Base44
        let session;
        if (base44?.auth?.loginWithGoogle) {
          session = await base44.auth.loginWithGoogle({ credential });
        } else if (base44?.auth?.googleLogin) {
          session = await base44.auth.googleLogin({ credential });
        } else {
          // Direct API fallback
          const res = await fetch("https://base44.app/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential, client_id: GOOGLE_CLIENT_ID }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.error || `Auth failed: ${res.status}`);
          }
          session = await res.json();
        }

        // Persist token
        const token = session?.access_token || session?.token || session?.data?.access_token;
        if (token) {
          localStorage.setItem("base44_access_token", token);
          if (base44?.auth?.setToken) base44.auth.setToken(token);
        }

        onSuccess?.(session);
      } catch (err) {
        console.error("[GoogleLogin] Error:", err);
        onError?.(err);
      }
    }

    return () => {
      // Cleanup: cancel One Tap on unmount
      window.google?.accounts?.id?.cancel?.();
    };
  }, []);

  return (
    <div className="w-full">
      <div ref={btnRef} className="w-full flex justify-center" />
    </div>
  );
}

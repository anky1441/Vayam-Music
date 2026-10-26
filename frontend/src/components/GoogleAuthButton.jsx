import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage, setToken } from "../api/api";
import { googleAuth } from "../api/musicApi";
import { GoogleIcon } from "./AuthIcons";
import "./GoogleAuthButton.css";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

let gsiPromise;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        gsiPromise = undefined;
        reject(new Error("Google script failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return gsiPromise;
}

// "Continue with Google" -> Google ID token -> POST /api/auth/google -> our JWT.
function GoogleAuthButton({ text = "continue_with", onError }) {
  const slotRef = useRef(null);
  const navigate = useNavigate();
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!CLIENT_ID || !slotRef.current) return undefined;
    let cancelled = false;

    async function handleCredential(result) {
      try {
        const response = await googleAuth({ idToken: result.credential });
        const token = response.data?.token ?? response.data?.accessToken;

        if (!token) {
          onErrorRef.current?.("Google sign-in failed. Please try again.");
          return;
        }
        setToken(token);
        navigate("/home", { replace: true });
      } catch (error) {
        onErrorRef.current?.(getApiErrorMessage(error, "Google sign-in failed. Please try again."));
      }
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !slotRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredential,
        });
        window.google.accounts.id.renderButton(slotRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text,
          width: Math.min(400, slotRef.current.offsetWidth || 360),
        });
      })
      .catch(() => onErrorRef.current?.("Could not load Google sign-in. Check your connection."));

    return () => {
      cancelled = true;
    };
  }, [navigate, text]);

  // No client id configured yet: keep the original look and explain why.
  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        className="auth-google"
        onClick={() =>
          onError?.("Google sign-in is not set up yet. Add VITE_GOOGLE_CLIENT_ID to your .env file.")
        }
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>
    );
  }

  return <div ref={slotRef} className="auth-google-slot" />;
}

export default GoogleAuthButton;

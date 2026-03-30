import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from URL hash
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);

      if (!sessionIdMatch) {
        console.error("No session_id found in URL");
        navigate("/", { replace: true });
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        // Exchange session_id for session_token
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        // Update auth context with user data
        login(response.data);

        // Save token for mobile browsers that block cross-site cookies
        if (response.data.session_token) {
          localStorage.setItem("nucleus_session_token", response.data.session_token);
        }

        // Clear the hash and redirect to dashboard
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/home", { replace: true, state: { user: response.data } });
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/", { replace: true });
      }
    };

    processAuth();
  }, [navigate, login]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--dashboard-bg)' }}
    >
      <div className="text-center">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--gold-accent)', borderTopColor: 'transparent' }}
        />
        <p
          className="font-heading text-lg"
          style={{ color: 'var(--dashboard-text)' }}
        >
          Signing you in...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;

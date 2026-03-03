import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect if already logged in
  if (!loading && user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: 'var(--dashboard-bg)' }}
    >
      {/* Left Side - Hero Image */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1580501170854-a66ac9b17e94?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHw0fHxtaW5pbWFsaXN0JTIwYWVzdGhldGljJTIwc3R1ZHklMjBkZXNrJTIwdW5pdmVyc2l0eSUyMGxpYnJhcnl8ZW58MHx8fHwxNzcyNTcyNzE1fDA&ixlib=rb-4.1.0&q=85"
          alt="Minimal study desk"
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, transparent 70%, var(--dashboard-bg))' }}
        />
      </div>

      {/* Right Side - Login */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Logo/Brand */}
          <div className="mb-12">
            <h1 
              className="font-heading text-5xl md:text-6xl mb-3"
              style={{ color: 'var(--dashboard-text)' }}
            >
              Nucleus
            </h1>
            <p 
              className="text-lg md:text-xl font-body"
              style={{ color: 'var(--dashboard-text-secondary)' }}
            >
              Your personal command center & second brain
            </p>
          </div>

          {/* Features list */}
          <div className="mb-10 space-y-4">
            {[
              "Track habits with beautiful 90-day grids",
              "Plan your day with time-blocking",
              "Capture ideas, links, and vocabulary",
              "Practice behavioral questions for interviews"
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--gold-accent)' }}
                />
                <span 
                  className="font-body"
                  style={{ color: 'var(--dashboard-text)' }}
                >
                  {feature}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Login Button */}
          <motion.button
            data-testid="google-login-btn"
            onClick={handleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 rounded-full flex items-center justify-center gap-3 font-body font-medium text-lg transition-all shadow-lg hover:shadow-xl"
            style={{ 
              backgroundColor: 'var(--gold-accent)',
              color: 'white'
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Footer text */}
          <p 
            className="mt-8 text-center text-sm font-body"
            style={{ color: 'var(--dashboard-text-secondary)' }}
          >
            Reduce friction. Capture everything. Build habits.
          </p>
        </motion.div>
      </div>

      {/* Grain Overlay */}
      <div className="grain-overlay" />
    </div>
  );
};

export default Landing;

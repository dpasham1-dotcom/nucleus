import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, API } from "@/App";
import { useTheme } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Target,
  Calendar,
  Link2,
  BookOpen,
  Lightbulb,
  UtensilsCrossed,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Brain,
  Zap,
  Shield,
  BarChart3,
  ChevronDown,
  Star
} from "lucide-react";

/* ───────── Starfield Canvas ───────── */
const StarField = () => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const animRef = useRef(null);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 3;
    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.6 + 0.1,
        pulse: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    init();
    window.addEventListener("resize", init);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      starsRef.current.forEach((s) => {
        const a = s.alpha + Math.sin(t * s.pulse + s.phase) * 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${Math.max(0, Math.min(1, a))})`;
        ctx.fill();
      });
      t++;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", init);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full pointer-events-none"
      style={{ zIndex: 0, opacity: 0.6 }}
    />
  );
};

/* ───────── Modules Data ───────── */
const MODULES = [
  {
    icon: Target, label: "Habit Tracker",
    tagline: "Discipline, visualized.",
    desc: "90-day grid with streaks, milestones & freeze days. Watch your consistency compound.",
    path: "/habits", color: "#7C9A6E",
  },
  {
    icon: Calendar, label: "Daily Planner",
    tagline: "Own every hour.",
    desc: "Eisenhower Matrix prioritization with built-in Pomodoro. Plan deliberately, execute relentlessly.",
    path: "/planner", color: "#C9A96E",
  },
  {
    icon: UtensilsCrossed, label: "Calorie Tracker",
    tagline: "Fuel with intention.",
    desc: "AI-powered meal estimation, macro tracking, and weight charting. Know exactly what you're putting in.",
    path: "/calories", color: "#2D9A6A",
  },
  {
    icon: BookOpen, label: "Vocabulary",
    tagline: "Words become power.",
    desc: "AI definitions, mastery progression, and spaced repetition. From unfamiliar to fully owned.",
    path: "/vocabulary", color: "#8A3D2C",
  },
  {
    icon: Lightbulb, label: "Ideas",
    tagline: "Nothing gets lost.",
    desc: "Capture raw thoughts, let AI expand them, and track ideas from brainstorm to shipped.",
    path: "/ideas", color: "#F59E0B",
  },
  {
    icon: Link2, label: "Link Vault",
    tagline: "Your knowledge library.",
    desc: "Save articles, job leads, career pages, and resources. Categorized and searchable.",
    path: "/links", color: "#3D5A7A",
  },
  {
    icon: MessageSquare, label: "BQ Practice",
    tagline: "Ace every interview.",
    desc: "STAR method framework with AI feedback. Build a library of polished behavioral responses.",
    path: "/bq-practice", color: "#607D8B",
  },
  {
    icon: BarChart3, label: "Analytics",
    tagline: "See the full picture.",
    desc: "Productivity score, progress ring, activity feed, and cross-module insights. All your data, one view.",
    path: "/dashboard", color: "#9A7A9A",
  },
];

const PILLARS = [
  { icon: Brain, number: "01", title: "Second Brain", desc: "Capture ideas, vocabulary, and links before they vanish. Build a searchable knowledge base that grows with you." },
  { icon: Zap, number: "02", title: "Daily Engine", desc: "Plan tasks, track habits, and log meals in one flow. No more switching between 10 apps." },
  { icon: Sparkles, number: "03", title: "AI Augmented", desc: "Smart calorie estimation, auto-definitions, idea expansion, and weekly reviews — AI that does the grunt work." },
  { icon: Shield, number: "04", title: "Your Data", desc: "Private by design. Export everything. No ads, no tracking, no selling. Complete ownership." },
];

/* ───────── Component ───────── */
const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -100]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div data-testid="home-page" style={{ backgroundColor: '#050505' }}>
      <StarField />

      {/* ══════════ HERO ══════════ */}
      <motion.section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ y: heroY, scale: heroScale }}
      >
        {/* Aurora glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.03) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Hero image with mask */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-12"
        >
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden relative"
            style={{
              boxShadow: '0 0 80px rgba(201,169,110,0.2), 0 0 160px rgba(201,169,110,0.08)',
              border: '1px solid rgba(201,169,110,0.15)',
            }}>
            <img
              src="/images/nucleus-hero.png"
              alt="Nucleus"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.7) contrast(1.1)' }}
            />
            {/* Inner glow ring */}
            <div className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, transparent 50%, rgba(201,169,110,0.1) 100%)',
              }}
            />
          </div>
          {/* Orbiting dot */}
          <motion.div
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: '#C9A96E', top: '10%', right: '5%', boxShadow: '0 0 12px rgba(201,169,110,0.6)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center px-6 relative z-10"
        >
          <p className="text-xs font-body uppercase tracking-[0.4em] mb-6"
            style={{ color: 'rgba(201,169,110,0.6)' }}>
            Personal Command Center
          </p>

          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl mb-8 leading-[0.85] text-white">
            Your<br />
            <span style={{
              background: 'linear-gradient(135deg, #C9A96E 0%, #F0E6C8 40%, #C9A96E 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Second Brain
            </span>
          </h1>

          <p className="font-body text-lg md:text-xl text-white/30 max-w-lg mx-auto leading-relaxed mb-12">
            One system for your habits, tasks, ideas, nutrition, vocabulary, and career growth.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="py-4 px-10 rounded-full font-body font-semibold text-base inline-flex items-center gap-3 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
                color: '#0A0A0A',
                boxShadow: '0 0 30px rgba(201,169,110,0.2)',
              }}
            >
              {/* Shine sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
              <span className="relative z-10">Enter Command Center</span>
              <ArrowRight className="w-4 h-4 relative z-10" />
            </motion.button>

            <motion.button
              onClick={() => {
                document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="py-4 px-8 rounded-full font-body text-base text-white/40 hover:text-white/60 transition-colors"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              See what's inside
            </motion.button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-white/15" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ══════════ DIVIDER LINE ══════════ */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="h-px" style={{
          background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.15), transparent)'
        }} />
      </div>

      {/* ══════════ PHILOSOPHY ══════════ */}
      <section className="relative z-10 py-40 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="mb-24"
          >
            <p className="text-xs font-body uppercase tracking-[0.4em] mb-6"
              style={{ color: 'rgba(201,169,110,0.5)' }}>
              Why Nucleus
            </p>
            <h2 className="font-heading text-4xl md:text-6xl text-white leading-[0.9] mb-6">
              Most tools make you{' '}
              <span className="text-white/20">feel busy.</span>
              <br />
              This one makes you{' '}
              <span style={{
                background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>intentional.</span>
            </h2>
          </motion.div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {PILLARS.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="p-10 md:p-12 relative group"
                  style={{ backgroundColor: '#0A0A0A' }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(201,169,110,0.03), transparent 70%)'
                    }}
                  />
                  <div className="relative z-10">
                    <span className="font-body text-xs tracking-widest mb-6 block"
                      style={{ color: 'rgba(201,169,110,0.3)' }}>
                      {pillar.number}
                    </span>
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="w-5 h-5" style={{ color: '#C9A96E' }} />
                      <h3 className="font-heading text-xl text-white">{pillar.title}</h3>
                    </div>
                    <p className="font-body text-sm text-white/30 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ DIVIDER ══════════ */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="h-px" style={{
          background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.15), transparent)'
        }} />
      </div>

      {/* ══════════ MODULE SHOWCASE ══════════ */}
      <section id="modules" className="relative z-10 py-40 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="mb-20"
          >
            <p className="text-xs font-body uppercase tracking-[0.4em] mb-6"
              style={{ color: 'rgba(201,169,110,0.5)' }}>
              8 Integrated Modules
            </p>
            <h2 className="font-heading text-4xl md:text-6xl text-white leading-[0.9]">
              Each tool is powerful alone.
              <br />
              <span className="text-white/20">Together, they're a system.</span>
            </h2>
          </motion.div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MODULES.map((mod, index) => {
              const Icon = mod.icon;
              return (
                <motion.button
                  key={mod.label}
                  data-testid={`home-module-${mod.label.toLowerCase().replace(/\s/g, '-')}`}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(mod.path)}
                  className="group text-left p-8 rounded-2xl relative overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Hover gradient border */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${mod.color}08, transparent 50%)`,
                      border: `1px solid ${mod.color}20`,
                      borderRadius: '1rem',
                    }}
                  />

                  {/* Top glow on hover */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ backgroundColor: mod.color, boxShadow: `0 0 20px ${mod.color}40` }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${mod.color}10`,
                          border: `1px solid ${mod.color}15`,
                        }}>
                        <Icon className="w-6 h-6" style={{ color: mod.color }} />
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white/30 group-hover:translate-x-1 transition-all duration-300 mt-2" />
                    </div>

                    <h3 className="font-heading text-xl text-white mb-1 group-hover:text-white transition-colors">
                      {mod.label}
                    </h3>
                    <p className="font-body text-xs uppercase tracking-wider mb-3"
                      style={{ color: mod.color, opacity: 0.7 }}>
                      {mod.tagline}
                    </p>
                    <p className="font-body text-sm text-white/25 leading-relaxed group-hover:text-white/35 transition-colors">
                      {mod.desc}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ STATS STRIP ══════════ */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="h-px" style={{
          background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.15), transparent)'
        }} />
      </div>

      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { value: "8", label: "Integrated Modules" },
              { value: "90", label: "Day Habit Grids" },
              { value: "AI", label: "Powered Insights" },
              { value: "∞", label: "Potential" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <p className="font-heading text-4xl md:text-5xl mb-2"
                  style={{
                    background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                  {stat.value}
                </p>
                <p className="text-xs font-body text-white/20 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ BOTTOM CTA ══════════ */}
      <section className="relative z-10 py-40 px-6">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,110,0.06), transparent 60%)',
            filter: 'blur(40px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-2xl mx-auto"
        >
          {/* Logo mark */}
          <motion.div
            className="w-20 h-20 rounded-3xl mx-auto mb-10 flex items-center justify-center text-3xl font-heading"
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
              color: '#0A0A0A',
              boxShadow: '0 0 60px rgba(201,169,110,0.15), 0 0 120px rgba(201,169,110,0.05)',
            }}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.6 }}
          >
            N
          </motion.div>

          <h2 className="font-heading text-4xl md:text-5xl text-white mb-4 leading-tight">
            Build the system.<br />
            <span className="text-white/25">Become the person.</span>
          </h2>

          <p className="font-body text-base text-white/25 mb-12 max-w-md mx-auto">
            Your future self will thank you for starting today.
          </p>

          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="py-4 px-12 rounded-full font-body font-semibold text-base inline-flex items-center gap-3 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
              color: '#0A0A0A',
              boxShadow: '0 0 40px rgba(201,169,110,0.2)',
            }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
            <span className="relative z-10">Get Started</span>
            <ArrowRight className="w-4 h-4 relative z-10" />
          </motion.button>
        </motion.div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="relative z-10 py-8 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <p className="text-[11px] font-body text-white/10 tracking-wider">
          NUCLEUS — YOUR PERSONAL COMMAND CENTER
        </p>
      </footer>
    </div>
  );
};

export default Home;

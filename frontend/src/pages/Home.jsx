import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { useTheme } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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
  Flame,
  ChevronDown
} from "lucide-react";

const MODULES = [
  {
    icon: Target, label: "Habit Tracker",
    desc: "Track daily habits with a 90-day visual grid. Build streaks, earn milestones, and watch discipline compound over time.",
    path: "/habits", gradient: ["#7C9A6E", "#5A7A4E"],
    features: ["90-day visual grid", "Streak tracking", "Milestone badges", "Freeze days"]
  },
  {
    icon: Calendar, label: "Daily Planner",
    desc: "Organize your day with the Eisenhower Matrix. Prioritize what matters, time-block your schedule, and use Pomodoro flow.",
    path: "/planner", gradient: ["#C9A96E", "#A88A4E"],
    features: ["Eisenhower Matrix", "Pomodoro timer", "Priority sorting", "Time estimation"]
  },
  {
    icon: UtensilsCrossed, label: "Calorie Tracker",
    desc: "Log meals with AI-powered calorie estimation. Track macros, monitor weight trends, and build nutrition awareness.",
    path: "/calories", gradient: ["#2D9A6A", "#1D7A5A"],
    features: ["AI meal estimation", "Macro tracking", "Weight charting", "Daily goals"]
  },
  {
    icon: BookOpen, label: "Vocabulary",
    desc: "Build your word mastery. AI generates definitions and examples. Track new words from unfamiliar to fully owned.",
    path: "/vocabulary", gradient: ["#8A3D2C", "#6A2D1C"],
    features: ["AI definitions", "Mastery levels", "Notes & context", "Text-to-speech"]
  },
  {
    icon: Lightbulb, label: "Ideas Notepad",
    desc: "Capture raw thoughts and let AI help you expand them. Organize ideas across stages from brainstorm to shipped.",
    path: "/ideas", gradient: ["#F59E0B", "#D97706"],
    features: ["AI expansion", "Kanban stages", "Quick capture", "Tag system"]
  },
  {
    icon: Link2, label: "Link Vault",
    desc: "Save and categorize articles, resources, job leads, and inspiration. Your personal knowledge library.",
    path: "/links", gradient: ["#3D5A7A", "#2D4A6A"],
    features: ["Category tags", "Job tracking", "Career pages", "Quick save"]
  },
  {
    icon: MessageSquare, label: "BQ Practice",
    desc: "Prepare for behavioral interviews using the STAR method. Get AI feedback on your responses and track your progress.",
    path: "/bq-practice", gradient: ["#607D8B", "#455A64"],
    features: ["STAR method", "AI feedback", "Practice sessions", "Response library"]
  },
  {
    icon: BarChart3, label: "Dashboard",
    desc: "Your analytics command center. See all module stats, track progress, and get a productivity score for the day.",
    path: "/dashboard", gradient: ["#9A7A9A", "#7A5A7A"],
    features: ["Productivity score", "Progress ring", "Activity feed", "Smart insights"]
  }
];

const PILLARS = [
  { icon: Brain, title: "Your Second Brain", desc: "Capture ideas, vocabulary, and links. Nothing slips through the cracks." },
  { icon: Zap, title: "Daily Engine", desc: "Plan tasks, track habits, and log meals — all in one flow, every single day." },
  { icon: Shield, title: "Private & Yours", desc: "Your data, your control. Export anytime. No ads, no tracking, no selling." },
  { icon: Sparkles, title: "AI Augmented", desc: "Smart calorie estimation, vocabulary definitions, idea expansion, and weekly reviews." },
];

const Home = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);

  return (
    <div
      ref={containerRef}
      data-testid="home-page"
      className="min-h-screen"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* ═══════════════ HERO ═══════════════ */}
      <div className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Hero background image */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: heroImageY, opacity: heroOpacity }}
        >
          <img
            src="/images/nucleus-hero.png"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.4)' }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,1) 100%)'
          }} />
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Small logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 inline-flex items-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-heading text-2xl"
                style={{ background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)', boxShadow: '0 0 40px rgba(201, 169, 110, 0.3)' }}>
                N
              </div>
            </motion.div>

            <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl mb-6 text-white leading-[0.9]">
              Your{' '}
              <span style={{
                background: 'linear-gradient(135deg, #C9A96E, #E8D5A3, #C9A96E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Second Brain
              </span>
            </h1>

            <p className="font-body text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-4">
              One command center for your habits, tasks, ideas, nutrition, vocabulary, and career growth.
            </p>

            <p className="font-body text-sm text-white/25 max-w-lg mx-auto mb-12">
              Nucleus brings everything into a single, beautiful system — so you can stop switching between 10 apps and start building the life you want.
            </p>

            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.03, boxShadow: '0 0 50px rgba(201, 169, 110, 0.25)' }}
              whileTap={{ scale: 0.97 }}
              className="py-4 px-10 rounded-full font-body font-medium text-lg inline-flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
                color: '#0A0A0A'
              }}
            >
              Enter Command Center
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-body text-white/20 uppercase tracking-widest">Explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-white/20" />
          </motion.div>
        </motion.div>
      </div>

      {/* ═══════════════ WHAT IS NUCLEUS ═══════════════ */}
      <div className="py-32 px-6 relative" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <p className="text-xs font-body uppercase tracking-[0.3em] mb-4" style={{ color: '#C9A96E' }}>
              The Philosophy
            </p>
            <h2 className="font-heading text-4xl md:text-5xl text-white mb-6">
              Stop managing.{' '}
              <span className="text-white/30">Start building.</span>
            </h2>
            <p className="font-body text-lg text-white/40 max-w-2xl mx-auto">
              Most productivity tools make you feel busy. Nucleus makes you feel{' '}
              <span className="text-white/70 font-medium">intentional</span>.
              Every module is designed to compound — habits build streaks, ideas become projects,
              vocabulary becomes fluency.
            </p>
          </motion.div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 rounded-2xl border"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(201, 169, 110, 0.1)' }}>
                    <Icon className="w-6 h-6" style={{ color: '#C9A96E' }} />
                  </div>
                  <h3 className="font-heading text-lg text-white mb-2">{pillar.title}</h3>
                  <p className="font-body text-sm text-white/35 leading-relaxed">{pillar.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════ MODULE SHOWCASE ═══════════════ */}
      <div className="py-32 px-6" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-body uppercase tracking-[0.3em] mb-4" style={{ color: '#C9A96E' }}>
              8 Integrated Modules
            </p>
            <h2 className="font-heading text-4xl md:text-5xl text-white mb-4">
              Everything connects.
            </h2>
            <p className="font-body text-lg text-white/35 max-w-xl mx-auto">
              Each module is a tool. Together, they're a system.
            </p>
          </motion.div>

          {/* Module Cards - Alternating layout */}
          <div className="space-y-6">
            {MODULES.map((mod, index) => {
              const Icon = mod.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={mod.label}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(mod.path)}
                  className="group cursor-pointer rounded-2xl overflow-hidden relative"
                  style={{
                    background: `linear-gradient(${isEven ? '135deg' : '225deg'}, ${mod.gradient[0]}15, transparent 60%)`,
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div className={`flex flex-col md:flex-row ${!isEven ? 'md:flex-row-reverse' : ''} items-center gap-6 p-8`}>
                    {/* Icon Side */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${mod.gradient[0]}, ${mod.gradient[1]})` }}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="font-heading text-2xl text-white mb-2 group-hover:text-white/90 transition-colors">
                        {mod.label}
                      </h3>
                      <p className="font-body text-sm text-white/40 mb-4 max-w-lg leading-relaxed">
                        {mod.desc}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {mod.features.map((feat) => (
                          <span key={feat} className="text-xs font-body px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: `${mod.gradient[0]}15`,
                              color: mod.gradient[0],
                              border: `1px solid ${mod.gradient[0]}25`
                            }}>
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 hidden md:flex">
                      <div className="w-12 h-12 rounded-full border flex items-center justify-center group-hover:bg-white/5 transition-all"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════ CTA ═══════════════ */}
      <div className="py-32 px-6 relative" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201, 169, 110, 0.06), transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-heading text-3xl mx-auto mb-8"
            style={{ background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)', boxShadow: '0 0 50px rgba(201, 169, 110, 0.2)' }}>
            N
          </div>
          <h2 className="font-heading text-3xl md:text-4xl text-white mb-4">
            Ready to build your system?
          </h2>
          <p className="font-body text-lg text-white/35 mb-10">
            Your future self will thank you for starting today.
          </p>
          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.03, boxShadow: '0 0 50px rgba(201, 169, 110, 0.3)' }}
            whileTap={{ scale: 0.97 }}
            className="py-4 px-12 rounded-full font-body font-medium text-lg inline-flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
              color: '#0A0A0A'
            }}
          >
            Enter Command Center
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <div className="py-8 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', backgroundColor: '#0A0A0A' }}>
        <p className="text-xs font-body text-white/15">
          Nucleus — Your personal command center & second brain
        </p>
      </div>
    </div>
  );
};

export default Home;

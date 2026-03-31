import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import {
  Target, Calendar, Link2, BookOpen, Lightbulb,
  UtensilsCrossed, MessageSquare, BarChart3,
  ArrowRight, Brain, Zap, Shield, Sparkles
} from "lucide-react";

/* ═══════════════════════════════════════════
   INTERACTIVE PARTICLE FIELD
   ═══════════════════════════════════════════ */
const ParticleField = ({ mouseX, mouseY }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const unsub1 = mouseX?.on("change", v => { mouseRef.current.x = v; });
    const unsub2 = mouseY?.on("change", v => { mouseRef.current.y = v; });
    return () => { unsub1?.(); unsub2?.(); };
  }, [mouseX, mouseY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: 0, baseY: 0,
        r: Math.random() * 1.8 + 0.3,
        alpha: Math.random() * 0.4 + 0.05,
        speed: Math.random() * 0.3 + 0.1,
        angle: Math.random() * Math.PI * 2,
        drift: Math.random() * 0.002 + 0.001,
      });
      particles[i].baseX = particles[i].x;
      particles[i].baseY = particles[i].y;
    }
    particlesRef.current = particles;

    const ctx = canvas.getContext("2d");
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y + window.scrollY;

      particlesRef.current.forEach(p => {
        p.angle += p.drift;
        p.x = p.baseX + Math.sin(p.angle) * 30;
        p.y = p.baseY + Math.cos(p.angle * 0.7) * 20;

        // Mouse repulsion
        if (mx && my) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const force = (200 - dist) / 200;
            p.x += (dx / dist) * force * 30;
            p.y += (dy / dist) * force * 30;
          }
        }

        const pulse = Math.sin(Date.now() * 0.001 + p.angle) * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${Math.max(0.02, p.alpha + pulse * 0.15)})`;
        ctx.fill();
      });

      // Draw connections
      particlesRef.current.forEach((a, i) => {
        particlesRef.current.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(201, 169, 110, ${0.03 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full pointer-events-none" style={{ zIndex: 0 }} />;
};

/* ═══════════════════════════════════════════
   3D TILT CARD
   ═══════════════════════════════════════════ */
const TiltCard = ({ children, className, style, onClick }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX, rotateY, transformPerspective: 800, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════
   MODULES DATA
   ═══════════════════════════════════════════ */
const MODULES = [
  { icon: Target, label: "Habit Tracker", tagline: "Discipline, visualized", path: "/habits", color: "#7C9A6E", desc: "90-day grids · Streaks · Milestones" },
  { icon: Calendar, label: "Daily Planner", tagline: "Own every hour", path: "/planner", color: "#C9A96E", desc: "Eisenhower Matrix · Pomodoro · Time blocks" },
  { icon: UtensilsCrossed, label: "Calorie Tracker", tagline: "Fuel with intention", path: "/calories", color: "#2D9A6A", desc: "AI estimation · Macros · Weight trends" },
  { icon: BookOpen, label: "Vocabulary", tagline: "Words become power", path: "/vocabulary", color: "#8A3D2C", desc: "AI definitions · Mastery levels · Notes" },
  { icon: Lightbulb, label: "Ideas", tagline: "Nothing gets lost", path: "/ideas", color: "#F59E0B", desc: "AI expansion · Kanban · Quick capture" },
  { icon: Link2, label: "Link Vault", tagline: "Your knowledge library", path: "/links", color: "#3D5A7A", desc: "Categories · Job leads · Resources" },
  { icon: MessageSquare, label: "BQ Practice", tagline: "Ace every interview", path: "/bq-practice", color: "#607D8B", desc: "STAR method · AI feedback · Library" },
  { icon: BarChart3, label: "Analytics", tagline: "See the full picture", path: "/dashboard", color: "#9A7A9A", desc: "Productivity score · Insights · Trends" },
];

/* ═══════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════ */
const Counter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          setCount(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{count}</span>;
};

/* ═══════════════════════════════════════════
   MAIN HOME COMPONENT
   ═══════════════════════════════════════════ */
const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef(null);

  // Track mouse globally
  useEffect(() => {
    const handler = (e) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  // Scroll progress for hero
  const { scrollYProgress } = useScroll();
  const heroImageScale = useTransform(scrollYProgress, [0, 0.12], [1, 3]);
  const heroImageOpacity = useTransform(scrollYProgress, [0, 0.10], [0.5, 0]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.10], [0, -120]);
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  // Spotlight that follows mouse
  const spotlightX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const spotlightY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  return (
    <div ref={containerRef} data-testid="home-page" style={{ backgroundColor: '#050505' }}>
      <ParticleField mouseX={mouseX} mouseY={mouseY} />

      {/* Mouse spotlight */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          x: spotlightX,
          y: spotlightY,
          width: 600,
          height: 600,
          marginLeft: -300,
          marginTop: -300,
          background: 'radial-gradient(circle, rgba(201,169,110,0.03) 0%, transparent 70%)',
          zIndex: 1,
        }}
      />

      {/* ══════════════ SCENE 1: HERO ══════════════ */}
      <section className="relative h-[200vh]">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          {/* Zoom image */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ scale: heroImageScale, opacity: heroImageOpacity }}
          >
            <img
              src="/images/nucleus-hero.png"
              alt=""
              className="w-[500px] h-[500px] object-cover rounded-full"
              style={{ filter: 'brightness(0.5) saturate(0.8)' }}
            />
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(circle at center, transparent 20%, #050505 70%)'
            }} />
          </motion.div>

          {/* Hero text */}
          <motion.div
            className="relative z-10 text-center px-6"
            style={{ y: heroTextY, opacity: heroTextOpacity }}
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xs font-body uppercase tracking-[0.5em] mb-8"
              style={{ color: 'rgba(201,169,110,0.5)' }}
            >
              Personal Command Center
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="font-heading text-7xl md:text-8xl lg:text-[10rem] leading-[0.85] mb-8"
            >
              <span className="text-white">Your</span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #C9A96E 0%, #F5E6C8 30%, #C9A96E 60%, #E8D5A3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% auto',
              }}>
                Second Brain
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="font-body text-lg md:text-xl text-white/25 max-w-md mx-auto"
            >
              Habits. Tasks. Ideas. Nutrition. Growth.
              <br />
              One system. Zero friction.
            </motion.p>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          >
            <span className="text-[10px] font-body text-white/15 uppercase tracking-[0.3em]">Scroll to explore</span>
            <motion.div
              className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <motion.div
                className="w-1 h-2 rounded-full bg-white/30"
                animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ SCENE 2: THE STATEMENT ══════════════ */}
      <section className="relative z-10 min-h-screen flex items-center py-40 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-200px" }}
            transition={{ duration: 1.5 }}
          >
            <p className="text-xs font-body uppercase tracking-[0.4em] mb-10"
              style={{ color: 'rgba(201,169,110,0.4)' }}>
              The Problem
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { text: "You have 10 apps for productivity.", opacity: "text-white/60" },
              { text: "None of them talk to each other.", opacity: "text-white/40" },
              { text: "Your habits are in one. Tasks in another.", opacity: "text-white/30" },
              { text: "Ideas slip through. Progress is invisible.", opacity: "text-white/20" },
            ].map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                className={`font-heading text-3xl md:text-5xl leading-tight ${line.opacity}`}
              >
                {line.text}
              </motion.p>
            ))}

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="pt-8"
            >
              <p className="font-heading text-3xl md:text-5xl leading-tight">
                <span style={{
                  background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Nucleus changes that.
                </span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ SCENE 3: PILLARS ══════════════ */}
      <section className="relative z-10 py-40 px-6">
        {/* Section divider */}
        <div className="max-w-3xl mx-auto mb-32">
          <div className="h-px" style={{
            background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)'
          }} />
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-body uppercase tracking-[0.4em] mb-20 text-center"
            style={{ color: 'rgba(201,169,110,0.4)' }}
          >
            Built on four principles
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-x-24">
            {[
              { icon: Brain, num: "01", title: "Second Brain", desc: "Capture ideas, vocabulary, and links before they vanish. Build a searchable library that grows with you." },
              { icon: Zap, num: "02", title: "Daily Engine", desc: "Plan tasks, track habits, and log meals — all in one flow, every single day. No more context switching." },
              { icon: Sparkles, num: "03", title: "AI Augmented", desc: "Smart calorie estimation, auto-definitions, idea expansion, and weekly reviews. AI that does the grunt work." },
              { icon: Shield, num: "04", title: "Your Data", desc: "Private by design. Export everything. No ads, no tracking, no selling. You own every byte." },
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  className="group"
                >
                  <span className="font-body text-5xl font-extralight block mb-4"
                    style={{ color: 'rgba(201,169,110,0.08)' }}>
                    {pillar.num}
                  </span>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5" style={{ color: '#C9A96E' }} />
                    <h3 className="font-heading text-2xl text-white">{pillar.title}</h3>
                  </div>
                  <p className="font-body text-sm text-white/25 leading-relaxed pl-8">
                    {pillar.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ SCENE 4: MODULES ══════════════ */}
      <section className="relative z-10 py-40 px-6">
        <div className="max-w-3xl mx-auto mb-24">
          <div className="h-px" style={{
            background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)'
          }} />
        </div>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <p className="text-xs font-body uppercase tracking-[0.4em] mb-6"
              style={{ color: 'rgba(201,169,110,0.4)' }}>
              8 Integrated Modules
            </p>
            <h2 className="font-heading text-5xl md:text-7xl text-white leading-[0.85]">
              Each one is powerful.
              <br />
              <span className="text-white/15">Together, they're a system.</span>
            </h2>
          </motion.div>

          {/* 3D Tilt Module Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <motion.div
                  key={mod.label}
                  initial={{ opacity: 0, y: 40, rotateX: 10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                >
                  <TiltCard
                    className="group cursor-pointer rounded-2xl p-6 relative overflow-hidden h-full"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    onClick={() => navigate(mod.path)}
                  >
                    {/* Glow on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${mod.color}15, transparent 70%)`,
                      }}
                    />
                    {/* Top edge light */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ backgroundColor: mod.color, boxShadow: `0 0 20px ${mod.color}60` }}
                    />

                    <div className="relative z-10" style={{ transform: 'translateZ(30px)' }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                        style={{ backgroundColor: `${mod.color}12`, border: `1px solid ${mod.color}18` }}>
                        <Icon className="w-6 h-6" style={{ color: mod.color }} />
                      </div>
                      <h3 className="font-heading text-lg text-white mb-1">{mod.label}</h3>
                      <p className="text-xs font-body uppercase tracking-wider mb-3"
                        style={{ color: mod.color, opacity: 0.6 }}>
                        {mod.tagline}
                      </p>
                      <p className="text-xs font-body text-white/20 leading-relaxed">{mod.desc}</p>
                      <div className="mt-4 flex items-center gap-1 text-white/10 group-hover:text-white/30 transition-colors">
                        <span className="text-xs font-body">Open</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ SCENE 5: STATS ══════════════ */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 text-center">
            {[
              { value: 8, display: "8", label: "Modules" },
              { value: 90, display: "90", label: "Day Grids" },
              { value: 7, display: "7+", label: "AI Features" },
              { value: 0, display: "∞", label: "Potential", isInfinity: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, type: "spring" }}
              >
                <p className="font-heading text-5xl md:text-6xl mb-2"
                  style={{
                    background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                  {stat.isInfinity ? "∞" : <Counter value={stat.value} />}
                  {stat.display.includes("+") && "+"}
                </p>
                <p className="text-[10px] font-body text-white/15 uppercase tracking-[0.2em]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ SCENE 6: CTA ══════════════ */}
      <section className="relative z-10 py-48 px-6">
        <div className="max-w-3xl mx-auto mb-20">
          <div className="h-px" style={{
            background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)'
          }} />
        </div>

        {/* Big ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,110,0.04), transparent 50%)',
            filter: 'blur(60px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center"
        >
          <motion.div
            className="w-24 h-24 rounded-3xl mx-auto mb-12 flex items-center justify-center text-4xl font-heading"
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
              color: '#0A0A0A',
              boxShadow: '0 0 80px rgba(201,169,110,0.15), 0 0 160px rgba(201,169,110,0.05)',
            }}
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            N
          </motion.div>

          <h2 className="font-heading text-5xl md:text-7xl text-white mb-6 leading-[0.85]">
            Build the system.
            <br />
            <span className="text-white/20">Become the person.</span>
          </h2>

          <p className="font-body text-base text-white/20 mb-14 max-w-sm mx-auto">
            Your future self will thank you for starting today.
          </p>

          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="py-5 px-14 rounded-full font-body font-semibold text-lg inline-flex items-center gap-3 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
              color: '#0A0A0A',
              boxShadow: '0 0 40px rgba(201,169,110,0.25)',
            }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
            />
            <span className="relative z-10">Enter Command Center</span>
            <ArrowRight className="w-5 h-5 relative z-10" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <p className="text-[10px] font-body text-white/8 uppercase tracking-[0.3em]">
          Nucleus — Personal Command Center
        </p>
      </footer>
    </div>
  );
};

export default Home;

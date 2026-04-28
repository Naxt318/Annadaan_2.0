import { useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Leaf, ArrowRight, Heart, Users, TrendingDown, MapPin, Clock, Shield, Zap } from "lucide-react";
import { TICKER_EVENTS } from "@/lib/demoData";
import { useCountUp } from "@/lib/useCountUp";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const HOW_IT_WORKS = [
  {
    step: "01",
    role: "Donors",
    emoji: "🍱",
    title: "List Your Surplus Food",
    desc: "Restaurants, households, and caterers register what they have — food type, quantity, pickup location, and when it expires.",
    color: "from-amber-50 to-amber-100/60 border-amber-200",
    roleColor: "bg-amber-100 text-amber-700",
  },
  {
    step: "02",
    role: "NGOs",
    emoji: "🤝",
    title: "Accept What You Need",
    desc: "Partner NGOs browse available donations in real time and accept requests that match their capacity and beneficiaries.",
    color: "from-green-50 to-green-100/60 border-green-200",
    roleColor: "bg-green-100 text-green-700",
  },
  {
    step: "03",
    role: "Volunteers",
    emoji: "🛵",
    title: "Pick Up & Deliver",
    desc: "Volunteers claim deliveries, track status step by step, and ensure food reaches people before it spoils.",
    color: "from-blue-50 to-blue-100/60 border-blue-200",
    roleColor: "bg-blue-100 text-blue-700",
  },
];

const TESTIMONIALS = [
  {
    quote: "ANNADAAN has transformed how we source food. What used to take hours of calls now takes seconds.",
    author: "Priya Sharma",
    org: "Roti Bank Mumbai",
    role: "NGO Coordinator",
    initials: "PS",
    color: "bg-green-100 text-green-700",
  },
  {
    quote: "I donate my restaurant leftovers every evening. The platform makes it seamless and I can see the impact.",
    author: "Rajan Mehta",
    org: "Café Mumbaikar",
    role: "Food Donor",
    initials: "RM",
    color: "bg-amber-100 text-amber-700",
  },
  {
    quote: "Volunteering on weekends feels meaningful now. The app tells me exactly where to go and what to do.",
    author: "Aisha Khan",
    org: "Robin Hood Army",
    role: "Volunteer",
    initials: "AK",
    color: "bg-blue-100 text-blue-700",
  },
];

const FEATURES = [
  { icon: Clock, title: "Real-time updates", desc: "Donation status, delivery tracking, and NGO acceptance all happen live — no refreshing needed." },
  { icon: Shield, title: "Role-based access", desc: "Donors donate. NGOs accept. Volunteers deliver. No confusion, no overlap, no wasted effort." },
  { icon: MapPin, title: "Mumbai-focused", desc: "Optimised for Mumbai's geography with NGO locations, pickup routes, and neighbourhoods mapped out." },
  { icon: Heart, title: "Zero food wasted", desc: "Expiry dates and quantity tracking ensure food reaches people before it spoils." },
  { icon: Users, title: "Community driven", desc: "Anyone can join as a volunteer. Every delivery matters and every kilometre counts." },
  { icon: Leaf, title: "Environmentally conscious", desc: "Less food in landfills means less methane. Small local acts, measurable global impact." },
];

function CountStat({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  const numeric = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
  const suffix = value.replace(/[0-9,]/g, "");
  const { count, ref } = useCountUp(numeric);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className="text-center"
    >
      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      <p className="text-4xl font-black text-foreground tabular-nums">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
    </motion.div>
  );
}

function LiveTicker() {
  const events = [...TICKER_EVENTS, ...TICKER_EVENTS];
  return (
    <div className="bg-card/60 border-y border-border py-3 overflow-hidden">
      <div className="flex items-center gap-3 px-4 mb-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live</span>
        </div>
      </div>
      <div className="relative flex overflow-hidden">
        <motion.div
          animate={{ x: "-50%" }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="flex gap-8 whitespace-nowrap"
        >
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${e.color} flex-shrink-0`} />
              <span>{e.text}</span>
              <span className="text-xs text-muted-foreground/50 pl-1">{e.time} ago</span>
              <span className="text-border pl-4">·</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36">

        {/* ── BACKGROUND LAYER: only on this section ── */}

        {/* Soft grain texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* Large green organic blob — top right */}
        <svg className="absolute -top-20 -right-32 w-[620px] h-[620px] pointer-events-none" viewBox="0 0 620 620" fill="none" aria-hidden>
          <path
            d="M310 60 C430 30 570 100 580 240 C592 390 490 520 360 540 C220 562 80 470 60 340 C38 200 110 80 210 55 C250 45 280 65 310 60 Z"
            fill="#578E7E"
            opacity="0.08"
          />
          <path
            d="M330 100 C420 80 530 150 520 270 C510 390 410 460 310 450 C200 440 120 360 140 250 C158 148 240 118 330 100 Z"
            fill="#578E7E"
            opacity="0.05"
          />
        </svg>

        {/* Warm amber blob — bottom left */}
        <svg className="absolute -bottom-16 -left-24 w-[480px] h-[480px] pointer-events-none" viewBox="0 0 480 480" fill="none" aria-hidden>
          <path
            d="M240 40 C360 20 450 120 440 250 C430 370 330 450 210 440 C90 430 20 320 40 200 C58 90 140 55 240 40 Z"
            fill="#D4943A"
            opacity="0.07"
          />
        </svg>

        {/* Small accent blob — top left */}
        <svg className="absolute top-8 -left-10 w-[260px] h-[260px] pointer-events-none" viewBox="0 0 260 260" fill="none" aria-hidden>
          <path
            d="M130 30 C190 20 240 70 230 140 C220 200 160 240 100 220 C40 200 20 140 50 80 C70 40 100 38 130 30 Z"
            fill="#578E7E"
            opacity="0.06"
          />
        </svg>

        {/* Scattered floating leaf particles */}
        {[
          { x: "8%",  y: "18%", size: 22, dur: 9,  delay: 0,   rot: 20  },
          { x: "88%", y: "12%", size: 16, dur: 11, delay: 1.5, rot: -30 },
          { x: "15%", y: "72%", size: 14, dur: 13, delay: 0.8, rot: 45  },
          { x: "78%", y: "65%", size: 20, dur: 10, delay: 2,   rot: -15 },
          { x: "50%", y: "8%",  size: 12, dur: 14, delay: 0.4, rot: 60  },
          { x: "92%", y: "48%", size: 18, dur: 8,  delay: 1,   rot: -45 },
          { x: "30%", y: "85%", size: 13, dur: 12, delay: 3,   rot: 30  },
          { x: "65%", y: "78%", size: 10, dur: 15, delay: 0.2, rot: -60 },
        ].map((leaf, i) => (
          <motion.svg
            key={i}
            className="absolute pointer-events-none"
            style={{ left: leaf.x, top: leaf.y, width: leaf.size, height: leaf.size }}
            viewBox="0 0 24 24"
            fill="#578E7E"
            aria-hidden
            animate={{
              y: [-6, 6, -6],
              rotate: [leaf.rot, leaf.rot + 12, leaf.rot],
              opacity: [0.12, 0.2, 0.12],
            }}
            transition={{ duration: leaf.dur, repeat: Infinity, delay: leaf.delay, ease: "easeInOut" }}
          >
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2C17 3 3 3 3 12" />
          </motion.svg>
        ))}

        {/* Floating decorative circles */}
        {[
          { x: "22%", y: "30%", r: 6,  color: "#578E7E", op: 0.12, dur: 7  },
          { x: "75%", y: "25%", r: 4,  color: "#D4943A", op: 0.15, dur: 9  },
          { x: "60%", y: "80%", r: 8,  color: "#578E7E", op: 0.10, dur: 11 },
          { x: "12%", y: "55%", r: 5,  color: "#D4943A", op: 0.12, dur: 8  },
          { x: "85%", y: "70%", r: 3,  color: "#578E7E", op: 0.15, dur: 10 },
          { x: "40%", y: "15%", r: 4,  color: "#578E7E", op: 0.10, dur: 13 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: dot.x, top: dot.y,
              width: dot.r * 2, height: dot.r * 2,
              backgroundColor: dot.color,
              opacity: dot.op,
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [dot.op, dot.op * 1.6, dot.op] }}
            transition={{ duration: dot.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
          />
        ))}

        {/* Radial glow at top-centre */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(167_24%_45%/0.10)_0%,transparent_70%)] pointer-events-none" />

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-8"
          >
            <Leaf className="w-3.5 h-3.5" />
            Reducing food waste across Mumbai
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-7xl font-black text-foreground tracking-tight leading-[1.08] mb-6"
          >
            Food that should be
            <br />
            <span className="text-primary">eaten, not wasted.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            ANNADAAN connects surplus food from donors to NGOs and volunteers who deliver it to people who need it most — all in real time.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link href="/signup">
              <Button size="lg" className="gap-2 text-base px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow" data-testid="cta-get-started">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8" data-testid="cta-login">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Floating activity cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center gap-3 flex-wrap"
          >
            {[
              { emoji: "🍱", text: "25 portions listed in Andheri", tag: "Just now", tagColor: "text-amber-600 bg-amber-50" },
              { emoji: "✅", text: "Roti Bank accepted Bread donation", tag: "8 min ago", tagColor: "text-green-600 bg-green-50" },
              { emoji: "🛵", text: "Volunteer heading to Dadar TT", tag: "12 min ago", tagColor: "text-blue-600 bg-blue-50" },
            ].map((card, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
                className="bg-card border border-border rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm text-sm"
              >
                <span className="text-base">{card.emoji}</span>
                <span className="text-foreground font-medium hidden sm:inline">{card.text}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${card.tagColor}`}>{card.tag}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Ticker */}
      <LiveTicker />

      {/* Stats */}
      <section className="py-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <CountStat value="12400+" label="Meals Redistributed" icon={Heart} />
            <CountStat value="38" label="NGO Partners" icon={Users} />
            <CountStat value="210+" label="Active Volunteers" icon={MapPin} />
            <CountStat value="60%" label="Less Food Wasted" icon={TrendingDown} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
              How it works
            </span>
            <h2 className="text-4xl font-black text-foreground mb-4">Three roles. One mission.</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A seamless flow from surplus to need — tracked in real time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.15}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`bg-gradient-to-br ${step.color} border rounded-2xl p-6 relative cursor-default`}
              >
                <div className="text-5xl font-black text-black/5 absolute top-4 right-5 leading-none select-none">
                  {step.step}
                </div>
                <div className="text-3xl mb-4">{step.emoji}</div>
                <span className={`inline-block text-xs font-semibold uppercase tracking-wider rounded-full px-3 py-1 mb-3 ${step.roleColor}`}>
                  {step.role}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ANNADAAN */}
      <section className="py-28 bg-card/40 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
              Why ANNADAAN
            </span>
            <h2 className="text-4xl font-black text-foreground mb-4">Built for trust &amp; speed</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Every feature is designed around dignity, reliability, and real-world impact.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-6"
          >
            {FEATURES.map((feat) => (
              <motion.div
                key={feat.title}
                variants={fadeUp}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="flex gap-4 items-start bg-background rounded-2xl p-5 border border-border cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
              Community
            </span>
            <h2 className="text-4xl font-black text-foreground">People making it happen</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.author}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.15}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col cursor-default"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <span key={s} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6 flex-1 italic text-sm">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role} · {t.org}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-28 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.08)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium text-primary-foreground mb-6">
              <Zap className="w-3.5 h-3.5" />
              Join 210+ volunteers already making a difference
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-primary-foreground mb-4 leading-tight">
              Join the movement today
            </h2>
            <p className="text-primary-foreground/75 text-lg mb-8 max-w-xl mx-auto">
              Whether you have food to give, capacity to accept, or time to deliver — there's a place for you in ANNADAAN.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-2 text-base px-8 shadow-lg">
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">ANNADAAN</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Making every meal count — Mumbai's food redistribution platform
          </p>
          <p className="text-sm text-muted-foreground">© 2026</p>
        </div>
      </footer>
    </div>
  );
}

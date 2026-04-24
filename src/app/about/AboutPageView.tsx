'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  BarChart2,
  ChevronDown,
  FileSearch,
  Github,
  Globe,
  History,
  Linkedin,
  Mail,
  Shield,
  Zap,
} from 'lucide-react';
import { APP_COLORS, BUTTON_STYLES, SHADOWS } from '@/lib/colors';
import VigilanceLogo from '@/components/brand/VigilanceLogo';

const PORTFOLIO_URL = 'https://dhruv-portfolio-23.vercel.app';
const GITHUB_URL = 'https://github.com/dhruvprajapati002';
const LINKEDIN_URL = 'https://linkedin.com/in/Dhruv';
const EMAIL = 'dhruvprajapati0023@gmail.com';
const YOUR_NAME = 'Dhruv';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

const heroLine = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const heroWord = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

const FEATURE_CARDS = [
  {
    icon: Shield,
    title: 'Multi-Source Intelligence',
    body: 'Aggregates 6+ threat sources into one unified verdict per IOC.',
  },
  {
    icon: Zap,
    title: 'Real-Time Analysis',
    body: 'Instant threat scoring with live API enrichment and smart caching.',
  },
  {
    icon: BarChart2,
    title: 'Security Dashboard',
    body: 'Live charts showing threat trends, geo distribution, malware families.',
  },
  {
    icon: FileSearch,
    title: 'File Hash Analysis',
    body: 'Deep file intelligence including MITRE ATT&CK mapping and sandbox data.',
  },
  {
    icon: Globe,
    title: 'Domain Intelligence',
    body: 'WHOIS, DNS, SSL, and reputation data for any domain in one panel.',
  },
  {
    icon: History,
    title: 'Search History',
    body: 'Every IOC analyzed is logged, searchable, and exportable.',
  },
];

const TECH_STACK = [
  { name: 'Next.js 15', dot: APP_COLORS.textPrimary },
  { name: 'React 18', dot: APP_COLORS.accentCyan },
  { name: 'TypeScript', dot: APP_COLORS.accentBlue },
  { name: 'MongoDB', dot: APP_COLORS.success },
  { name: 'Tailwind CSS', dot: APP_COLORS.accentCyan },
  { name: 'Framer Motion', dot: APP_COLORS.accentPurple },
  { name: 'Recharts', dot: APP_COLORS.primary },
  { name: 'VirusTotal API', dot: APP_COLORS.danger },
  { name: 'GreyNoise API', dot: APP_COLORS.accentBlue },
  { name: 'ThreatFox API', dot: APP_COLORS.warning },
  { name: 'Lucide React', dot: APP_COLORS.primary },
  { name: 'JWT Auth', dot: APP_COLORS.accentOrange },
  { name: 'Zod', dot: APP_COLORS.accentPurple },
  { name: 'Mongoose', dot: APP_COLORS.success },
];

const SKILLS = [
  'Security Research',
  'Next.js',
  'API Integrations',
  'MongoDB',
  'Data Visualization',
  'Threat Intel',
];

type StatItem =
  | { value: number; suffix?: string; label: string }
  | { valueText: string; label: string };

const STATS: StatItem[] = [
  { value: 6, suffix: '+', label: 'Intelligence Sources' },
  { value: 50, suffix: '+', label: 'Detection Engines' },
  { valueText: 'Real-Time', label: 'Threat Analysis' },
  { value: 100, suffix: '%', label: 'Open to Use' },
];

function AnimatedCounter({
  value,
  suffix = '',
  active,
}: {
  value: number;
  suffix?: string;
  active: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplay(0);
      return;
    }

    let rafId = 0;
    let start: number | null = null;
    const duration = 1500;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [active, value]);

  return (
    <span className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export default function AboutPageView() {
  const { scrollY } = useScroll();
  const blob1Y = useTransform(scrollY, [0, 500], [0, -80]);
  const blob2Y = useTransform(scrollY, [0, 500], [0, 60]);
  const blob3Y = useTransform(scrollY, [0, 500], [0, 40]);

  const statsRef = useRef<HTMLDivElement | null>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-120px' });

  const aboutRef = useRef<HTMLDivElement | null>(null);
  const aboutInView = useInView(aboutRef, { once: true, margin: '-120px' });

  const [showScrollHint, setShowScrollHint] = useState(true);
  const containerClass = 'mx-auto w-full max-w-[1100px] px-6';

  useEffect(() => {
    const timer = window.setTimeout(() => setShowScrollHint(false), 4500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      if (latest > 40) setShowScrollHint(false);
    });
    return () => unsubscribe();
  }, [scrollY]);

  const headlineLines = [['IOC', 'Intelligence'], ['Platform']];

  const contactCards = [
    {
      icon: Globe,
      title: 'Portfolio',
      handle: 'Dhruv.dev',
      color: APP_COLORS.primary,
      action: () => window.open(PORTFOLIO_URL, '_blank', 'noopener,noreferrer'),
    },
    {
      icon: Github,
      title: 'GitHub',
      handle: '@Dhruv-dev',
      color: APP_COLORS.textPrimary,
      action: () => window.open(GITHUB_URL, '_blank', 'noopener,noreferrer'),
    },
    {
      icon: Linkedin,
      title: 'LinkedIn',
      handle: 'in/Dhruv',
      color: APP_COLORS.accentBlue,
      action: () => window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer'),
    },
    {
      icon: Mail,
      title: 'Email',
      handle: EMAIL,
      color: APP_COLORS.primary,
      action: () => {
        window.location.href = `mailto:${EMAIL}`;
      },
    },
  ];

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: APP_COLORS.background, color: APP_COLORS.textPrimary }}
    >
      <section className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="about-blob"
            style={{
              width: 400,
              height: 400,
              top: '-8%',
              left: '-6%',
              backgroundColor: `${APP_COLORS.primary}1F`,
              y: blob1Y,
              animation: 'float1 8s ease-in-out infinite alternate',
            }}
          />
          <motion.div
            className="about-blob"
            style={{
              width: 500,
              height: 500,
              right: '-8%',
              bottom: '-10%',
              backgroundColor: `${APP_COLORS.accentBlue}14`,
              y: blob2Y,
              animation: 'float2 10s ease-in-out infinite alternate',
            }}
          />
          <motion.div
            className="about-blob"
            style={{
              width: 300,
              height: 300,
              right: '12%',
              top: '-6%',
              backgroundColor: `${APP_COLORS.accentPurple}12`,
              y: blob3Y,
              animation: 'float3 7s ease-in-out infinite alternate',
            }}
          />
        </div>

        <div className={`${containerClass} relative z-10 flex min-h-screen flex-col items-center justify-center pb-16 pt-24 text-center`}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2"
            style={{
              borderColor: `${APP_COLORS.primary}40`,
              backgroundColor: `${APP_COLORS.primary}10`,
              color: APP_COLORS.primary,
              letterSpacing: '0.1em',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span
              className="about-pulse-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: APP_COLORS.primary,
              }}
            />
            CYBER THREAT INTELLIGENCE PLATFORM
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8"
          >
            <VigilanceLogo
              variant="full"
              size="xl"
              theme="light"
              showTagline={true}
              href="/"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="mt-6 space-y-2"
          >
            {headlineLines.map((words, lineIndex) => (
              <motion.div
                key={`headline-${lineIndex}`}
                variants={heroLine}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center gap-3 text-5xl font-black sm:text-6xl md:text-8xl"
              >
                {words.map((word) => (
                  <motion.span
                    key={`${word}-${lineIndex}`}
                    variants={heroWord}
                    style={{
                      color: lineIndex === headlineLines.length - 1 ? APP_COLORS.primary : APP_COLORS.textPrimary,
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mt-6 max-w-[520px] text-base sm:text-lg"
            style={{ color: APP_COLORS.textSecondary, lineHeight: 1.8 }}
          >
            Real-time multi-source threat intelligence for security analysts, SOC teams, and
            independent researchers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href="/analyze" className={`${BUTTON_STYLES.primary} inline-flex items-center gap-2`}>
                Analyze Threats
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <Link href="/dashboard" className={`${BUTTON_STYLES.secondary} inline-flex items-center gap-2`}>
              View Dashboard
            </Link>
          </motion.div>
        </div>

        <AnimatePresence>
          {showScrollHint ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, delay: 1.2 }}
              className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="rounded-full border p-2"
                style={{ borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.surface }}
              >
                <ChevronDown className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section
        ref={statsRef}
        className="border-y"
        style={{ backgroundColor: APP_COLORS.surface, borderColor: APP_COLORS.border }}
      >
        <div className={`${containerClass} flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between`}>
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`flex-1 px-3 py-2 text-center ${index > 0 ? 'sm:border-l' : ''}`}
              style={{ borderColor: APP_COLORS.border }}
            >
              <div className="text-4xl font-black sm:text-5xl" style={{ color: APP_COLORS.primary }}>
                {'valueText' in stat ? (
                  <span>{stat.valueText}</span>
                ) : (
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} active={statsInView} />
                )}
              </div>
              <p className="mt-2 text-sm font-medium" style={{ color: APP_COLORS.textMuted }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24">
        <div ref={aboutRef} className={containerClass}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <h2 className="text-3xl font-black sm:text-4xl" style={{ color: APP_COLORS.textPrimary }}>
              What is the platform?
            </h2>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: aboutInView ? 48 : 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="mt-3 h-1 rounded-full"
              style={{ backgroundColor: APP_COLORS.primary }}
            />
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-6 max-w-[680px] text-base"
            style={{ color: APP_COLORS.textSecondary, lineHeight: 1.8 }}
          >
            This platform is a full-stack cyber threat intelligence experience that aggregates
            signals from VirusTotal, GreyNoise, ThreatFox, URLhaus, MalwareBazaar, and IPQS to
            deliver unified, actionable threat verdicts on IPs, domains, URLs, and file hashes in
            seconds.
          </motion.p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURE_CARDS.map((card, index) => (
              <motion.div
                key={card.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-2xl border p-6 ${SHADOWS.card}`}
                style={{ backgroundColor: APP_COLORS.surface, borderColor: APP_COLORS.border }}
              >
                <span
                  className="absolute left-0 top-0 h-10 w-10"
                  style={{
                    backgroundColor: `${APP_COLORS.primary}12`,
                    borderBottomRightRadius: 16,
                  }}
                />
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${APP_COLORS.primary}15` }}
                >
                  <card.icon className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
                </div>
                <h3 className="mt-4 text-base font-bold" style={{ color: APP_COLORS.textPrimary }}>
                  {card.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: APP_COLORS.textSecondary, lineHeight: 1.7 }}>
                  {card.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section
        className="border-y py-20"
        style={{ backgroundColor: APP_COLORS.surface, borderColor: APP_COLORS.border }}
      >
        <div className={containerClass}>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center text-2xl font-black sm:text-3xl"
            style={{ color: APP_COLORS.textPrimary }}
          >
            Built With
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            {TECH_STACK.map((item) => (
              <motion.div
                key={item.name}
                variants={scaleIn}
                whileHover={{ scale: 1.08, y: -3 }}
                className="flex items-center gap-2 rounded-full border px-5 py-2"
                style={{ backgroundColor: APP_COLORS.surface, borderColor: APP_COLORS.border }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.dot }}
                />
                <span className="text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
                  {item.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className={containerClass}>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: APP_COLORS.primary }}
          >
            The Builder
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className={`relative mx-auto mt-10 flex max-w-[780px] flex-col gap-8 overflow-hidden rounded-[24px] border p-8 sm:flex-row sm:p-10 ${SHADOWS.glow}`}
            style={{ backgroundColor: APP_COLORS.surface, borderColor: APP_COLORS.border }}
          >
            <div
              className="absolute right-[-80px] top-[-80px] h-[300px] w-[300px] rounded-full"
              style={{ backgroundColor: `${APP_COLORS.primary}0A` }}
            />
            <div
              className="absolute bottom-[-60px] left-[-60px] h-[200px] w-[200px] rounded-full"
              style={{ backgroundColor: `${APP_COLORS.accentPurple}0A` }}
            />

            <div className="relative z-10 flex flex-col items-center text-center sm:items-start sm:text-left">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${APP_COLORS.primary}, ${APP_COLORS.accentOrange})`,
                  border: `3px solid ${APP_COLORS.primary}30`,
                }}
              >
                <span className="text-4xl font-black" style={{ color: APP_COLORS.textOffWhite }}>
                  V
                </span>
              </div>
              <h3 className="mt-4 text-xl font-black" style={{ color: APP_COLORS.textPrimary }}>
                {YOUR_NAME}
              </h3>
              <p className="text-sm font-semibold" style={{ color: APP_COLORS.primary }}>
                Full-Stack Developer
              </p>
              <span
                className="mt-3 rounded-full px-3 py-1 text-xs"
                style={{
                  backgroundColor: APP_COLORS.backgroundSoft,
                  color: APP_COLORS.textMuted,
                }}
              >
                📍 India
              </span>
            </div>

            <div className="relative z-10 flex-1">
              <p className="text-lg font-bold" style={{ color: APP_COLORS.textPrimary }}>
                Hey there 👋
              </p>
              <p className="mt-3 text-sm" style={{ color: APP_COLORS.textSecondary, lineHeight: 1.8 }}>
                I'm {YOUR_NAME} — a full-stack developer with a passion for cybersecurity tooling,
                data visualization, and building platforms that make complex intelligence data
                accessible and actionable.
              </p>
              <p className="mt-3 text-sm" style={{ color: APP_COLORS.textSecondary, lineHeight: 1.8 }}>
                This platform started as a personal project to learn threat intelligence APIs and
                ended up becoming a full production platform — multi-source IOC analysis, live
                dashboards, file analysis with MITRE ATT&CK mapping, and domain intelligence. Every
                feature came from a real security problem I wanted to solve.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: APP_COLORS.backgroundSoft,
                      borderColor: APP_COLORS.border,
                      color: APP_COLORS.textSecondary,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className={containerClass}>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: APP_COLORS.primary }}
          >
            Get in Touch
          </motion.p>

          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-4 text-center text-3xl font-black sm:text-4xl"
            style={{ color: APP_COLORS.textPrimary }}
          >
            Let's Connect
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-3 text-center text-base"
            style={{ color: APP_COLORS.textMuted }}
          >
            Have a project, collab idea, or just want to talk security?
          </motion.p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {contactCards.map((card) => (
              <motion.button
                key={card.title}
                type="button"
                variants={fadeUp}
                whileHover={{ y: -5, borderColor: APP_COLORS.primary }}
                className={`flex flex-col items-center rounded-2xl border p-6 text-center transition-colors ${SHADOWS.card}`}
                style={{ backgroundColor: APP_COLORS.surface, borderColor: APP_COLORS.border }}
                onClick={card.action}
              >
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <card.icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <p className="text-sm font-bold" style={{ color: APP_COLORS.textPrimary }}>
                  {card.title}
                </p>
                <p className="mt-1 text-xs" style={{ color: APP_COLORS.textMuted, fontFamily: 'monospace' }}>
                  {card.handle}
                </p>
              </motion.button>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-8 text-center text-sm"
            style={{ color: APP_COLORS.textMuted }}
          >
            Want to collaborate on a security project?
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-4 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/analyze" className={`${BUTTON_STYLES.primary} inline-flex items-center gap-2`}>
              Analyze Something →
            </Link>
            <Link href="/dashboard" className={`${BUTTON_STYLES.secondary} inline-flex items-center gap-2`}>
              View Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      <section
        className="border-t py-5"
        style={{ backgroundColor: APP_COLORS.surface, borderColor: APP_COLORS.border }}
      >
        <div className={containerClass}>
          <p className="text-center text-xs" style={{ color: APP_COLORS.textMuted }}>
            Built with ❤️ and way too much caffeine
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs" style={{ color: APP_COLORS.textMuted }}>
            <VigilanceLogo variant="compact" size="xs" theme="light" />
            <span>· © 2026 · Made by {YOUR_NAME}</span>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes float1 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(30px, 20px);
          }
        }
        @keyframes float2 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(-40px, -20px);
          }
        }
        @keyframes float3 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(20px, 30px);
          }
        }
        @keyframes pulseDot {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.4);
          }
          100% {
            transform: scale(1);
          }
        }
        .about-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          z-index: 0;
        }
        .about-pulse-dot {
          animation: pulseDot 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}

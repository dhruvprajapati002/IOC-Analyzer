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
const FULL_NAME = 'Dhruv Prajapati';

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

const SKILL_BARS = [
  { label: 'Next.js', pct: 90, color: APP_COLORS.textPrimary },
  { label: 'Cybersecurity', pct: 85, color: APP_COLORS.primary },
  { label: 'API Integration', pct: 88, color: APP_COLORS.accentCyan },
  { label: 'MongoDB', pct: 80, color: APP_COLORS.success },
  { label: 'Data Visualization', pct: 82, color: APP_COLORS.accentPurple },
  { label: 'TypeScript', pct: 78, color: APP_COLORS.accentBlue },
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

function Typewriter() {
  const phrases = [
    'threat intel platforms...',
    'security dashboards...',
    'full-stack apps...',
    'open-source tools...',
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIndex];
    const delay = deleting ? 40 : 80;
    const timer = window.setTimeout(() => {
      if (!deleting && charIndex < current.length) {
        setCharIndex((prev) => prev + 1);
      } else if (!deleting && charIndex === current.length) {
        window.setTimeout(() => setDeleting(true), 1400);
      } else if (deleting && charIndex > 0) {
        setCharIndex((prev) => prev - 1);
      } else {
        setDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [charIndex, deleting, phraseIndex, phrases]);

  return (
    <p className="mt-3 text-sm font-mono" style={{ color: APP_COLORS.textSecondary }}>
      <span style={{ color: APP_COLORS.primary }}>{'>'}</span>
      {' Currently building: '}
      <span style={{ color: APP_COLORS.accentCyan }}>
        {phrases[phraseIndex].slice(0, charIndex)}
      </span>
      <span className="typewriter-cursor">|</span>
    </p>
  );
}

function FooterLink({
  icon: Icon,
  label,
  href,
  hoverColor,
}: {
  icon: typeof Globe;
  label: string;
  href: string;
  hoverColor: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? hoverColor : APP_COLORS.textSecondary,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        textDecoration: 'none',
        transition: 'color 0.2s ease',
      }}
    >
      <Icon
        style={{
          width: 16,
          height: 16,
          color: hovered ? hoverColor : APP_COLORS.textMuted,
          transition: 'color 0.2s ease',
          flexShrink: 0,
        }}
      />
      {label}
    </a>
  );
}

export default function AboutPageView() {
  const { scrollY, scrollYProgress } = useScroll();
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const blob1Y = useTransform(scrollY, [0, 500], [0, -80]);
  const blob2Y = useTransform(scrollY, [0, 500], [0, 60]);
  const blob3Y = useTransform(scrollY, [0, 500], [0, 40]);

  const statsRef = useRef<HTMLDivElement | null>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-120px' });

  const aboutRef = useRef<HTMLDivElement | null>(null);
  const aboutInView = useInView(aboutRef, { once: true, margin: '-120px' });

  const skillsRef = useRef<HTMLDivElement | null>(null);
  const skillsInView = useInView(skillsRef, { once: true, margin: '-120px' });

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
      color: APP_COLORS.accentBlue,
      action: () => window.open(PORTFOLIO_URL, '_blank', 'noopener,noreferrer'),
    },
    {
      icon: Github,
      title: 'GitHub',
      handle: '@Dhruv-dev',
      color: APP_COLORS.accentBlue,
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
      color: APP_COLORS.danger,
      action: () => {
        window.location.href = `mailto:${EMAIL}`;
      },
    },
  ];
  
  const CONNECT_LINKS = [
    { icon: Globe, label: 'Portfolio', href: PORTFOLIO_URL, hoverColor: APP_COLORS.primary },
    { icon: Github, label: 'GitHub', href: GITHUB_URL, hoverColor: '#181717' },
    { icon: Linkedin, label: 'LinkedIn', href: LINKEDIN_URL, hoverColor: '#0A66C2' },
    { icon: Mail, label: 'Email', href: `mailto:${EMAIL}`, hoverColor: '#EA4335' },
  ];



  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: APP_COLORS.background, color: APP_COLORS.textPrimary }}
    >
      <motion.div
        className="fixed left-0 top-0 z-50 h-[2px] w-full origin-left"
        style={{
          scaleX: progressScale,
          backgroundColor: APP_COLORS.primary,
          boxShadow: `0 0 8px ${APP_COLORS.primary}`,
        }}
      />
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
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="relative mt-3 inline-flex items-center gap-2 overflow-hidden rounded-full border px-4 py-1.5"
            style={{
              borderColor: '#F59E0B40',
              backgroundColor: '#F59E0B10',
              color: '#F59E0B',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            🎓 B.TECH FINAL YEAR PROJECT · SAFFRON INSTITUTE OF TECHNOLOGY · 2025–26
            <span className="college-badge-shimmer" />
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
            className="relative mx-auto mt-10 w-full max-w-[900px]"
          >
            <div className="relative rounded-[28px] p-[1px]">
              <div className="builder-border-spin" />
              <div
                className="relative overflow-hidden rounded-[27px] border builder-dotgrid scanlines"
                style={{
                  backgroundColor: `${APP_COLORS.surface}E6`,
                  borderColor: APP_COLORS.border,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[240px_1fr]">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative h-[120px] w-[120px]">
                      <div
                        className="absolute inset-[-8px] hex-clip"
                        style={{
                          backgroundColor: `${APP_COLORS.primary}30`,
                          filter: 'blur(12px)',
                        }}
                      />
                      <div
                        className="hex-clip flex h-[120px] w-[120px] items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${APP_COLORS.primary}, ${APP_COLORS.accentOrange})`,
                        }}
                      >
                        <span className="text-[52px] font-black" style={{ color: APP_COLORS.textOffWhite }}>
                          D
                        </span>
                      </div>
                    </div>
                    <h3 className="mt-5 text-xl font-black" style={{ color: APP_COLORS.textPrimary }}>
                      {FULL_NAME}
                    </h3>
                    <p
                      className="mt-2 max-w-[180px] text-xs font-semibold"
                      style={{ color: APP_COLORS.primary }}
                    >
                      Full-Stack Developer &amp; Security Researcher
                    </p>
                    <span
                      className="mt-3 rounded-full px-3 py-1 text-xs"
                      style={{
                        backgroundColor: APP_COLORS.backgroundSoft,
                        color: APP_COLORS.textMuted,
                      }}
                    >
                      📍 Gujarat, India
                    </span>
                    <span
                      className="mt-2 rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: '#F59E0B10',
                        color: '#F59E0B',
                        borderColor: '#F59E0B30',
                      }}
                    >
                      🎓 Saffron Institute of Technology
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="overflow-hidden rounded-lg border" style={{ borderColor: APP_COLORS.border }}>
                      <div
                        className="flex items-center gap-1.5 rounded-t-lg px-4 py-2.5"
                        style={{ backgroundColor: APP_COLORS.background }}
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#FF5F57' }} />
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#FFBD2E' }} />
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#28CA42' }} />
                        <span className="ml-3 text-xs font-mono" style={{ color: APP_COLORS.textMuted }}>
                          dhruv@Threatlense ~ about.tsx
                        </span>
                      </div>
                      <div
                        className="rounded-b-lg px-5 py-4"
                        style={{ backgroundColor: APP_COLORS.backgroundSoft }}
                      >
                        <p className="font-mono text-xs" style={{ color: APP_COLORS.textMuted }}>
                          // Full-stack developer passionate about cybersecurity tooling
                        </p>
                        <p
                          className="mt-3 text-sm"
                          style={{ color: APP_COLORS.textSecondary, lineHeight: 1.8 }}
                        >
                          I'm {YOUR_NAME} — a full-stack developer with a passion for cybersecurity tooling,
                          data visualization, and building platforms that make complex intelligence data
                          accessible and actionable.
                        </p>
                        <p
                          className="mt-3 text-sm"
                          style={{ color: APP_COLORS.textSecondary, lineHeight: 1.8 }}
                        >
                          This platform started as a personal project to learn threat intelligence APIs and
                          ended up becoming a full production platform — multi-source IOC analysis, live
                          dashboards, file analysis with MITRE ATT&CK mapping, and domain intelligence. Every
                          feature came from a real security problem I wanted to solve.
                        </p>
                      </div>
                    </div>

                    <Typewriter />

                    <div ref={skillsRef} className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                      {SKILL_BARS.map((skill) => (
                        <div key={skill.label}>
                          <div
                            className="mb-1 flex justify-between text-xs font-semibold"
                            style={{ color: APP_COLORS.textSecondary }}
                          >
                            <span>{skill.label}</span>
                            <span style={{ color: skill.color }}>{skill.pct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: APP_COLORS.border }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: skill.color }}
                              initial={{ width: 0 }}
                              animate={{ width: skillsInView ? `${skill.pct}%` : 0 }}
                              transition={{ duration: 1, delay: 0.2, ease: EASE_OUT }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {contactCards.map((card) => (
                        <motion.button
                          key={card.title}
                          type="button"
                          whileHover={{ scale: 1.1, borderColor: APP_COLORS.primary }}
                          className="rounded-xl border p-2.5"
                          style={{ borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.surface }}
                          onClick={card.action}
                        >
                          <card.icon className="h-4 w-4" style={{ color: card.color }} />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
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

      <footer
        className="border-t"
        // style={{ backgroundColor: APP_COLORS.surface, borderColor: APP_COLORS.border }}
      >
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${APP_COLORS.primary}60, transparent)`,
          }}
        />

        <div className={`${containerClass} grid gap-10 py-14 md:grid-cols-3`}>
          <div>
            <VigilanceLogo variant="full" size="sm" theme="light" />
            <p className="mt-3 text-sm" style={{ color: APP_COLORS.textMuted, lineHeight: 1.7 }}>
              Multi-source cyber threat intelligence platform for security analysts,
              SOC teams, and independent researchers.
            </p>
            <div
              className="mt-4 rounded-lg border p-3"
              style={{ borderColor: '#F59E0B30', backgroundColor: '#F59E0B08' }}
            >
              <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>
                🎓 Final Year Project
              </p>
              <p className="mt-0.5 text-xs" style={{ color: APP_COLORS.textMuted }}>
                {FULL_NAME} · B.E Computer Engineering
              </p>
              <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>
                Saffrony Institute of Technology · 2025–26
              </p>
            </div>
          </div>

          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: APP_COLORS.textMuted }}
            >
              Platform
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {[
                { label: 'Analyze Threats', href: '/analyze' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Search History', href: '/history' },
                { label: 'About', href: '/about' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="footer-link-group group flex items-center gap-2 text-sm transition-colors"
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  <ArrowRight
                    className="h-3 w-3 transition-transform group-hover:translate-x-1"
                    style={{ color: APP_COLORS.primary }}
                  />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: APP_COLORS.textMuted }}
            >
              Connect
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {CONNECT_LINKS.map((item) => (
                <FooterLink key={item.label} {...item} />
              ))}
            </div>
          </div>
        </div>

        <div >
          <div className={`${containerClass} flex flex-wrap items-center justify-between gap-3 py-4`}>
            <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: APP_COLORS.textMuted }}>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-green-500"
                  style={{ animation: 'pulseDot 2s ease-in-out infinite' }}
                />
                All systems operational
              </span>
              <span>·</span>
              <span>© 2026 ThreatLense</span>
              <span>·</span>
              <span>Built with ❤️ and way too much caffeine</span>
            </div>
            <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>
              Powered by VirusTotal · GreyNoise · ThreatFox · URLhaus
            </p>
          </div>
        </div>
      </footer>

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
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        @keyframes rotateBorder {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
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
        .college-badge-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            #F59E0B30 50%,
            transparent 100%
          );
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          pointer-events: none;
        }
        .builder-border-spin {
          position: absolute;
          inset: -2px;
          border-radius: 30px;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            ${APP_COLORS.primary} 60deg,
            transparent 120deg
          );
          animation: rotateBorder 4s linear infinite;
          z-index: 0;
        }
        .builder-dotgrid {
          background-image: radial-gradient(circle, #ffffff08 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .scanlines::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          );
          pointer-events: none;
          border-radius: inherit;
        }
        .hex-clip {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .typewriter-cursor {
          animation: blink 1s step-end infinite;
        }
        .footer-link-group:hover {
          color: ${APP_COLORS.primary};
        }
        .footer-link-group:hover svg {
          color: ${APP_COLORS.primary};
        }
      `}</style>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  History,
  ShieldCheck,
  UserCircle2,
  ExternalLink,
} from "lucide-react";
import { APP_COLORS } from "@/lib/colors";
import { Logo } from "@/components/common/Logo";

const PORTFOLIO_URL = "https://your-portfolio-link-here.com";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AboutPage() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen px-4 py-10 sm:px-8"
      style={{
        backgroundColor: APP_COLORS.background,
        color: APP_COLORS.textPrimary,
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-10"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
              style={{
                borderColor: APP_COLORS.border,
                backgroundColor: APP_COLORS.surface,
                color: APP_COLORS.textPrimary,
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </motion.div>

          <motion.section
            variants={itemVariants}
            className="rounded-2xl border p-8 text-center sm:p-12"
            style={{
              backgroundColor: APP_COLORS.surface,
              borderColor: APP_COLORS.border,
            }}
          >
            <div className="mx-auto mb-5 flex w-fit justify-center">
              <Logo showTagline className="justify-center" />
            </div>
            <h1
              className="text-4xl font-black tracking-tight sm:text-6xl"
              style={{ color: APP_COLORS.primary }}
            >
              About VigilanceX
            </h1>
            <p
              className="mx-auto mt-4 max-w-3xl text-base leading-7 sm:text-lg"
              style={{ color: APP_COLORS.textSecondary }}
            >
              VigilanceX is built to help SOC teams investigate Indicators of Compromise with speed,
              context, and confidence. It unifies domain, IP, URL, hash, and file analysis into one
              focused intelligence workflow.
            </p>
          </motion.section>

          <motion.section variants={itemVariants} className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Fast IOC Lookup",
                description: "Run high-signal checks for IPs, domains, URLs, and hashes in one place.",
              },
              {
                icon: History,
                title: "Investigation History",
                description: "Preserve and revisit prior investigations to speed up repeat triage.",
              },
              {
                icon: ShieldCheck,
                title: "Actionable Verdicts",
                description: "Surface risk, detections, and source context for operational decisions.",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -4 }}
                className="rounded-xl border p-6"
                style={{
                  backgroundColor: APP_COLORS.surface,
                  borderColor: APP_COLORS.border,
                }}
              >
                <div
                  className="mb-4 inline-flex rounded-lg p-3"
                  style={{ backgroundColor: APP_COLORS.surfaceSoft }}
                >
                  <feature.icon className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: APP_COLORS.textPrimary }}>
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm leading-6" style={{ color: APP_COLORS.textSecondary }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="rounded-2xl border p-8 sm:p-10"
            style={{
              backgroundColor: APP_COLORS.surface,
              borderColor: APP_COLORS.border,
            }}
          >
            <div className="flex items-center gap-3">
              <UserCircle2 className="h-7 w-7" style={{ color: APP_COLORS.primary }} />
              <h2 className="text-2xl font-black" style={{ color: APP_COLORS.textPrimary }}>
                Developer
              </h2>
            </div>

            <p className="mt-4 text-base" style={{ color: APP_COLORS.textSecondary }}>
              Dhruv Prajapati · Full Stack Developer
            </p>

            <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: APP_COLORS.textMuted }}>
              This page is now motion-enabled and structured for production use. Update the portfolio
              URL constant in this file when you want to publish your real link.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold"
                style={{
                  backgroundColor: APP_COLORS.primary,
                  color: APP_COLORS.textOffWhite,
                }}
              >
                View Portfolio
                <ExternalLink className="h-4 w-4" />
              </Link>
              <span className="text-xs" style={{ color: APP_COLORS.textMuted }}>
                Set your real URL in PORTFOLIO_URL.
              </span>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
}

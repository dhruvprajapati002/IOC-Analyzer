"use client";
import React from "react";
import Link from "next/link";
import {
  Search,
  History,
  LayoutTemplate,
  UserCircle2,
  ExternalLink,
} from "lucide-react";
import { APP_COLORS } from "@/lib/colors";
import { Logo } from "@/components/common/Logo";

export default function AboutPage() {
  return (
    <main
      className="min-h-screen px-4 py-16 sm:px-8 flex flex-col items-center"
      style={{
        backgroundColor: APP_COLORS.background,
        color: APP_COLORS.textPrimary,
      }}
    >
      <div className="w-full max-w-4xl space-y-16">
        {/* SECTION 1: Hero */}
        <section className="text-center space-y-6 flex flex-col items-center">
          <Logo size="large" showText={false} className="mb-4" />
          <h1
            className="text-5xl md:text-7xl font-black tracking-tight whitespace-nowrap"
            style={{ color: APP_COLORS.primary }}
          >
            VigilanceX
          </h1>
          <h2
            className="text-xl md:text-3xl font-medium tracking-wide"
            style={{ color: APP_COLORS.textSecondary }}
          >
            Cyber Threat Intelligence Platform
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: APP_COLORS.textMuted }}
          >
            VigilanceX equips security analysts with a centralized suite for
            investigating Indicators of Compromise (IOCs), delivering
            lightning-fast correlations, file analysis, and actionable insights.
          </p>
        </section>

        {/* SECTION 2: Platform Overview */}
        <section
          className="rounded-2xl p-8 md:p-12 text-center shadow-sm border"
          style={{
            backgroundColor: APP_COLORS.surface,
            borderColor: APP_COLORS.border,
          }}
        >
          <h3
            className="text-2xl font-bold mb-4"
            style={{ color: APP_COLORS.textPrimary }}
          >
            Platform Overview
          </h3>
          <p
            className="text-base leading-7"
            style={{ color: APP_COLORS.textSecondary }}
          >
            The platform is designed to streamline day-to-day security
            operations. By aggregating intelligence from multiple premium feeds
            into a single pane of glass, VigilanceX eliminates context
            switching. It seamlessly handles IP, Domain, URL, and File Hash
            analysis while archiving past investigations to build internal
            threat intelligence.
          </p>
        </section>

        {/* SECTION 3: Features */}
        <section className="space-y-8">
          <h3
            className="text-2xl font-bold text-center"
            style={{ color: APP_COLORS.textPrimary }}
          >
            Core Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div
              className="p-6 rounded-xl border flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: APP_COLORS.surface,
                borderColor: APP_COLORS.borderSoft,
              }}
            >
              <div
                className="p-4 rounded-full mb-4"
                style={{ backgroundColor: APP_COLORS.surfaceSoft }}
              >
                <Search
                  className="w-6 h-6"
                  style={{ color: APP_COLORS.primary }}
                />
              </div>
              <h4
                className="font-semibold text-lg mb-2"
                style={{ color: APP_COLORS.textPrimary }}
              >
                Fast IOC Lookup
              </h4>
              <p
                className="text-sm"
                style={{ color: APP_COLORS.textSecondary }}
              >
                Instant intelligence enrichment across unified threat data
                points.
              </p>
            </div>

            <div
              className="p-6 rounded-xl border flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: APP_COLORS.surface,
                borderColor: APP_COLORS.borderSoft,
              }}
            >
              <div
                className="p-4 rounded-full mb-4"
                style={{ backgroundColor: APP_COLORS.surfaceSoft }}
              >
                <History
                  className="w-6 h-6"
                  style={{ color: APP_COLORS.primary }}
                />
              </div>
              <h4
                className="font-semibold text-lg mb-2"
                style={{ color: APP_COLORS.textPrimary }}
              >
                History Tracking
              </h4>
              <p
                className="text-sm"
                style={{ color: APP_COLORS.textSecondary }}
              >
                Automatic correlation and archival of security investigations.
              </p>
            </div>

            <div
              className="p-6 rounded-xl border flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: APP_COLORS.surface,
                borderColor: APP_COLORS.borderSoft,
              }}
            >
              <div
                className="p-4 rounded-full mb-4"
                style={{ backgroundColor: APP_COLORS.surfaceSoft }}
              >
                <LayoutTemplate
                  className="w-6 h-6"
                  style={{ color: APP_COLORS.primary }}
                />
              </div>
              <h4
                className="font-semibold text-lg mb-2"
                style={{ color: APP_COLORS.textPrimary }}
              >
                Clean UI
              </h4>
              <p
                className="text-sm"
                style={{ color: APP_COLORS.textSecondary }}
              >
                Modern, responsive interface built specifically for SOC
                operational fidelity.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: Developer Section & CTA */}
        <section
          className="rounded-2xl p-8 md:p-12 border flex flex-col items-center text-center space-y-6"
          style={{
            backgroundColor: APP_COLORS.surface,
            borderColor: APP_COLORS.border,
          }}
        >
          <div className="flex items-center justify-center space-x-3">
            <UserCircle2
              className="w-8 h-8"
              style={{ color: APP_COLORS.primary }}
            />
            <h3
              className="text-2xl font-bold"
              style={{ color: APP_COLORS.textPrimary }}
            >
              Developer
            </h3>
          </div>

          <div>
            <h4
              className="text-xl font-bold"
              style={{ color: APP_COLORS.textPrimary }}
            >
              Dhruv Prajapati
            </h4>
            <p
              className="font-medium mt-1"
              style={{ color: APP_COLORS.primary }}
            >
              Full Stack Developer
            </p>
          </div>

          <p
            className="max-w-xl text-base leading-7"
            style={{ color: APP_COLORS.textSecondary }}
          >
            I specialize in engineering robust web applications, bridging the
            gap between scalable backends and intuitive frontend experiences.
            VigilanceX represents my dedication to crafting practical,
            performance-driven tools for complex operational environments.
          </p>

          <Link
            href="https://dhruv-portfolio-23.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-8 py-4 rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            style={{
              backgroundColor: APP_COLORS.primary,
              color: "#ffffff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                APP_COLORS.surfaceTint || "#0056b3"; // Switch slightly tint
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = APP_COLORS.primary;
            }}
          >
            <span>View My Portfolio</span>
            <ExternalLink className="w-5 h-5" />
          </Link>
        </section>
      </div>
    </main>
  );
}

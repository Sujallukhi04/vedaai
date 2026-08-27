"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Grid,
  Users,
  FileText,
  BookOpen,
  Settings,
  Bell,
  ArrowLeft,
  Menu,
  X,
  ClipboardList,
  PanelLeftClose
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const showBackButton = pathname !== "/";

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-900 flex font-sans antialiased">
      {/* Mobile Dark Backdrop Overlay with Fade Animation */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* MOBILE DRAWER SIDEBAR with Smooth Slide-in/Out Animation */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 h-full bg-white z-50 shadow-2xl p-4 my-0 ml-0 rounded-r-2xl rounded-l-none border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          collapsed={false}
          mobileOpen={true}
          setCollapsed={setCollapsed}
          setMobileOpen={setMobileOpen}
        />
      </aside>

      {/* DESKTOP SIDEBAR with Smooth Expand/Collapse Transition Animation */}
      <aside
        className={`hidden md:flex sticky top-3 h-[calc(100vh-1.5rem)] my-3 ml-3 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out z-40 flex-col justify-between overflow-hidden shrink-0 ${
          collapsed ? "w-20 p-3.5" : "w-64 p-4"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          mobileOpen={false}
          setCollapsed={setCollapsed}
          setMobileOpen={setMobileOpen}
        />
      </aside>

      {/* Main App Content Container */}
      <div className="flex-1 flex flex-col min-w-0 pr-2 sm:pr-3">
        {/* Top Header Bar */}
        <header className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] px-3 sm:px-5 py-2.5 flex items-center justify-between sticky top-2 sm:top-3 z-30 my-2 sm:my-3 ml-2 sm:ml-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Back Arrow - Rendered ONLY on results/process sub-pages, NOT on Home page */}
            {showBackButton && (
              <Link
                href="/"
                className="p-1 text-slate-700 hover:text-slate-900 transition-colors"
                title="Back to Home"
              >
                <ArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </Link>
            )}

            {/* Clean Brand Name (NO logo icon badge in top navbar as requested) */}
            <Link href="/" className="flex items-center">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 font-heading">
                VedaAI
              </span>
            </Link>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <button className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 relative transition-colors">
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute top-1 right-1 ring-1 ring-white" />
            </button>

            {/* User Profile Avatar */}
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-xs">
              MR
            </div>

            {/* Mobile Hamburger Menu Drawer Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Body Container */}
        <main className="p-2 sm:p-4 ml-2 sm:ml-3 flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  mobileOpen: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function SidebarContent({
  collapsed,
  mobileOpen,
  setCollapsed,
  setMobileOpen,
}: SidebarContentProps) {
  const isCompact = collapsed && !mobileOpen;

  return (
    <>
      <div className="space-y-5">
        {/* Logo Brand Header with uploaded veda_logo.png */}
        <div
          className={`flex items-center ${
            isCompact ? "justify-center" : "justify-between px-1"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (isCompact) setCollapsed(false);
            }}
            className={`flex items-center space-x-2.5 ${
              isCompact ? "cursor-pointer group" : ""
            }`}
            title={isCompact ? "Click to expand sidebar" : undefined}
          >
            {/* User Provided VedaAI Logo Image */}
            <img
              src="/veda_logo.png"
              alt="VedaAI Logo"
              className="w-7 h-7 object-contain shrink-0 transition-transform group-hover:scale-105"
            />
            {!isCompact && (
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-heading whitespace-nowrap transition-opacity duration-200">
                VedaAI
              </span>
            )}
          </button>

          {/* Collapse Icon (Visible ONLY when expanded on Desktop) & Close Icon (Mobile) */}
          <div className="flex items-center space-x-1">
            {!collapsed && !mobileOpen && (
              <button
                onClick={() => setCollapsed(true)}
                className="hidden md:flex text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
            {mobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="md:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* AI Teacher's Toolkit CTA Button */}
        <div className="px-0.5">
          <button
            className={`w-full bg-[#25282a] hover:bg-slate-900 text-white rounded-full border-2 border-[#f0562e] font-bold text-xs py-2.5 px-3 flex items-center shadow-xs transition-all ${
              isCompact ? "justify-center" : "justify-center space-x-2"
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-400 fill-orange-400 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap transition-opacity duration-200">
                AI Teacher's Toolkit
              </span>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${
              isCompact ? "justify-center px-0" : ""
            }`}
          >
            <Grid className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap transition-opacity duration-200">
                Home
              </span>
            )}
          </Link>

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${
              isCompact ? "justify-center px-0" : ""
            }`}
          >
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap transition-opacity duration-200">
                My Classroom
              </span>
            )}
          </Link>

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${
              isCompact ? "justify-center px-0" : ""
            }`}
          >
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap transition-opacity duration-200">
                Assignments
              </span>
            )}
          </Link>

          {/* Exams (Active State matching Figma pill) */}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-900 ${
              isCompact ? "justify-center px-0" : ""
            }`}
          >
            <ClipboardList className="w-4 h-4 text-slate-800 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap transition-opacity duration-200">
                Exams
              </span>
            )}
          </Link>

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${
              isCompact ? "justify-center px-0" : ""
            }`}
          >
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap transition-opacity duration-200">
                My Library
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="space-y-3 border-t border-slate-100 pt-3">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${
            isCompact ? "justify-center px-0" : ""
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          {!isCompact && (
            <span className="whitespace-nowrap transition-opacity duration-200">
              Settings
            </span>
          )}
        </Link>

        {/* School Profile Card */}
        {!isCompact && (
          <div className="bg-slate-100/90 p-2.5 rounded-2xl flex items-center space-x-2.5 border border-slate-200/60 transition-opacity duration-200">
            <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
              🎓
            </div>
            <div className="truncate">
              <p className="text-[11px] font-bold text-slate-900 truncate">
                Delhi Public School
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                Bokaro Steel City
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

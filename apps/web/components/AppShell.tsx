"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Clipboard,
  Settings,
  Bell,
  Menu,
  X,
  HelpCircle,
  ChevronDown,
  ChevronsRight,
} from "lucide-react";

/* Exact Figma Back Arrow Icon */
function IconBackArrow({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15.8333 10H4.16663"
        stroke="#232628"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.16663 15L4.16663 10L9.16663 5"
        stroke="#232628"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Custom Figma 20x20 SVG Icons */
function IconAssignments({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7.5 14.1667H12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 10.8333H12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 7.5H8.33333"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.16663 5C4.16663 3.61929 5.28591 2.5 6.66663 2.5H10.9763C11.4183 2.5 11.8422 2.67559 12.1548 2.98816L15.3451 6.17851C15.6577 6.49107 15.8333 6.915 15.8333 7.35702V15C15.8333 16.3807 14.714 17.5 13.3333 17.5H6.66663C5.28591 17.5 4.16663 16.3807 4.16663 15V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10.8334 2.5V4.16667C10.8334 6.00762 12.3258 7.5 14.1667 7.5H15.8334"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconMyLibrary({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M17.6751 13.2417C17.1449 14.4954 16.3157 15.6002 15.2599 16.4594C14.2042 17.3187 12.954 17.9062 11.6187 18.1707C10.2835 18.4351 8.90374 18.3685 7.60017 17.9765C6.29661 17.5845 5.10891 16.8792 4.1409 15.9222C3.1729 14.9652 2.45406 13.7856 2.04725 12.4866C1.64043 11.1876 1.55802 9.80874 1.80722 8.47053C2.05641 7.13232 2.62963 5.87553 3.47676 4.81003C4.32388 3.74453 5.41912 2.90277 6.66672 2.35834"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.3333 9.99999C18.3333 8.90564 18.1178 7.82201 17.699 6.81096C17.2802 5.79991 16.6664 4.88125 15.8926 4.10743C15.1187 3.33361 14.2001 2.71978 13.189 2.30099C12.178 1.8822 11.0943 1.66666 10 1.66666V9.99999H18.3333Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMyClassroom({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="2.5"
        y="3.33333"
        width="15"
        height="10"
        rx="1.66667"
        fill="currentColor"
        fillOpacity="0.8"
      />
      <path
        d="M6.66663 16.6667L8.33329 13.3333H11.6666L13.3333 16.6667"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSidebarToggle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="2.5"
        y="2.5"
        width="15"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line
        x1="7.5"
        y1="2.5"
        x2="7.5"
        y2="17.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/* User Uploaded 2-Star Sparkles Transparent SVG - Centered Bounding Box */
function IconDoubleSparkleWhite({
  className = "w-5 h-5",
}: {
  className?: string;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8.5 2.5L10.3 7.3L15.5 9L10.3 10.7L8.5 15.5L6.7 10.7L1.5 9L6.7 7.3L8.5 2.5Z"
        fill="white"
      />
      <path
        d="M15.5 1.5L16.5 3.8L18.8 4.8L16.5 5.8L15.5 8.1L14.5 5.8L12.2 4.8L14.5 3.8L15.5 1.5Z"
        fill="white"
      />
    </svg>
  );
}

/* Figma 4th Image Match: Single 4-Point Diamond Sparkle Star SVG for Navbar */
function IconSingleSparkleBlack({
  className = "w-4.5 h-4.5",
}: {
  className?: string;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9 0L11.5 6.5L18 9L11.5 11.5L9 18L6.5 11.5L0 9L6.5 6.5L9 0Z"
        fill="#1e293b"
      />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-900 flex font-sans antialiased">
      {/* Mobile Dark Backdrop Overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* MOBILE DRAWER SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 w-[304px] h-full bg-white z-50 shadow-2xl p-4 my-0 ml-0 rounded-r-2xl border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden ${
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

      {/* DESKTOP SIDEBAR - Exact Figma 304px (Expanded) / 64px (Collapsed) */}
      <aside
        className={`hidden md:flex sticky top-3 h-[calc(100vh-1.5rem)] my-3 ml-3 bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 ease-in-out z-40 flex-col justify-between overflow-hidden shrink-0 ${
          collapsed ? "w-[64px] p-2.5" : "w-[304px] p-5"
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
        {/* Top Header Bar - Exact Figma 1100x56 Desktop / 373x56 Mobile */}
        <header className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] px-3.5 sm:px-5 h-[56px] flex items-center justify-between sticky top-2 sm:top-3 z-30 my-2 sm:my-3 ml-2 sm:ml-3">
          {/* Left Navbar Actions matching Figma Screenshot */}
          <div className="flex items-center space-x-1.5">
            {/* Borderless Soft Circular Back Arrow Button matching Figma 1st Image */}
            <Link
              href="/"
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-800 transition-colors shrink-0"
              title="Back to Home"
            >
              <IconBackArrow className="w-5 h-5" />
            </Link>

            {/* Desktop Page Navigation Label */}
            <div className="hidden md:flex items-center space-x-2 text-[#64748b]">
              <Clipboard className="w-5 h-5 text-[#94a3b8] stroke-[1.8]" />
              <span className="text-[16px] font-medium text-[#64748b]">
                Exams
              </span>
            </div>

            {/* Mobile VedaAI Brand */}
            <Link href="/" className="md:hidden flex items-center">
              <span className="font-bold text-lg tracking-tight text-slate-900 font-heading">
                VedaAI
              </span>
            </Link>
          </div>

          {/* Right Header Actions matching Figma 4th Image */}
          <div className="flex items-center space-x-2">
            {/* Question/Help Circle */}
            <button
              className="hidden md:flex text-slate-600 hover:text-slate-900 transition-colors"
              title="Help & Info"
            >
              <HelpCircle className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Notification Bell */}
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 relative transition-colors">
              <Bell className="w-5 h-5 stroke-[1.8]" />
              <span className="w-2 h-2 rounded-full bg-[#f0562e] absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>

            {/* Single 4-Point Star Sparkle Circle Button (Figma 4th Image match) */}
            <button className="hidden md:flex w-8 h-8 rounded-full  items-center justify-center transition-colors">
              <IconSingleSparkleBlack className="w-4.5 h-4.5" />
            </button>

            {/* User Profile Avatar with Name "Madhur Rastogi" */}
            <div className="flex items-center space-x-2 pl-1 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                MR
              </div>
              <span className="hidden md:inline-block text-sm font-semibold text-slate-900">
                Madhur Rastogi
              </span>
              <ChevronDown className="hidden md:inline-block w-4 h-4 text-slate-500" />
            </div>

            {/* Mobile Drawer Hamburger Menu */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-6 h-6 stroke-[2]" />
            </button>
          </div>
        </header>

        {/* Page Body Container */}
        <main className="p-2 sm:p-4 ml-2 sm:ml-3 flex-1 min-w-0">
          {children}
        </main>
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
      <div className="space-y-4 flex flex-col items-center w-full">
        {/* Logo Brand Header */}
        <div
          className={`flex items-center w-full ${
            isCompact ? "justify-center" : "justify-between px-1"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (isCompact) setCollapsed(false);
            }}
            className={`flex items-center space-x-3 ${
              isCompact ? "cursor-pointer group justify-center p-1" : ""
            }`}
            title={isCompact ? "Click to expand sidebar" : undefined}
          >
            <img
              src="/veda_logo.png"
              alt="VedaAI Logo"
              className="w-9 h-9 object-contain shrink-0 transition-transform group-hover:scale-105"
            />
            {!isCompact && (
              <span className="font-bold text-2xl tracking-tight text-slate-900 font-heading whitespace-nowrap">
                VedaAI
              </span>
            )}
          </button>

          {/* Collapse Icon when expanded */}
          {!collapsed && !mobileOpen && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden md:flex text-[#5E5E5E] hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Collapse sidebar"
            >
              <IconSidebarToggle className="w-5 h-5 text-[#5E5E5E]" />
            </button>
          )}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Close Navigation"
            >
              <X className="w-5.5 h-5.5" />
            </button>
          )}
        </div>

        {/* AI Teacher's Toolkit CTA Button - Perfectly Centered in 44x44 Circular Glow Pill when Collapsed */}
        <div className="flex justify-center w-full pt-1">
          <button
            className={`bg-[#232628] hover:bg-slate-900 text-white rounded-full border-2 border-[#f0562e] shadow-[0_0_10px_rgba(240,86,46,0.35)] transition-all flex items-center justify-center ${
              isCompact
                ? "w-[44px] h-[44px] p-0 shrink-0 mx-auto"
                : "w-[251px] h-[42px] space-x-2.5 px-4"
            }`}
          >
            <IconDoubleSparkleWhite className="w-5 h-5 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap text-[16px] font-medium text-white tracking-tight leading-none">
                AI Teacher&apos;s Toolkit
              </span>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 pt-2 w-full flex flex-col items-center">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center rounded-xl text-[16px] font-normal transition-all text-[#64748b] hover:bg-slate-100 hover:text-slate-900 ${
              isCompact
                ? "w-10 h-10 justify-center px-0"
                : "w-[254px] h-[38px] px-3.5 space-x-3.5"
            }`}
          >
            <LayoutGrid className="w-5 h-5 text-[#5E5E5E]/80 shrink-0 stroke-[1.8]" />
            {!isCompact && <span className="whitespace-nowrap">Home</span>}
          </Link>

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center rounded-xl text-[16px] font-normal transition-all text-[#64748b] hover:bg-slate-100 hover:text-slate-900 ${
              isCompact
                ? "w-10 h-10 justify-center px-0"
                : "w-[254px] h-[38px] px-3.5 space-x-3.5"
            }`}
          >
            <IconMyClassroom className="w-5 h-5 text-[#5E5E5E]/80 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap">My Classroom</span>
            )}
          </Link>

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center rounded-xl text-[16px] font-normal transition-all text-[#64748b] hover:bg-slate-100 hover:text-slate-900 ${
              isCompact
                ? "w-10 h-10 justify-center px-0"
                : "w-[254px] h-[38px] px-3.5 space-x-3.5"
            }`}
          >
            <IconAssignments className="w-5 h-5 text-[#5E5E5E]/80 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap">Assignments</span>
            )}
          </Link>

          {/* Exams (Active Pill State matching Figma) */}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center rounded-xl text-[16px] font-semibold transition-all bg-[#f1f5f9] text-slate-900 ${
              isCompact
                ? "w-10 h-10 justify-center px-0"
                : "w-[254px] h-[38px] px-3.5 space-x-3.5"
            }`}
          >
            <Clipboard className="w-5 h-5 text-slate-900 shrink-0 stroke-[2]" />
            {!isCompact && <span className="whitespace-nowrap">Exams</span>}
          </Link>

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center rounded-xl text-[16px] font-normal transition-all text-[#64748b] hover:bg-slate-100 hover:text-slate-900 ${
              isCompact
                ? "w-10 h-10 justify-center px-0"
                : "w-[254px] h-[38px] px-3.5 space-x-3.5"
            }`}
          >
            <IconMyLibrary className="w-5 h-5 text-[#5E5E5E]/80 shrink-0" />
            {!isCompact && (
              <span className="whitespace-nowrap">My Library</span>
            )}
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="space-y-3 pt-3 border-t border-slate-100 w-full flex flex-col items-center">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center rounded-xl text-[16px] font-normal text-[#64748b] hover:bg-slate-100 hover:text-slate-900 ${
            isCompact
              ? "w-10 h-10 justify-center px-0"
              : "w-[254px] h-[38px] px-3.5 space-x-3.5"
          }`}
        >
          <Settings className="w-5 h-5 text-[#5E5E5E]/80 shrink-0 stroke-[1.8]" />
          {!isCompact && <span className="whitespace-nowrap">Settings</span>}
        </Link>

        {/* Delhi Public School Profile Card */}
        {isCompact ? (
          <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
            <img
              src="/dps_logo.png"
              alt="Delhi Public School Crest Logo"
              className="w-7 h-7 object-contain mix-blend-multiply"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="bg-[#f1f5f9] p-3 rounded-[18px] flex items-center space-x-3.5 shadow-2xs w-full">
            <img
              src="/dps_logo.png"
              alt="Delhi Public School Crest Logo"
              className="w-10 h-10 object-contain mix-blend-multiply shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <p className="text-[14px] font-bold text-[#0f172a] truncate leading-snug">
                Delhi Public School
              </p>
              <p className="text-[12px] text-[#64748b] font-normal truncate mt-0.5 leading-tight">
                Bokaro Steel City
              </p>
            </div>
          </div>
        )}

        {/* Collapsed Expand Toggle Button (>>) */}
        {isCompact && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            title="Expand sidebar"
          >
            <ChevronsRight className="w-5 h-5 stroke-[2]" />
          </button>
        )}
      </div>
    </>
  );
}

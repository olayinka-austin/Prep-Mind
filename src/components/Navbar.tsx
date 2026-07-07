import React from "react";
import { User } from "../types";
import { 
  LogOut, 
  BookOpen, 
  User as UserIcon, 
  Shield, 
  Star, 
  Timer, 
  Sun, 
  Moon, 
  Trophy,
  LayoutDashboard
} from "lucide-react";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: "dashboard" | "admin" | "history" | "account") => void;
  currentView: string;
  onShowUpgrade: () => void;
  examTimeLeft?: number | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Navbar({
  user,
  onLogout,
  onNavigate,
  currentView,
  onShowUpgrade,
  examTimeLeft,
  theme,
  onToggleTheme,
}: NavbarProps) {
  // Determine if we should show the bottom bar on mobile
  const showMobileBottomNav = user && currentView !== "quiz" && currentView !== "study";

  return (
    <>
      {/* Top Header Bar (Desktop & Mobile) */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => onNavigate("dashboard")}
                className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-lg sm:text-xl tracking-tight cursor-pointer"
                id="nav-logo"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black shadow-xs">
                  P
                </div>
                <span className="font-extrabold tracking-tight">
                  PrepMind <span className="text-blue-600 dark:text-blue-400 font-black">CBT</span>
                </span>
              </button>

              {/* Exam countdown timer (shown next to logo on all view sizes if active) */}
              {examTimeLeft !== undefined && examTimeLeft !== null && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-300 border ${
                    examTimeLeft <= 120
                      ? "bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 animate-pulse"
                      : "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-200"
                  }`}
                  id="navbar-exam-timer"
                >
                  <Timer className={`h-3.5 w-3.5 ${examTimeLeft <= 120 ? "text-rose-600 dark:text-rose-400" : "text-blue-500"}`} />
                  <span className="font-mono tracking-tight text-sm">
                    {Math.floor(examTimeLeft / 60).toString().padStart(2, "0")}:
                    {(examTimeLeft % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="hidden md:inline font-sans text-[10px] uppercase tracking-wider opacity-75 ml-1">remaining</span>
                </div>
              )}
            </div>

            {/* Right: Desktop Controls & Mobile Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle Button (Available on both Desktop & Mobile Top Bar) */}
              <button
                onClick={onToggleTheme}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                id="theme-toggle-btn"
              >
                {theme === "dark" ? (
                  <Sun className="h-4.5 w-4.5 text-amber-500" />
                ) : (
                  <Moon className="h-4.5 w-4.5 text-slate-700" />
                )}
              </button>

              {user && (
                <>
                  {/* Desktop Only Navigation Links & Account Details */}
                  <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                    
                    {/* Upgrade Badge or Premium Toggler */}
                    {user.isPremium ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs font-semibold">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        Premium
                      </div>
                    ) : (
                      <button
                        onClick={onShowUpgrade}
                        className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
                        id="btn-nav-upgrade"
                      >
                        <Star className="h-3 w-3 fill-white" />
                        Upgrade
                      </button>
                    )}

                    {/* Standard Links */}
                    <button
                      onClick={() => onNavigate("dashboard")}
                      className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition ${
                        currentView === "dashboard"
                          ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      id="btn-nav-dashboard"
                    >
                      Dashboard
                    </button>

                    <button
                      onClick={() => onNavigate("history")}
                      className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition ${
                        currentView === "history"
                          ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      id="btn-nav-history"
                    >
                      History
                    </button>

                    {user.role === "admin" && (
                      <button
                        onClick={() => onNavigate("admin")}
                        className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                          currentView === "admin"
                            ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 font-bold"
                            : "text-blue-600 dark:text-blue-400 hover:text-blue-700 border-blue-200 dark:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                        }`}
                        id="btn-nav-admin"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Admin
                      </button>
                    )}

                    {/* User profile dropdown block on Desktop */}
                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.role}</div>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full text-slate-600 dark:text-slate-300 cursor-pointer" onClick={() => onNavigate("account")}>
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <button
                        onClick={onLogout}
                        className="text-slate-400 dark:text-slate-500 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                        title="Logout"
                        id="btn-nav-logout"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>

                  </div>

                  {/* Mobile Only: Minimal status indicator / Profile button in header */}
                  <div className="flex sm:hidden items-center gap-1">
                    {!user.isPremium && (
                      <button
                        onClick={onShowUpgrade}
                        className="p-1 bg-amber-500 text-white rounded-lg transition"
                        title="Upgrade"
                      >
                        <Star className="h-4 w-4 fill-white" />
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate("account")}
                      className={`p-1.5 rounded-full transition ${
                        currentView === "account"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <UserIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Visual countdown progress line at the very bottom of the header */}
        {examTimeLeft !== undefined && examTimeLeft !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                examTimeLeft <= 120 ? "bg-rose-600" : "bg-blue-600 dark:bg-blue-500"
              }`}
              style={{ width: `${(examTimeLeft / 600) * 100}%` }}
            />
          </div>
        )}
      </nav>

      {/* FIXED BOTTOM NAVIGATION BAR ON MOBILE DEVICES */}
      {showMobileBottomNav && (
        <div 
          className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl flex justify-around items-center py-2 pb-safe transition-all duration-200"
          id="mobile-bottom-navbar"
        >
          {/* Tab 1: Dashboard */}
          <button
            onClick={() => onNavigate("dashboard")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 flex-1 transition-all ${
              currentView === "dashboard"
                ? "text-blue-600 dark:text-blue-400 scale-105"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
            }`}
            id="mobile-nav-dashboard"
          >
            <BookOpen className={`h-5 w-5 ${currentView === "dashboard" ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
            <span className="text-[10px] font-bold tracking-tight">Dashboard</span>
          </button>

          {/* Tab 2: History */}
          <button
            onClick={() => onNavigate("history")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 flex-1 transition-all ${
              currentView === "history"
                ? "text-blue-600 dark:text-blue-400 scale-105"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
            }`}
            id="mobile-nav-history"
          >
            <Trophy className={`h-5 w-5 ${currentView === "history" ? "stroke-[2.5px] fill-blue-500/10" : "stroke-[2px]"}`} />
            <span className="text-[10px] font-bold tracking-tight">History</span>
          </button>

          {/* Tab 3: Account */}
          <button
            onClick={() => onNavigate("account")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 flex-1 transition-all ${
              currentView === "account"
                ? "text-blue-600 dark:text-blue-400 scale-105"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
            }`}
            id="mobile-nav-account"
          >
            <div className="relative">
              <UserIcon className={`h-5 w-5 ${currentView === "account" ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
              {user?.isPremium && (
                <span className="absolute -top-1 -right-1 bg-amber-400 rounded-full h-2 w-2 ring-1 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight">Account</span>
          </button>
        </div>
      )}
    </>
  );
}

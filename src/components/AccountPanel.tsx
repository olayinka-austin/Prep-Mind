import React from "react";
import { User, ExamResult } from "../types";
import { 
  User as UserIcon, 
  Shield, 
  Star, 
  LogOut, 
  Sun, 
  Moon, 
  Flame, 
  Coins, 
  Trophy, 
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  BookOpen
} from "lucide-react";

interface AccountPanelProps {
  user: User;
  onLogout: () => void;
  onNavigate: (view: "dashboard" | "admin" | "history" | "account") => void;
  onShowUpgrade: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  results: ExamResult[];
}

export default function AccountPanel({
  user,
  onLogout,
  onNavigate,
  onShowUpgrade,
  theme,
  onToggleTheme,
  results,
}: AccountPanelProps) {
  const totalTests = results.length;
  const avgScore = totalTests > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / totalTests) : 0;
  
  // Gamified metrics
  const activeStreak = results.length === 0 ? 1 : Math.min(results.length + 1, 5);
  const coinsEarned = results.reduce((acc, curr) => acc + Math.round(curr.correctAnswers * 50), 300);

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fadeIn" id="account-panel-root">
      {/* Top Profile Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-16 w-16 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md uppercase">
            {user.name ? user.name.slice(0, 2) : "ST"}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              {user.name}
              {user.isPremium && (
                <span className="inline-flex bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 p-0.5 rounded-md" title="Premium Subscriber">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">{user.email}</p>
            <div className="flex gap-2 mt-1">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md capitalize">
                {user.role} Account
              </span>
              {user.isPremium ? (
                <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Active Premium
                </span>
              ) : (
                <span className="bg-slate-100 dark:bg-slate-850 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
                  Free Student Tier
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Tracker Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="bg-orange-50 dark:bg-orange-950/20 p-2.5 rounded-xl">
            <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Streak</div>
            <div className="text-base font-black text-slate-800 dark:text-white">{activeStreak} Days</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl">
            <Coins className="h-5 w-5 text-emerald-500 fill-emerald-500" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prep Coins</div>
            <div className="text-base font-black text-slate-800 dark:text-white">{coinsEarned}</div>
          </div>
        </div>
      </div>

      {/* Diagnostic Progress Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">Academic CBT Records</h4>
        <div className="grid grid-cols-2 gap-4 divide-x divide-slate-150 dark:divide-slate-800">
          <div className="space-y-1">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalTests}</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Practice Simulations Cleared</p>
          </div>
          <div className="pl-4 space-y-1">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{avgScore}%</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Average CBT Accuracy</p>
          </div>
        </div>
      </div>

      {/* High-Contrast Premium Banner if not Premium */}
      {!user.isPremium && (
        <div className="bg-linear-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mb-8 blur-lg pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <span className="bg-white/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Premium Access Pass</span>
            <h4 className="font-black text-base text-amber-100">Unlock All Course Questions</h4>
            <p className="text-xs text-amber-50 font-normal leading-relaxed">
              Unlock the entire database of GST CBT materials with deep conceptual explanation tips. Save progress for offline runs!
            </p>
          </div>
          <button 
            onClick={onShowUpgrade}
            className="w-full bg-slate-900 hover:bg-slate-850 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-sm transition cursor-pointer relative z-10"
          >
            Go Premium (₦2,500)
          </button>
        </div>
      )}

      {/* Menu Options Group */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
        <div className="divide-y divide-slate-150 dark:divide-slate-800/80">
          
          {/* Toggle Theme option */}
          <div className="flex items-center justify-between p-4.5 hover:bg-slate-50/50 dark:hover:bg-slate-850 transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
                {theme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-850 dark:text-slate-200">Dark Interface Mode</div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Toggle dark/light eye strain filters</p>
              </div>
            </div>
            {/* Elegant Switch Slider */}
            <button 
              onClick={onToggleTheme}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-hidden ${
                theme === "dark" ? "bg-blue-600" : "bg-slate-200"
              }`}
            >
              <div 
                className={`bg-white h-4 w-4 rounded-full shadow-sm transform transition-transform duration-200 ${
                  theme === "dark" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Admin panel redirect (if admin) */}
          {user.role === "admin" && (
            <button
              onClick={() => onNavigate("admin")}
              className="w-full flex items-center justify-between p-4.5 hover:bg-slate-50/50 dark:hover:bg-slate-850 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-850 dark:text-slate-200">Admin Control Deck</div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Upload questions, syllabus, and study slides</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          )}

          {/* Quick FAQ / Help Info Card */}
          <div className="flex items-center justify-between p-4.5 hover:bg-slate-50/50 dark:hover:bg-slate-850 transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
                <HelpCircle className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-850 dark:text-slate-200">Help & App Info</div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">NaijaCBT Prep Platform v1.2</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase">ONLINE</span>
          </div>

          {/* Log Out Option */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between p-4.5 bg-red-50/10 dark:bg-transparent hover:bg-red-50/30 dark:hover:bg-red-950/20 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl">
                <LogOut className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-sm font-bold text-red-600 dark:text-red-400">Logout Profile</div>
                <p className="text-[10px] text-red-500/80">Safely log out of your student account</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest pt-2">
        🇳🇬 NaijaCBT Prep Portal • 2026
      </div>
    </div>
  );
}

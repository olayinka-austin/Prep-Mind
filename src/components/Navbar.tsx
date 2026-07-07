import React from "react";
import { User } from "../types";
import { LogOut, BookOpen, User as UserIcon, Shield, Star, Timer } from "lucide-react";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: "dashboard" | "admin" | "history") => void;
  currentView: string;
  onShowUpgrade: () => void;
  examTimeLeft?: number | null;
}

export default function Navbar({ user, onLogout, onNavigate, currentView, onShowUpgrade, examTimeLeft }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate("dashboard")}
              className="flex items-center gap-2 text-slate-800 font-bold text-xl tracking-tight cursor-pointer"
              id="nav-logo"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                P
              </div>
              <span className="font-bold tracking-tight">PrepMind <span className="text-blue-600 font-extrabold">CBT</span></span>
            </button>

            {examTimeLeft !== undefined && examTimeLeft !== null && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-300 border ${
                  examTimeLeft <= 120
                    ? "bg-rose-100 border-rose-300 text-rose-800 animate-pulse"
                    : "bg-blue-50 border-blue-100 text-blue-700"
                }`}
                id="navbar-exam-timer"
              >
                <Timer className={`h-3.5 w-3.5 ${examTimeLeft <= 120 ? "text-rose-600" : "text-blue-500"}`} />
                <span className="font-mono tracking-tight text-sm">
                  {Math.floor(examTimeLeft / 60).toString().padStart(2, "0")}:
                  {(examTimeLeft % 60).toString().padStart(2, "0")}
                </span>
                <span className="hidden md:inline font-sans text-[10px] uppercase tracking-wider opacity-75">remaining</span>
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Premium Badge & Upgrade Button */}
              {user.isPremium ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  Premium Access
                </div>
              ) : (
                <button
                  onClick={onShowUpgrade}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
                  id="btn-nav-upgrade"
                >
                  <Star className="h-3 w-3 fill-white" />
                  Upgrade to Premium
                </button>
              )}

              {/* Navigation Links */}
              <button
                onClick={() => onNavigate("dashboard")}
                className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
                  currentView === "dashboard"
                    ? "text-blue-700 bg-blue-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                id="btn-nav-dashboard"
              >
                Dashboard
              </button>

              <button
                onClick={() => onNavigate("history")}
                className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
                  currentView === "history"
                    ? "text-blue-700 bg-blue-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                id="btn-nav-history"
              >
                History
              </button>

              {user.role === "admin" && (
                <button
                  onClick={() => onNavigate("admin")}
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition ${
                    currentView === "admin"
                      ? "text-blue-700 bg-blue-50 border-blue-200 font-semibold"
                      : "text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50/50"
                  }`}
                  id="btn-nav-admin"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin
                </button>
              )}

              {/* User Dropdown / Info */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{user.role}</div>
                </div>
                <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                  <UserIcon className="h-4 w-4" />
                </div>
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition cursor-pointer"
                  title="Logout"
                  id="btn-nav-logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Visual countdown progress line at the very bottom of the header */}
      {examTimeLeft !== undefined && examTimeLeft !== null && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              examTimeLeft <= 120 ? "bg-rose-600" : "bg-blue-600"
            }`}
            style={{ width: `${(examTimeLeft / 600) * 100}%` }}
          />
        </div>
      )}
    </nav>
  );
}

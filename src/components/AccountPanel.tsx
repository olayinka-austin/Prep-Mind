import React, { useState, useEffect } from "react";
import { User, ExamResult, Course } from "../types";
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
  BookOpen,
  Bell,
  Clock,
  Trash2,
  Play,
  Volume2,
  Plus
} from "lucide-react";

interface AccountPanelProps {
  user: User;
  onLogout: () => void;
  onNavigate: (view: "dashboard" | "admin" | "history" | "account") => void;
  onShowUpgrade: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  results: ExamResult[];
  courses: Course[];
}

export default function AccountPanel({
  user,
  onLogout,
  onNavigate,
  onShowUpgrade,
  theme,
  onToggleTheme,
  results,
  courses,
}: AccountPanelProps) {
  const totalTests = results.length;
  const avgScore = totalTests > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / totalTests) : 0;
  
  // Gamified metrics
  const activeStreak = results.length === 0 ? 1 : Math.min(results.length + 1, 5);
  const coinsEarned = results.reduce((acc, curr) => acc + Math.round(curr.correctAnswers * 50), 300);

  // Local Reminders State
  interface Reminder {
    courseId: string;
    time: string; // e.g. "18:00"
    lastNotifiedDate: string;
  }

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const stored = localStorage.getItem("cbt_reminders");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [reminderCourseId, setReminderCourseId] = useState("");
  const [reminderTime, setReminderTime] = useState("18:00");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [tempAlert, setTempAlert] = useState<string | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support local notifications.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }
  };

  const addReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderCourseId) {
      alert("Please select a GST Course to set a reminder.");
      return;
    }

    const exists = reminders.some(
      (r) => r.courseId === reminderCourseId && r.time === reminderTime
    );

    if (exists) {
      alert("A reminder at this exact time for this course is already scheduled!");
      return;
    }

    const newReminder: Reminder = {
      courseId: reminderCourseId,
      time: reminderTime,
      lastNotifiedDate: "",
    };

    const nextReminders = [...reminders, newReminder];
    setReminders(nextReminders);
    localStorage.setItem("cbt_reminders", JSON.stringify(nextReminders));
    setReminderCourseId("");
    
    // Auto request permission if default
    if (notificationPermission === "default") {
      requestNotificationPermission();
    }
  };

  const deleteReminder = (courseId: string, time: string) => {
    const nextReminders = reminders.filter(
      (r) => !(r.courseId === courseId && r.time === time)
    );
    setReminders(nextReminders);
    localStorage.setItem("cbt_reminders", JSON.stringify(nextReminders));
  };

  const testReminder = (courseId: string) => {
    const courseObj = courses.find((c) => c.id === courseId);
    const courseTitle = courseObj ? courseObj.title : "Your GST Course";

    // Request permission if not granted
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((perm) => {
        setNotificationPermission(perm);
        if (perm === "granted") {
          try {
            new Notification("📚 Study Reminder (Test)", {
              body: `Ready for your daily PrepMind CBT session? Today's focus is: ${courseTitle}.`,
              requireInteraction: true
            });
          } catch (e) {
            showInAppAlert(courseTitle);
          }
        } else {
          showInAppAlert(courseTitle);
        }
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("📚 Study Reminder (Test)", {
          body: `Ready for your daily PrepMind CBT session? Today's focus is: ${courseTitle}.`,
          requireInteraction: true
        });
      } catch (e) {
        showInAppAlert(courseTitle);
      }
    } else {
      showInAppAlert(courseTitle);
    }
  };

  const showInAppAlert = (courseTitle: string) => {
    setTempAlert(courseTitle);
    setTimeout(() => {
      setTempAlert(null);
    }, 5000);
  };

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

      {/* Daily Study Reminders Scheduler */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-blue-600" />
              Daily Study Reminders
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Set schedules to receive study notifications for your GST courses.
            </p>
          </div>
          {notificationPermission !== "granted" ? (
            <button
              onClick={requestNotificationPermission}
              className="text-[10px] font-black bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/40 px-2.5 py-1.5 rounded-lg transition uppercase tracking-wider"
              title="Enable push notification alerts"
            >
              Enable
            </button>
          ) : (
            <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-widest">
              Active 🟢
            </span>
          )}
        </div>

        {/* Temporary simulation alert info */}
        {tempAlert && (
          <div className="bg-blue-50/75 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 p-3 rounded-xl flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300 animate-fadeIn">
            <Volume2 className="h-4 w-4 shrink-0 animate-bounce" />
            <div className="flex-1">
              <strong>Study Test:</strong> Focus course is: <strong>{tempAlert}</strong>. Notification triggered successfully!
            </div>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={addReminder} className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">GST Course</label>
              <select
                value={reminderCourseId}
                onChange={(e) => setReminderCourseId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                required
              >
                <option value="">Select GST Course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Daily Time</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="flex-1 text-xs font-black px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition shrink-0 cursor-pointer"
                  title="Schedule Daily Alert"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Scheduled Reminders List */}
        <div className="space-y-2">
          <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Scheduled Alarms</h5>
          {reminders.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">No reminders scheduled yet. Add one above to build study consistency.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              {reminders.map((rem, idx) => {
                const courseObj = courses.find((c) => c.id === rem.courseId);
                const courseTitle = courseObj ? courseObj.title : "GST Course";
                return (
                  <div key={`${rem.courseId}-${rem.time}-${idx}`} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-850 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{courseTitle}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          Daily at {rem.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => testReminder(rem.courseId)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                        title="Test trigger notification now"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteReminder(rem.courseId, rem.time)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                        title="Delete Reminder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

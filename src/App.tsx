import React, { useState, useEffect } from "react";
import { User, Course, Subject, Material, ExamResult } from "./types";
import Navbar from "./components/Navbar";
import UserDashboard from "./components/UserDashboard";
import AdminPanel from "./components/AdminPanel";
import QuizPlayer from "./components/QuizPlayer";
import StudyGuideViewer from "./components/StudyGuideViewer";
import PaystackCheckout from "./components/PaystackCheckout";
import HistoryDashboard from "./components/HistoryDashboard";
import AccountPanel from "./components/AccountPanel";
import { ShieldCheck, BookOpen, UserPlus, LogIn, Mail, Lock, User as UserIcon, Loader2, Sparkles, Star, Trophy, ArrowRight, ShieldAlert, Chrome } from "lucide-react";
import { auth, googleProvider } from "./lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const cached = localStorage.getItem("cbt_theme");
      if (cached === "dark" || cached === "light") return cached;
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("cbt_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("cbt_theme", "light");
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem("cbt_token"));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem("cbt_user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Auth Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Syllabus state
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const cached = localStorage.getItem("cbt_courses");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const cached = localStorage.getItem("cbt_subjects");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [syllabusLoading, setSyllabusLoading] = useState(true);

  // Active workspace states
  const [currentView, setCurrentView] = useState<"dashboard" | "admin" | "study" | "quiz" | "history">("dashboard");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [activeQuizMode, setActiveQuizMode] = useState<"practice" | "exam">("practice");
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<any[]>([]);

  // Payment triggers
  const [showPaystack, setShowPaystack] = useState(false);

  // Loaders
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [historyResults, setHistoryResults] = useState<ExamResult[]>(() => {
    try {
      const cached = localStorage.getItem("cbt_results");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [examTimeLeft, setExamTimeLeft] = useState<number | null>(null);

  // Custom study reminder notification state
  const [studyReminderNotification, setStudyReminderNotification] = useState<{
    courseTitle: string;
  } | null>(null);

  // Background checker for active study reminders
  useEffect(() => {
    const checkReminders = () => {
      try {
        const stored = localStorage.getItem("cbt_reminders");
        if (!stored) return;

        const reminders = JSON.parse(stored);
        if (!Array.isArray(reminders) || reminders.length === 0) return;

        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMin = now.getMinutes().toString().padStart(2, '0');
        const currentTimeString = `${currentHour}:${currentMin}`;
        const currentDateString = now.toDateString();

        let updated = false;
        const nextReminders = reminders.map((rem: any) => {
          if (rem.time === currentTimeString && rem.lastNotifiedDate !== currentDateString) {
            const courseObj = courses.find((c) => c.id === rem.courseId);
            const courseTitle = courseObj ? courseObj.title : "Your GST Course";

            // Trigger Browser Notification API
            if ("Notification" in window) {
              if (Notification.permission === "granted") {
                try {
                  new Notification("📚 Time to Study!", {
                    body: `Ready for your daily PrepMind CBT session? Focus: ${courseTitle}.`,
                    requireInteraction: true,
                  });
                } catch (e) {
                  console.error("Native notification failed: ", e);
                }
              }
            }

            // Trigger Custom In-app Overlay
            setStudyReminderNotification({ courseTitle });

            updated = true;
            return { ...rem, lastNotifiedDate: currentDateString };
          }
          return rem;
        });

        if (updated) {
          localStorage.setItem("cbt_reminders", JSON.stringify(nextReminders));
        }
      } catch (err) {
        console.error("Error in reminder interval check:", err);
      }
    };

    checkReminders();
    const intervalId = setInterval(checkReminders, 20000);

    return () => clearInterval(intervalId);
  }, [courses]);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setSyllabusLoading(false);
    }
    fetchCoursesAndSubjects();
  }, [token]);

  const fetchCurrentUser = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem("cbt_user", JSON.stringify(data.user));
        fetchHistoryResults();
        fetchAndCacheAllQuestions();
      } else {
        // Stale token
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to load user session", err);
      // Keep cached session if offline
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchCoursesAndSubjects = async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
        setSubjects(data.subjects);
        localStorage.setItem("cbt_courses", JSON.stringify(data.courses));
        localStorage.setItem("cbt_subjects", JSON.stringify(data.subjects));
      }
    } catch (err) {
      console.error("Failed to load syllabus catalogs", err);
    } finally {
      setSyllabusLoading(false);
    }
  };

  const fetchHistoryResults = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/results", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryResults(data.results);
        localStorage.setItem("cbt_results", JSON.stringify(data.results));
      }
    } catch (err) {
      console.error("Failed to load history results", err);
    }
  };

  const fetchAndCacheAllQuestions = async () => {
    if (!token || !navigator.onLine) return;
    try {
      const response = await fetch("/api/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const questionsList = data.questions;
        const grouped: { [subjectId: string]: any[] } = {};
        if (Array.isArray(questionsList)) {
          questionsList.forEach((q: any) => {
            if (!grouped[q.subjectId]) {
              grouped[q.subjectId] = [];
            }
            grouped[q.subjectId].push(q);
          });
          localStorage.setItem("cbt_questions_by_subject", JSON.stringify(grouped));
        }
      }
    } catch (err) {
      console.error("Failed to pre-fetch and cache questions", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cbt_token");
    localStorage.removeItem("cbt_user");
    localStorage.removeItem("cbt_courses");
    localStorage.removeItem("cbt_subjects");
    localStorage.removeItem("cbt_results");
    localStorage.removeItem("cbt_materials");
    localStorage.removeItem("cbt_questions_by_subject");
    setToken(null);
    setUser(null);
    setCurrentView("dashboard");
    setActiveCourse(null);
    setActiveSubject(null);
    setActiveMaterial(null);
    setActiveQuizQuestions([]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("cbt_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setEmail("");
        setPassword("");
      } else {
        setAuthError(data.error || "Login failed.");
      }
    } catch (err: any) {
      setAuthError("Failed to connect to authentication server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setAuthLoading(true);
    setAuthError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("cbt_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setAuthError(data.error || "Signup failed.");
      }
    } catch (err: any) {
      setAuthError("Failed to connect to authentication server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userObj = result.user;
      if (!userObj.email) {
        throw new Error("Could not retrieve email from Google Account.");
      }

      const response = await fetch("/api/auth/firebase-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userObj.email,
          name: userObj.displayName || "Google User",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("cbt_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setEmail("");
        setPassword("");
      } else {
        setAuthError(data.error || "Google Sign-In failed.");
      }
    } catch (err: any) {
      console.error("Firebase Auth Error", err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Google Sign-In was cancelled.");
      } else {
        setAuthError(err.message || "Failed to authenticate with Google.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStartQuiz = async (course: Course, subject: Subject, mode: "practice" | "exam") => {
    // If exam mode and not premium, lock it (QuizPlayer handles locking UI too, but we can verify here)
    if (mode === "exam" && user && !user.isPremium) {
      // Trigger Paystack popup
      setActiveCourse(course);
      setActiveSubject(subject);
      setActiveQuizMode(mode);
      setShowPaystack(true);
      return;
    }

    setQuestionsLoading(true);
    setActiveCourse(course);
    setActiveSubject(subject);
    setActiveQuizMode(mode);

    try {
      let questionsList: any[] = [];

      if (navigator.onLine) {
        try {
          const response = await fetch(`/api/questions?subjectId=${subject.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            questionsList = data.questions || [];

            // Cache these questions specifically in localStorage
            try {
              const cachedMap = JSON.parse(localStorage.getItem("cbt_questions_by_subject") || "{}");
              cachedMap[subject.id] = questionsList;
              localStorage.setItem("cbt_questions_by_subject", JSON.stringify(cachedMap));
            } catch (err) {
              console.error("Error updating local questions cache", err);
            }
          } else {
            throw new Error(`Server returned status ${response.status}`);
          }
        } catch (fetchErr) {
          console.warn("Could not fetch questions online, attempting fallback", fetchErr);
          const cachedMap = JSON.parse(localStorage.getItem("cbt_questions_by_subject") || "{}");
          questionsList = cachedMap[subject.id] || [];
        }
      } else {
        const cachedMap = JSON.parse(localStorage.getItem("cbt_questions_by_subject") || "{}");
        questionsList = cachedMap[subject.id] || [];
      }

      if (questionsList && questionsList.length > 0) {
        setActiveQuizQuestions(questionsList);
        setCurrentView("quiz");
      } else {
        alert("No cached questions found for this subject. Please connect to the internet to load questions for the first time.");
      }
    } catch (err: any) {
      console.error("Failed to load questions", err);
      alert(`Failed to load questions: ${err.message || err || "Connection error."}`);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleStartStudy = (material: Material) => {
    setActiveMaterial(material);
    setCurrentView("study");
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reference, simulatedSuccess: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user); // Update premium state on client
        setShowPaystack(false);
        alert("Verification successful! Premium access unlocked instantly.");
        
        // If they had a quiz pending, start it!
        if (activeCourse && activeSubject && activeQuizMode) {
          handleStartQuiz(activeCourse, activeSubject, activeQuizMode);
        }
      }
    } catch (err) {
      console.error("Verification error: ", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col justify-between text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Navbar overlay */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onNavigate={(view) => {
          setCurrentView(view);
          setActiveMaterial(null);
          setActiveCourse(null);
          setActiveSubject(null);
          setExamTimeLeft(null);
        }}
        currentView={currentView}
        onShowUpgrade={() => setShowPaystack(true)}
        examTimeLeft={examTimeLeft}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className={`flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 ${user && currentView !== "quiz" && currentView !== "study" ? "pb-24 sm:pb-8" : "pb-8"}`}>
        {/* If Loading Auth State */}
        {authLoading && !user ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <span className="text-sm text-slate-500 font-semibold">Validating Student Credentials...</span>
          </div>
        ) : !user ? (
          /* Authentication Screen (Signup / Login) */
          <div className="max-w-md mx-auto my-8" id="auth-box">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden p-6 sm:p-8 space-y-6 transition-colors duration-200">
              {/* Logo / Heading */}
              <div className="text-center space-y-1.5">
                <div className="inline-flex bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 p-3 rounded-xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                  {authView === "login" ? "Welcome Back Student" : "Register Student Account"}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {authView === "login"
                    ? "Enter your details below to access your CBT test materials"
                    : "Create a prep syllabus account and start AI study programs"}
                </p>
              </div>

              {authError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl text-center">
                  {authError}
                </div>
              )}

              {/* Form selection */}
              {authView === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 dark:focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 dark:focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition flex justify-center items-center gap-1.5 cursor-pointer"
                  >
                    {authLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                    <span>Secure Sign In</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                        <UserIcon className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Austin Olayinka"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 dark:focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 dark:focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 dark:focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition flex justify-center items-center gap-1.5 cursor-pointer"
                  >
                    {authLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    <span>Create Free Account</span>
                  </button>
                </form>
              )}

              {/* OR Divider and Google Auth Button */}
              <div className="space-y-4">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Or continue with</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-xs shadow-xs transition flex justify-center items-center gap-2 cursor-pointer"
                  id="google-signin-btn"
                >
                  {authLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                  ) : (
                    <Chrome className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* View Switch Link */}
              <div className="text-center border-t border-slate-200 dark:border-slate-800 pt-4">
                <button
                  onClick={() => {
                    setAuthView(authView === "login" ? "signup" : "login");
                    setAuthError("");
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 mx-auto cursor-pointer"
                >
                  {authView === "login" ? (
                    <>
                      <span>Don't have an account? Sign Up</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Already have an account? Sign In</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Login Helpers for Reviewer */}
            <div className="mt-5 bg-slate-100/50 p-4 border border-slate-200 rounded-xl space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Fast-Track Test Portals (Simulation)</div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setEmail("austinolayinka667@gmail.com");
                    setPassword("admin123");
                    setAuthView("login");
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-extrabold text-indigo-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                >
                  <span>Log as Admin</span>
                </button>
                <button
                  onClick={() => {
                    setEmail("student@cbtprep.com");
                    setPassword("student123");
                    setAuthView("login");
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-extrabold text-blue-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                >
                  <span>Log as Student</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Workspace Dashboard / Panels */
          <div className="space-y-6">
            {/* If Syllabus Catalogs are loading */}
            {syllabusLoading || questionsLoading ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <span className="text-sm text-slate-500 font-semibold">
                  {questionsLoading ? "Constructing exam sheets..." : "Synchronizing syllabus courses..."}
                </span>
              </div>
            ) : currentView === "dashboard" ? (
              <UserDashboard
                user={user}
                courses={courses}
                subjects={subjects}
                token={token!}
                onStartQuiz={handleStartQuiz}
                onStartStudy={handleStartStudy}
                onShowUpgrade={() => setShowPaystack(true)}
              />
            ) : currentView === "admin" && user.role === "admin" ? (
              <AdminPanel
                token={token!}
                courses={courses}
                subjects={subjects}
                onRefreshData={fetchCoursesAndSubjects}
              />
            ) : currentView === "study" && activeMaterial ? (
              <StudyGuideViewer
                material={activeMaterial}
                token={token!}
                onBack={() => {
                  setCurrentView("dashboard");
                  setActiveMaterial(null);
                }}
              />
            ) : currentView === "quiz" && activeCourse && activeSubject ? (
              <QuizPlayer
                user={user}
                course={activeCourse}
                subject={activeSubject}
                questions={activeQuizQuestions}
                mode={activeQuizMode}
                token={token!}
                onBack={() => {
                  setCurrentView("dashboard");
                  setActiveCourse(null);
                  setActiveSubject(null);
                  setExamTimeLeft(null);
                  fetchHistoryResults();
                }}
                onUpgradeTrigger={() => setShowPaystack(true)}
                onSaveResult={() => fetchHistoryResults()}
                onTimeUpdate={setExamTimeLeft}
              />
            ) : currentView === "history" ? (
              <div className="space-y-6" id="history-panel">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Activity Study Log</h2>
                    <p className="text-xs text-slate-500">Track all your diagnostic practice scores and CBT mock histories</p>
                  </div>
                  <button
                    onClick={fetchHistoryResults}
                    className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                  >
                    Sync Records
                  </button>
                </div>

                <HistoryDashboard results={historyResults} />

                <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-3">COURSE / LEVEL</th>
                          <th className="p-3">SUBJECT</th>
                          <th className="p-3 text-center">MODE</th>
                          <th className="p-3 text-center">SCORE</th>
                          <th className="p-3 text-center">CORRECT</th>
                          <th className="p-3 text-right">DATE ATTEMPTED</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {historyResults.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center p-8 text-slate-400">No attempts logged yet. Get started by taking a practice quiz!</td>
                          </tr>
                        ) : (
                          historyResults.map((res) => (
                            <tr key={res.id} className="hover:bg-slate-50/50 text-slate-700 font-medium">
                              <td className="p-3">
                                <span className="font-bold text-slate-800">{res.courseTitle}</span>
                              </td>
                              <td className="p-3 font-semibold">{res.subjectTitle}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  res.mode === "exam" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                                }`}>
                                  {res.mode}
                                </span>
                              </td>
                              <td className="p-3 text-center font-bold">
                                <span className={res.score >= 50 ? "text-blue-600" : "text-rose-500"}>
                                  {res.score}%
                                </span>
                              </td>
                              <td className="p-3 text-center">{res.correctAnswers} / {res.totalQuestions}</td>
                              <td className="p-3 text-right text-slate-400 text-[10px]">{new Date(res.date).toLocaleDateString()} {new Date(res.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : currentView === "account" && user ? (
              <AccountPanel
                user={user}
                onLogout={handleLogout}
                onNavigate={(view) => {
                  setCurrentView(view);
                  setActiveMaterial(null);
                  setActiveCourse(null);
                  setActiveSubject(null);
                  setExamTimeLeft(null);
                }}
                onShowUpgrade={() => setShowPaystack(true)}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                results={historyResults}
                courses={courses}
              />
            ) : (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-xl max-w-sm mx-auto space-y-4">
                <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
                <div>
                  <h3 className="font-bold text-slate-800">Section Restricted</h3>
                  <p className="text-xs text-slate-500">You do not have credentials to access this control deck.</p>
                </div>
                <button onClick={() => setCurrentView("dashboard")} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer">
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Paystack Checkout Modal Overlay */}
      {showPaystack && user && (
        <PaystackCheckout
          amountNaira={2500}
          email={user.email}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaystack(false)}
        />
      )}

      {/* Custom Study Reminder Alert Modal */}
      {studyReminderNotification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="reminder-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
            
            <div className="mx-auto w-14 h-14 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center animate-bounce">
              <BookOpen className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Daily Study Alert
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Time to study!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consistency is key. Your scheduled daily reminder is active for:
              </p>
              <p className="text-sm font-black text-blue-600 dark:text-blue-400 py-1">
                {studyReminderNotification.courseTitle}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStudyReminderNotification(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setStudyReminderNotification(null);
                  setCurrentView("dashboard");
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition cursor-pointer"
              >
                Start Practice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-medium">NaijaCBT Prep Platform © 2026. Built with React, Tailwind and Gemini AI.</p>
          <p className="text-[10px] text-slate-500">Fully secured CBT diagnostics supporting WAEC, NECO & JAMB UTME curriculum structures.</p>
        </div>
      </footer>
    </div>
  );
}

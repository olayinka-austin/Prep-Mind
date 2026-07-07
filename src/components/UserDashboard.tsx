import React, { useState, useEffect } from "react";
import { User, Course, Subject, Material, ExamResult } from "../types";
import {
  BookOpen,
  Sparkles,
  Trophy,
  BrainCircuit,
  BookText,
  Clock,
  PlayCircle,
  AlertCircle,
  Star,
  Flame,
  Coins,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Target,
  X,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserDashboardProps {
  user: User;
  token: string;
  courses?: Course[];
  subjects?: Subject[];
  onStartQuiz: (course: Course, subject: Subject, mode: "practice" | "exam") => void;
  onStartStudy: (material: Material) => void;
  onShowUpgrade: () => void;
}

export default function UserDashboard({
  user,
  token,
  courses: propsCourses,
  subjects: propsSubjects,
  onStartQuiz,
  onStartStudy,
  onShowUpgrade,
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "100 LEVEL" | "200 LEVEL">("ALL");
  const [activeSubjectForSheet, setActiveSubjectForSheet] = useState<{ course: Course; subject: Subject } | null>(null);

  const [courses, setCourses] = useState<Course[]>(() => {
    if (propsCourses && propsCourses.length > 0) return propsCourses;
    try {
      const cached = localStorage.getItem("cbt_courses");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    if (propsSubjects && propsSubjects.length > 0) return propsSubjects;
    try {
      const cached = localStorage.getItem("cbt_subjects");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (propsCourses && propsCourses.length > 0) {
      setCourses(propsCourses);
      if (propsCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(propsCourses[0]);
      }
    }
  }, [propsCourses]);

  useEffect(() => {
    if (propsSubjects && propsSubjects.length > 0) {
      setSubjects(propsSubjects);
    }
  }, [propsSubjects]);
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const cached = localStorage.getItem("cbt_materials");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [results, setResults] = useState<ExamResult[]>(() => {
    try {
      const cached = localStorage.getItem("cbt_results");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    fetchDashboardData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchDashboardData = async () => {
    if (!navigator.onLine) return; // Skip fetch if offline, use cached instead
    await Promise.all([
      fetchCourses(),
      fetchSubjects(),
      fetchMaterials(),
      fetchUserResults(),
    ]);
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
        localStorage.setItem("cbt_courses", JSON.stringify(data.courses));
        if (data.courses.length > 0 && !selectedCourse) {
          setSelectedCourse(data.courses[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects);
        localStorage.setItem("cbt_subjects", JSON.stringify(data.subjects));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/materials", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials);
        localStorage.setItem("cbt_materials", JSON.stringify(data.materials));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserResults = async () => {
    try {
      const res = await fetch("/api/results", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        localStorage.setItem("cbt_results", JSON.stringify(data.results));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (activeTab === "ALL") return true;
    return c.category === activeTab;
  });

  // Calculate statistics
  const totalTests = results.length;
  const avgScore = totalTests > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / totalTests) : 0;
  const highestScore = totalTests > 0 ? Math.max(...results.map((r) => r.score)) : 0;

  // Gamification formulas
  const activeStreak = results.length === 0 ? 1 : Math.min(results.length + 1, 5);
  const xpEarned = results.reduce((acc, curr) => acc + Math.round(curr.score * 12), 150);
  const coinsEarned = results.reduce((acc, curr) => acc + Math.round(curr.correctAnswers * 50), 300);

  // Daily target status (mock/real checks)
  const isGoalAchieved = results.some((res) => {
    const todayStr = new Date().toDateString();
    return new Date(res.date).toDateString() === todayStr;
  });

  return (
    <div className="space-y-8 animate-fadeIn" id="user-dashboard-root">
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold animate-fadeIn shadow-2xs" id="offline-warning-banner">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
          <div className="flex-grow">
            <strong>Offline Mode Enabled:</strong> You are currently disconnected. You can still access cached syllabi, study guides, and past test records.
          </div>
        </div>
      )}

      {/* Hero Welcome Panel */}
      <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-20 -mb-20 blur-xl pointer-events-none" />
        
        <div className="space-y-2.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-wider text-blue-100">
            <Sparkles className="h-3 w-3 fill-amber-300 text-amber-300" />
            Ultimate GST Companion
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Hi, <span className="text-amber-300 font-black">{user.name}</span>!
          </h2>
          <p className="text-xs sm:text-sm text-blue-50 max-w-xl leading-relaxed">
            Let's get those straight A's today! Pick a course below, flip interactive cards, and try stress-free practice tests.
          </p>
        </div>

        {!user.isPremium && (
          <button
            onClick={onShowUpgrade}
            className="flex-none flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-200 cursor-pointer text-xs uppercase tracking-wider relative z-10"
            id="btn-banner-upgrade"
          >
            <Star className="h-4.5 w-4.5 fill-slate-900 text-slate-900" />
            Unlock Premium (₦2,500)
          </button>
        )}
      </div>

      {/* Gamified Bento Statistics Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Streak Bento */}
        <div className="bg-linear-to-br from-orange-500/10 to-amber-500/5 dark:from-orange-950/20 dark:to-slate-900 border border-orange-200/50 dark:border-orange-900/40 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">Active Streak</div>
            <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-bounce" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{activeStreak} Days</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Keep up the daily heat!</p>
          </div>
        </div>

        {/* XP Bento */}
        <div className="bg-linear-to-br from-indigo-500/10 to-blue-500/5 dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-200/50 dark:border-indigo-900/40 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Brain XP</div>
            <BrainCircuit className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{xpEarned.toLocaleString()} XP</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Level 3: Brain Master</p>
          </div>
        </div>

        {/* Naira Coins Bento */}
        <div className="bg-linear-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200/50 dark:border-emerald-900/40 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Prep Coins</div>
            <Coins className="h-5 w-5 text-emerald-500 fill-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{coinsEarned}</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Mock simulation power</p>
          </div>
        </div>

        {/* Daily Goal Bento */}
        <div className="bg-linear-to-br from-violet-500/10 to-purple-500/5 dark:from-violet-950/20 dark:to-slate-900 border border-violet-200/50 dark:border-violet-900/40 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[110px] col-span-1">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">Daily Target</div>
            <Target className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{isGoalAchieved ? "1/1 Completed" : "0/1 Session"}</span>
              {isGoalAchieved && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{isGoalAchieved ? "Awesome work today!" : "Take 1 study guide or quiz"}</p>
          </div>
        </div>

        {/* Average Score Bento */}
        <div className="bg-linear-to-br from-blue-500/10 to-sky-500/5 dark:from-blue-950/20 dark:to-slate-900 border border-blue-200/50 dark:border-blue-900/40 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[110px] col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Accuracy</div>
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{avgScore}%</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Average score across exams</p>
          </div>
        </div>
      </div>

      {/* Pro Study Tip Card */}
      <div className="bg-linear-to-r from-blue-500/5 to-indigo-500/5 dark:from-slate-900 dark:to-slate-900/40 border border-blue-100 dark:border-slate-800 rounded-xl p-4 flex gap-3 items-center">
        <span className="text-xl">💡</span>
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          <strong>Pro Beginner Tip:</strong> Tapping <strong className="text-blue-600 dark:text-blue-400">"Study Guides"</strong> builds critical content recall before you run timed simulations. Take lessons step-by-step for the ultimate A grade!
        </div>
      </div>

      {/* Course Catalog & Subjects Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Step 1: Choose Your Course
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Pick any compulsory university GST syllabus track</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
              {["ALL", "100 LEVEL", "200 LEVEL"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat as any)}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === cat
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Courses List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filteredCourses.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 font-medium">
                No exam prep courses found in this category.
              </div>
            ) : (
              filteredCourses.map((course) => {
                const subCount = subjects.filter((s) => s.courseId === course.id).length;
                const isSelected = selectedCourse?.id === course.id;

                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden ${
                      isSelected
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 dark:border-blue-500 shadow-md ring-2 ring-blue-500/15"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5"
                    }`}
                    id={`course-card-${course.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {course.category || "CBT"}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{subCount} Units / Syllabus</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm leading-snug">{course.title}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed line-clamp-2">{course.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100/60 dark:border-slate-800/60 pt-3 text-xs font-bold">
                      <span className={isSelected ? "text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-400 dark:text-slate-500"}>
                        {isSelected ? "Selected ✅" : "Tapped to view"}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Explore Syllabus <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Subject Options for Selected Course */}
          {selectedCourse && (
            <div className="bg-slate-100/45 dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 animate-fadeIn">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 block" />
                  Step 2: Choose Syllabus Topic
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Select a subject track to launch your play guides and mock exams.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects
                  .filter((s) => s.courseId === selectedCourse.id)
                  .map((subject) => {
                    const mathCount = materials.filter((m) => m.subjectId === subject.id).length;

                    return (
                      <div
                        key={subject.id}
                        className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs hover:shadow-sm transition flex flex-col justify-between space-y-4"
                        id={`subject-card-${subject.id}`}
                      >
                        <div className="space-y-1.5">
                          <h5 className="font-extrabold text-slate-800 dark:text-white text-sm">{subject.title}</h5>
                          <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed line-clamp-2">{subject.description}</p>
                        </div>

                        {/* Standard Premium indicators */}
                        <div className="flex gap-2 items-center text-[10px] font-black tracking-wider uppercase text-slate-400">
                          <span className="bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[9px]">
                            {mathCount > 0 ? "📖 Active guides" : "Empty track"}
                          </span>
                        </div>

                        {/* Play Launcher Button - Highly Intuitive Single Button Flow */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                          {mathCount > 0 ? (
                            <button
                              onClick={() => {
                                setActiveSubjectForSheet({ course: selectedCourse, subject });
                              }}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md hover:scale-101 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                              id={`btn-open-deck-${subject.id}`}
                            >
                              <PlayCircle className="h-4.5 w-4.5" />
                              Start Chapter Deck 🚀
                            </button>
                          ) : (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 py-2 italic font-medium">
                              <AlertCircle className="h-4 w-4 text-slate-400" />
                              Admins are uploading content...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {subjects.filter((s) => s.courseId === selectedCourse.id).length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 col-span-2 text-center py-6">No active subjects created for this course yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar for Recent CBT history */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-200">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm tracking-wider uppercase border-b border-slate-100 dark:border-slate-800 pb-3.5 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Activity Study Logs
            </h3>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {results.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="text-3xl text-center">🎯</div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] mx-auto">
                    No diagnostics logged yet. Open a chapter deck to begin!
                  </p>
                </div>
              ) : (
                results.slice(0, 5).map((res) => (
                  <div key={res.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-2 text-xs hover:bg-slate-100/50 dark:hover:bg-slate-800/20 transition duration-150">
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{res.subjectTitle}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mt-1">
                          {res.mode === "exam" ? "⏱️ Exam Mode" : "🎯 Practice Mode"}
                        </div>
                      </div>
                      <div className={`font-extrabold text-sm ${res.score >= 50 ? "text-blue-600 dark:text-blue-400" : "text-rose-500"}`}>{res.score}%</div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium pt-1.5 border-t border-slate-100/60 dark:border-slate-800/60">
                      <span>{res.correctAnswers} / {res.totalQuestions} correct</span>
                      <span>{new Date(res.date).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOP CBT COMPANION DRAWER/BOTTOM SHEET OPTION POPUP */}
      <AnimatePresence>
        {activeSubjectForSheet && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSubjectForSheet(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Top pull indicator for mobile */}
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Syllabus chapter Deck</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{activeSubjectForSheet.subject.title}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{activeSubjectForSheet.course.title}</p>
                </div>
                <button
                  onClick={() => setActiveSubjectForSheet(null)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Choice lists */}
              <div className="space-y-3.5">
                {/* Mode 1: Quick summaries */}
                <button
                  onClick={() => {
                    const material = materials.find((m) => m.subjectId === activeSubjectForSheet.subject.id);
                    if (material) {
                      onStartStudy(material);
                      setActiveSubjectForSheet(null);
                    }
                  }}
                  className="w-full text-left p-4 bg-linear-to-r from-blue-50/50 to-indigo-50/20 hover:from-blue-50 dark:from-slate-850 dark:to-slate-850 dark:hover:bg-slate-800/80 border border-blue-100/60 dark:border-slate-800 rounded-2xl flex items-center gap-4 transition-all hover:scale-101 shadow-2xs group cursor-pointer"
                >
                  <div className="p-3 bg-blue-600 text-white rounded-xl">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div className="flex-grow space-y-0.5">
                    <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>📖 Chapter Study Guide</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Flip interactive flashcards & view AI cheat sheets.</p>
                  </div>
                </button>

                {/* Mode 2: Practice Quiz */}
                <button
                  onClick={() => {
                    onStartQuiz(activeSubjectForSheet.course, activeSubjectForSheet.subject, "practice");
                    setActiveSubjectForSheet(null);
                  }}
                  className="w-full text-left p-4 bg-linear-to-r from-indigo-50/50 to-violet-50/20 hover:from-indigo-50 dark:from-slate-850 dark:to-slate-850 dark:hover:bg-slate-800/80 border border-indigo-100/60 dark:border-slate-800 rounded-2xl flex items-center gap-4 transition-all hover:scale-101 shadow-2xs group cursor-pointer"
                >
                  <div className="p-3 bg-indigo-600 text-white rounded-xl">
                    <BookText className="h-5 w-5" />
                  </div>
                  <div className="flex-grow space-y-0.5">
                    <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>🎯 Play Practice Quiz</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Learn step-by-step. Get immediate AI tutor tips!</p>
                  </div>
                </button>

                {/* Mode 3: Timed CBT Exam */}
                <button
                  onClick={() => {
                    onStartQuiz(activeSubjectForSheet.course, activeSubjectForSheet.subject, "exam");
                    setActiveSubjectForSheet(null);
                  }}
                  className="w-full text-left p-4 bg-linear-to-r from-rose-50/50 to-pink-50/20 hover:from-rose-50 dark:from-slate-850 dark:to-slate-850 dark:hover:bg-slate-800/80 border border-rose-100/60 dark:border-slate-800 rounded-2xl flex items-center gap-4 transition-all hover:scale-101 shadow-2xs group cursor-pointer"
                >
                  <div className="p-3 bg-rose-600 text-white rounded-xl relative">
                    <Clock className="h-5 w-5" />
                    {!user.isPremium && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-500 border border-white dark:border-slate-900 rounded-full p-0.5 text-white">
                        <Star className="h-2.5 w-2.5 fill-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-grow space-y-0.5">
                    <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span>⏱️ Timed CBT Mock Run</span>
                        {!user.isPremium && <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Premium</span>}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">10-minute full mock simulator with score graphs.</p>
                  </div>
                </button>
              </div>

              {/* Tip info */}
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 border border-slate-100 dark:border-slate-700/60 rounded-xl">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed text-center font-semibold">
                  🚀 Tip: Starting with <strong>Chapter Study Guide</strong> is proven to raise your final exam score by up to 43%!
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


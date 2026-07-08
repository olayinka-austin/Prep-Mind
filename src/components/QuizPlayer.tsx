import { useState, useEffect, useRef } from "react";
import { Question, Course, Subject, ExamResult, User, Material } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Timer,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ShieldAlert,
  Star,
  Trophy,
  Award,
  BookOpen,
  Flag,
  Lightbulb,
  ShieldCheck,
  PlayCircle,
  AlertCircle,
  BookOpenCheck,
  RefreshCw,
  LogOut
} from "lucide-react";

interface QuizPlayerProps {
  user: User;
  course: Course;
  subject: Subject;
  questions: Question[];
  mode: "practice" | "exam";
  token: string;
  onBack: () => void;
  onUpgradeTrigger: () => void;
  onSaveResult: (result: ExamResult) => void;
  onTimeUpdate?: (secondsLeft: number | null) => void;
}

export default function QuizPlayer({
  user,
  course,
  subject,
  questions,
  mode,
  token,
  onBack,
  onUpgradeTrigger,
  onSaveResult,
  onTimeUpdate,
}: QuizPlayerProps) {
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<{ [qId: string]: boolean }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [qId: string]: boolean }>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedResult, setSavedResult] = useState<ExamResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Security & Layout State
  const [showSecureRules, setShowSecureRules] = useState(mode === "exam");
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [securityViolated, setSecurityViolated] = useState(false);
  const [wasAutoSubmitted, setWasAutoSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Dynamic Course Configurations
  const examDurationSeconds = (course.timeLimit || 60) * 60;
  const [timeLeft, setTimeLeft] = useState(examDurationSeconds);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Lock Exam Mode if user is not Premium
  const isLocked = mode === "exam" && !user.isPremium;

  // Cache materials on load for Topic Breakdown
  useEffect(() => {
    try {
      const cached = localStorage.getItem("cbt_materials");
      if (cached) {
        setMaterials(JSON.parse(cached));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Initialize, Shuffle, and Limit Questions list
  useEffect(() => {
    if (questions.length > 0) {
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      const limit = mode === "exam" ? (course.numQuestions || 60) : questions.length;
      setShuffledQuestions(shuffled.slice(0, limit));
    } else {
      setShuffledQuestions([]);
    }
  }, [questions, course, mode]);

  // Exam Countdown Engine
  useEffect(() => {
    if (isLocked || shuffledQuestions.length === 0 || isCompleted || showSecureRules) return;

    if (mode === "exam") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleExamAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, shuffledQuestions, isCompleted, isLocked, showSecureRules]);

  // Sync state changes with parent time update (if any)
  useEffect(() => {
    if (mode === "exam" && !isCompleted && !isLocked && !showSecureRules) {
      onTimeUpdate?.(timeLeft);
    } else {
      onTimeUpdate?.(null);
    }
    return () => {
      onTimeUpdate?.(null);
    };
  }, [timeLeft, mode, isCompleted, isLocked, showSecureRules, onTimeUpdate]);

  // Security Integrity Monitoring: Tab Switching & Blur Watcher
  useEffect(() => {
    if (mode !== "exam" || showSecureRules || isCompleted) return;

    const handleFocusBlur = () => {
      if (!document.hasFocus() || document.visibilityState === "hidden") {
        setTabSwitches((prev) => {
          const newVal = prev + 1;
          if (newVal >= 3) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsCompleted(true);
            submitResult(examDurationSeconds - timeLeft, true);
          } else {
            setShowViolationWarning(true);
          }
          return newVal;
        });
      }
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
    };

    window.addEventListener("blur", handleFocusBlur);
    document.addEventListener("visibilitychange", handleFocusBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      window.removeEventListener("blur", handleFocusBlur);
      document.removeEventListener("visibilitychange", handleFocusBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [mode, showSecureRules, isCompleted, timeLeft]);

  // Handle auto submit when time expires
  const handleExamAutoSubmit = () => {
    setIsCompleted(true);
    submitResult(examDurationSeconds, false, true);
  };

  // Safe Option Selection handler
  const selectOption = (optionIndex: number) => {
    if (isCompleted) return;

    const currentQuestion = shuffledQuestions[currentIndex];
    if (!currentQuestion) return;
    
    if (mode === "practice") {
      if (submittedAnswers[currentQuestion.id]) return;
      setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
      setSubmittedAnswers((prev) => ({ ...prev, [currentQuestion.id]: true }));
    } else {
      setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
    }
  };

  const handleNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatTimeUsed = (secsUsed: number) => {
    const mins = Math.floor(secsUsed / 60);
    const secs = secsUsed % 60;
    if (mins === 0) {
      return `${secs} second${secs > 1 ? "s" : ""}`;
    }
    return `${mins} min${mins > 1 ? "s" : ""}, ${secs} sec${secs > 1 ? "s" : ""}`;
  };

  const calculateScore = () => {
    let correct = 0;
    shuffledQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: shuffledQuestions.length,
      percentage: shuffledQuestions.length > 0 ? Math.round((correct / shuffledQuestions.length) * 100) : 0,
    };
  };

  // Performance Analysis grouping questions by Material Topic
  const getTopicBreakdown = () => {
    const breakdown: { [matId: string]: { title: string; correct: number; total: number } } = {};

    shuffledQuestions.forEach((q) => {
      const matId = q.materialId || "general";
      const matTitle = materials.find((m) => m.id === matId)?.title || "General Syllabus Concepts";

      if (!breakdown[matId]) {
        breakdown[matId] = { title: matTitle, correct: 0, total: 0 };
      }

      breakdown[matId].total++;
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        breakdown[matId].correct++;
      }
    });

    return Object.values(breakdown);
  };

  const triggerExamSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCompleted(true);
    submitResult(examDurationSeconds - timeLeft);
  };

  const submitResult = async (timeTakenSeconds: number, securityExceeded: boolean = false, autoSubmitted: boolean = false) => {
    setIsSaving(true);
    setSecurityViolated(securityExceeded);
    setWasAutoSubmitted(autoSubmitted);
    const { correct, total, percentage } = calculateScore();

    try {
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}

    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          subjectId: subject.id,
          subjectTitle: subject.title,
          score: percentage,
          correctAnswers: correct,
          totalQuestions: total,
          mode,
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        setSavedResult(saved);
        onSaveResult(saved);
      }
    } catch (err) {
      console.error("Error saving CBT result: ", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setFlaggedQuestions({});
    setIsCompleted(false);
    setSecurityViolated(false);
    setWasAutoSubmitted(false);
    setTabSwitches(0);
    setShowViolationWarning(false);
    setTimeLeft(examDurationSeconds);

    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const limit = mode === "exam" ? (course.numQuestions || 60) : questions.length;
    setShuffledQuestions(shuffled.slice(0, limit));

    if (mode === "exam") {
      setShowSecureRules(true);
    }
  };

  const reEnableFullscreen = () => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Render Premium Lock view
  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg text-center space-y-6 my-10" id="premium-exam-lock">
        <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 inline-flex p-4 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
          <Star className="h-10 w-10 fill-amber-400 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight animate-pulse">Premium CBT Portal Locked</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Simulated full CBT mode utilizes course-defined durations, automatic tab-switching monitoring, and performance reviews. This feature is unlocked for premium members.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm mx-auto text-left space-y-2.5">
          <div className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">Premium Study Toolkit:</div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Unlimited Full Timed Mock Exams</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>AI Advanced Guides & Instant Syllabus Syncur</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Live Security Monitoring & Detailed Diagnostics</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-755 font-extrabold rounded-xl text-xs uppercase transition cursor-pointer"
          >
            Back to Dashboard
          </button>
          <button
            onClick={onUpgradeTrigger}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs uppercase shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Star className="h-4 w-4 fill-white" />
            Unlock Premium (₦2,500)
          </button>
        </div>
      </div>
    );
  }

  // Render empty questions warning
  if (questions.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md mx-auto space-y-5" id="empty-questions">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
        <div>
          <h3 className="font-extrabold text-slate-850 dark:text-white text-lg">Exam Question Paper Empty</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">No exam questions have been compiled or generated for this course subject syllabus yet.</p>
        </div>
        <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 hover:dark:bg-slate-755 text-slate-700 px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  // Render Secure Entrance gate before exam starts
  if (mode === "exam" && showSecureRules) {
    const examDurationMinutes = course.timeLimit || 60;
    const passThreshold = course.passingScore || 50;
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-fadeIn text-center" id="exam-entrance-chamber">
        <div className="relative inline-flex">
          <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 p-5 rounded-full border border-blue-100 dark:border-blue-900/60">
            <ShieldCheck className="h-14 w-14 animate-pulse" />
          </div>
          <span className="absolute bottom-0 right-0 bg-rose-500 text-white rounded-full p-1.5 shadow-md animate-bounce">
            <Timer className="h-4.5 w-4.5" />
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 tracking-widest uppercase">
            Official Computer-Based Test Center
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {course.title} Exam Room
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto">
            You are about to launch the timed mock exam session for <strong className="text-slate-700 dark:text-slate-300">{subject.title}</strong>. Please review the security rules and configuration metrics below.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-150 dark:border-slate-800">
          <div className="space-y-1">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Question Count</div>
            <div className="text-lg sm:text-xl font-black text-slate-850 dark:text-slate-200">
              {shuffledQuestions.length} Qs
            </div>
          </div>
          <div className="space-y-1 border-x border-slate-200 dark:border-slate-800">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time Limit</div>
            <div className="text-lg sm:text-xl font-black text-slate-850 dark:text-slate-200">
              {examDurationMinutes} Mins
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Passing Mark</div>
            <div className="text-lg sm:text-xl font-black text-slate-850 dark:text-slate-200">
              {passThreshold}%
            </div>
          </div>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-5 rounded-2xl text-left space-y-3.5">
          <div className="text-xs font-black text-rose-850 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
            Strict Security Regulations:
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350 font-semibold">
              <span className="h-1.5 w-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
              <p>
                <strong>Full-Screen Mandate:</strong> This exam triggers full-screen mode. Leaving or disabling full-screen raises immediate integrity alerts.
              </p>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350 font-semibold">
              <span className="h-1.5 w-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
              <p>
                <strong>Tab Switching Block:</strong> Navigating away from this tab, opening other panels, or blurring window increases your <strong>Security Warnings</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350 font-semibold">
              <span className="h-1.5 w-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
              <p>
                <strong>Auto-Submit Lockout:</strong> Accumulating <strong>3 warnings</strong> or allowing the countdown timer to strike zero triggers instant exam auto-submission.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-755 font-extrabold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Leave Exam Room
          </button>
          <button
            onClick={() => {
              setShowSecureRules(false);
              try {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch((err) => {
                    console.warn("Fullscreen request rejected:", err);
                  });
                }
              } catch (e) {
                console.error("Fullscreen API not supported in this iframe", e);
              }
            }}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <PlayCircle className="h-4.5 w-4.5" />
            Authorize & Launch CBT Exam
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex] || shuffledQuestions[0];
  const userSelection = selectedAnswers[currentQuestion?.id];
  const isAnsweredInPractice = mode === "practice" && submittedAnswers[currentQuestion?.id];

  // Render Completed Exam Results screen
  if (isCompleted) {
    const { correct, total, percentage } = calculateScore();
    const passedExam = percentage >= (course.passingScore || 50);

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn" id="exam-results-screen">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-10 text-center space-y-6 transition-all duration-200">
          <div className="inline-flex bg-linear-to-b from-amber-100 to-amber-200/40 dark:from-amber-950/20 dark:to-slate-900 p-5 rounded-full border border-amber-200 dark:border-amber-900/60 text-amber-500 relative">
            {passedExam ? (
              <>
                <Trophy className="h-16 w-16 text-amber-500 fill-amber-300 animate-bounce" />
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-1 shadow-sm">
                  <Star className="h-4.5 w-4.5 fill-white text-white" />
                </span>
              </>
            ) : (
              <Award className="h-16 w-16 text-slate-450 dark:text-slate-500" />
            )}
          </div>
          <div>
            <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase">
              {mode === "exam" ? "🏆 Timed CBT Mock Exam Results" : "🎯 Practice Session Cleared"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-white mt-1.5 tracking-tight">
              {passedExam ? "Passed Successfully! 🎉" : "Keep Learning! 💪"}
            </h2>
            <div className="inline-block mt-3">
              {passedExam ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-extrabold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-emerald-200/40">
                  Passed CBT Exam (Target: {course.passingScore || 50}%) 🟢
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 font-extrabold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-rose-200/40">
                  Failed CBT Exam (Target: {course.passingScore || 50}%) 🔴
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 max-w-md mx-auto leading-relaxed">
              Performance card for <strong className="text-slate-700 dark:text-slate-300">{subject.title}</strong> of prep course {course.title}.
            </p>
          </div>

          {securityViolated && (
            <div className="max-w-md mx-auto p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl text-center space-y-1 text-rose-800 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5 mx-auto text-rose-600 shrink-0" />
              <div className="text-[10px] font-black uppercase tracking-widest">CBT Integrity Failure</div>
              <p className="text-xs font-semibold leading-relaxed">
                Exam paper was automatically locked and submitted because you exceeded 3 window blur security warnings.
              </p>
            </div>
          )}

          {wasAutoSubmitted && !securityViolated && (
            <div className="max-w-md mx-auto p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl text-center space-y-1 text-amber-850 dark:text-amber-400">
              <Timer className="h-5 w-5 mx-auto text-amber-600 shrink-0" />
              <div className="text-[10px] font-black uppercase tracking-widest">Time Limit Expired</div>
              <p className="text-xs font-semibold">
                Your examination paper was automatically submitted because your allowed {course.timeLimit || 60} minutes elapsed.
              </p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto py-2">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{percentage}%</div>
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Accuracy</div>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{correct}</div>
              <div className="text-[9px] font-black text-emerald-500 dark:text-emerald-500 uppercase tracking-widest mt-1">Correct</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-slate-600 dark:text-slate-400">{total}</div>
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Total Qs</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-sm sm:text-xs font-black text-slate-700 dark:text-slate-300 h-8 flex items-center justify-center truncate">
                {mode === "exam" ? formatTimeUsed(examDurationSeconds - timeLeft) : "Chapter Mode"}
              </div>
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Time Used</div>
            </div>
          </div>

          {/* Per-topic breakdown Analysis Panel */}
          <div className="max-w-lg mx-auto bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-3.5 text-left">
            <h4 className="font-black text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpenCheck className="h-4 w-4 text-blue-600" />
              Syllabus Topic Performance Analysis:
            </h4>
            <div className="space-y-3">
              {getTopicBreakdown().map((topic, tIdx) => {
                const topicPct = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
                const passedTopic = topicPct >= (course.passingScore || 50);

                return (
                  <div key={tIdx} className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-3xs">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1">{topic.title}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        passedTopic 
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                      }`}>
                        {topicPct}% {passedTopic ? "Pass" : "Revise"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-grow h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${passedTopic ? "bg-emerald-500" : "bg-rose-500"}`} 
                          style={{ width: `${topicPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 w-10 text-right">
                        {topic.correct} / {topic.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gamified Advice Block based on performance */}
          <div className="p-4.5 rounded-2xl border text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-semibold bg-linear-to-r from-blue-50/60 to-indigo-50/20 dark:from-slate-850 dark:to-slate-850/60 border-blue-100 dark:border-slate-800 text-blue-800 dark:text-blue-300">
            {percentage >= 90 ? (
              "🏆 Gold Medal Standard! Absolute mastery of these subject files. You are fully prepared to secure an A grade in the main exam!"
            ) : percentage >= 70 ? (
              "🌟 Straight A's Zone! Excellent retention. A bit of minor polishing on flagged topics will lock in an exceptional grade."
            ) : passedExam ? (
              "👍 Solid Pass Mark! You met the passing criteria, but re-reading the active study materials can safely boost your grade towards excellence."
            ) : (
              "📚 Study Room Recommendation: Tricky concepts found. Open the AI Study Guides summaries to refresh your vocabulary, and attempt the exam again!"
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Mock Exam</span>
            </button>
            <button
              onClick={onBack}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Dashboard Overview</span>
            </button>
          </div>
        </div>

        {/* Question-by-Question Review Breakdown */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Active Practice Review & Explanations
          </h3>

          <div className="space-y-4">
            {shuffledQuestions.map((q, idx) => {
              const selectedOpt = selectedAnswers[q.id];
              const isCorrect = selectedOpt === q.correctAnswerIndex;
              return (
                <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-2 text-sm text-slate-800 dark:text-slate-200 font-extrabold leading-normal">
                      <span className="text-slate-400 dark:text-slate-500 font-black">Q{idx + 1}.</span>
                      <p className="text-left">{q.text}</p>
                    </div>
                    {selectedOpt === undefined ? (
                      <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[9px] font-black px-2.5 py-1 rounded-md flex-none uppercase tracking-wider border border-amber-200/50">Unanswered</span>
                    ) : isCorrect ? (
                      <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-[9px] font-black px-2.5 py-1 rounded-md flex-none uppercase tracking-wider flex items-center gap-1 border border-emerald-200/50">
                        <Check className="h-3.5 w-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 text-[9px] font-black px-2.5 py-1 rounded-md flex-none uppercase tracking-wider flex items-center gap-1 border border-rose-200/50">
                        <X className="h-3.5 w-3.5" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-left">
                    {q.options.map((opt, oIdx) => {
                      const isOptionSelected = selectedOpt === oIdx;
                      const isCorrectOption = q.correctAnswerIndex === oIdx;

                      let optStyle = "bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800";
                      if (isOptionSelected) {
                        optStyle = isCorrect
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-850"
                          : "bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-850";
                      } else if (isCorrectOption) {
                        optStyle = "bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-300 border-emerald-200 dark:border-emerald-850";
                      }

                      return (
                        <div key={oIdx} className={`border p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${optStyle}`}>
                          <span className="flex items-center gap-2">
                            <span className="font-black text-slate-400 dark:text-slate-500">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                          </span>
                          {isCorrectOption && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-none ml-2" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50/25 dark:bg-blue-950/10 p-4 border border-blue-100/60 dark:border-blue-900/30 rounded-xl space-y-1.5 text-left">
                    <div className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                      TUTOR EXPLANATION / DECK FEEDBACK:
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const isFlagged = flaggedQuestions[currentQuestion?.id];
  const isTimeCritical = timeLeft < 300; // Under 5 minutes left

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn" id="quiz-player-active">
      {/* Alert if full-screen mode has been dropped in exam mode */}
      {mode === "exam" && !isFullscreen && (
        <div className="bg-amber-500 text-white rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-bold shadow-md animate-fadeIn">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 animate-bounce shrink-0" />
            <span>Full-Screen mode disabled! Re-enable to preserve security integrity.</span>
          </span>
          <button
            onClick={reEnableFullscreen}
            className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition cursor-pointer"
          >
            Go Fullscreen ⛶
          </button>
        </div>
      )}

      {/* Quiz/Exam Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-200/20">
            {mode === "exam" ? "⏱️ TIMED CBT EXAM SIMULATION" : "🎯 COMPREHENSIVE PRACTICE MODE"}
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1.5 leading-snug">{subject.title}</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">{course.title}</p>
        </div>

        {mode === "exam" && (
          <div className={`flex items-center gap-2 font-black px-4 py-2.5 rounded-xl text-sm flex-none transition-all duration-300 ${
            isTimeCritical 
              ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/25 border border-rose-450" 
              : "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400"
          }`}>
            <Timer className={`h-4.5 w-4.5 ${isTimeCritical ? "animate-spin" : ""}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* CBT Nav Grid for Exam Mode */}
      {mode === "exam" && shuffledQuestions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Syllabus Exam Grid Navigation</span>
            <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">
              {Object.keys(selectedAnswers).length} of {shuffledQuestions.length} Completed
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {shuffledQuestions.map((q, idx) => {
              const isSelected = selectedAnswers[q.id] !== undefined;
              const isActive = currentIndex === idx;
              const isQFlagged = flaggedQuestions[q.id];

              let cellStyle = "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-755 border border-slate-100 dark:border-slate-850";
              if (isActive) {
                cellStyle = "bg-blue-600 text-white font-black scale-105 shadow-md border-blue-600";
              } else if (isQFlagged) {
                cellStyle = "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-300/40 font-bold";
              } else if (isSelected) {
                cellStyle = "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-bold border-blue-200/50";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-9 text-xs font-bold rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center relative ${cellStyle}`}
                  id={`nav-grid-${idx}`}
                >
                  {idx + 1}
                  {isQFlagged && !isActive && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 rounded-full h-2 w-2 block" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Question Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <span>QUESTION {currentIndex + 1} OF {shuffledQuestions.length}</span>
            {mode === "practice" && (
              <span className="text-blue-600 dark:text-blue-400 font-black">
                Progress: {calculateScore().correct}/{currentIndex + (isAnsweredInPractice ? 1 : 0)} Correct
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / shuffledQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-start gap-4">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white leading-snug text-left">
            {currentQuestion?.text}
          </h3>

          <button
            onClick={() => {
              setFlaggedQuestions((prev) => ({
                ...prev,
                [currentQuestion.id]: !prev[currentQuestion.id],
              }));
            }}
            className={`p-2 rounded-xl border flex-none transition cursor-pointer ${
              isFlagged
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 text-amber-600 dark:text-amber-400"
                : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600"
            }`}
            title="Flag question to return later"
          >
            <Flag className={`h-4.5 w-4.5 ${isFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
          </button>
        </div>

        {/* Options Selection List */}
        <div className="grid grid-cols-1 gap-3.5 text-left">
          {currentQuestion?.options.map((option, oIdx) => {
            const isOptionSelected = userSelection === oIdx;
            const isCorrectOption = currentQuestion.correctAnswerIndex === oIdx;

            let optionStyle = "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-50/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200";
            let badgeStyle = "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";

            if (isOptionSelected) {
              if (mode === "practice") {
                if (isCorrectOption) {
                  optionStyle = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-300";
                  badgeStyle = "bg-emerald-600 text-white";
                } else {
                  optionStyle = "bg-rose-50 dark:bg-rose-950/30 border-rose-400 text-rose-900 dark:text-rose-300";
                  badgeStyle = "bg-rose-600 text-white";
                }
              } else {
                optionStyle = "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10";
                badgeStyle = "bg-white text-blue-600 font-black";
              }
            } else if (mode === "practice" && isAnsweredInPractice && isCorrectOption) {
              optionStyle = "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-300 text-emerald-850 dark:text-emerald-300";
              badgeStyle = "bg-emerald-500 text-white";
            }

            return (
              <motion.button
                whileTap={{ scale: mode === "practice" && isAnsweredInPractice ? 1 : 0.99 }}
                key={oIdx}
                disabled={mode === "practice" && isAnsweredInPractice}
                onClick={() => selectOption(oIdx)}
                className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between gap-4 cursor-pointer ${optionStyle}`}
                id={`option-${oIdx}`}
              >
                <span className="flex items-center gap-3">
                  <span className={`h-7 w-7 rounded-full text-xs font-black flex items-center justify-center flex-none shadow-2xs ${badgeStyle}`}>
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span>{option}</span>
                </span>

                {mode === "practice" && isAnsweredInPractice && isCorrectOption && (
                  <Check className="h-5 w-5 text-emerald-600 flex-none" />
                )}
                {mode === "practice" && isAnsweredInPractice && isOptionSelected && !isCorrectOption && (
                  <X className="h-5 w-5 text-rose-600 flex-none" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Practice Explanation Reveal */}
        {mode === "practice" && isAnsweredInPractice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 p-4 rounded-xl space-y-2 text-left"
          >
            <div className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              Tutor Explanation & Concept Tips
            </div>
            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
              {currentQuestion.explanation}
            </p>
          </motion.div>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-755 disabled:opacity-40 text-slate-600 dark:text-slate-300 font-extrabold text-xs rounded-xl border border-slate-200 dark:border-slate-800 transition cursor-pointer"
            id="btn-quiz-prev"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          {mode === "exam" && (
            <button
              onClick={triggerExamSubmit}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider cursor-pointer"
              id="btn-quiz-submit"
            >
              Submit CBT Exam ⏱️
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={currentIndex === shuffledQuestions.length - 1}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-755 disabled:opacity-40 text-slate-600 dark:text-slate-300 font-extrabold text-xs rounded-xl border border-slate-200 dark:border-slate-800 transition cursor-pointer"
            id="btn-quiz-next"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to exit your study session? Progress for this run will not be logged.")) {
              onBack();
            }
          }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
        >
          Abort Session and Go Back ↩
        </button>
      </div>

      {/* Security Violation popup */}
      <AnimatePresence>
        {showViolationWarning && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-slideDown" id="security-violation-alert">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-rose-600 text-white rounded-2xl p-4.5 shadow-2xl flex items-start gap-3 border border-rose-500"
            >
              <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 space-y-1 text-left">
                <h4 className="font-extrabold text-xs uppercase tracking-wider">Security Violation Notice</h4>
                <p className="text-[11px] font-medium leading-relaxed opacity-90 text-left">
                  Leaving the CBT active window is strictly prohibited. Warnings count: <strong className="text-amber-300 font-black">{tabSwitches} / 3</strong>.
                </p>
                <p className="text-[10px] font-bold opacity-75">
                  At 3 warnings, your paper will be automatically submitted!
                </p>
                <button
                  onClick={() => setShowViolationWarning(false)}
                  className="mt-1.5 px-3 py-1 bg-white text-rose-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition"
                >
                  Acknowledge & Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fadeIn" id="submit-confirm-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-4 rounded-full inline-block border border-rose-100 dark:border-rose-900/40">
                  <AlertCircle className="h-10 w-10 animate-bounce text-rose-550" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Submit CBT Examination?</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Are you absolutely ready to conclude your examination? Your final metrics, scores, and per-topic performance analyses will be generated instantly.
                </p>
              </div>

              {/* Response summary */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 border border-slate-150 dark:border-slate-800 rounded-2xl grid grid-cols-2 gap-3 text-center">
                <div className="space-y-0.5">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Answered</div>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {Object.keys(selectedAnswers).length} / {shuffledQuestions.length}
                  </div>
                </div>
                <div className="space-y-0.5 border-l border-slate-250 dark:border-slate-800">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unanswered</div>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                    {shuffledQuestions.length - Object.keys(selectedAnswers).length}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 text-center">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-755 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Keep Reviewing
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md shadow-rose-600/15"
                >
                  Yes, Submit Exam
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

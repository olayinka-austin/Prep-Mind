import { useState, useEffect, useRef } from "react";
import { Question, Course, Subject, ExamResult, User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Timer, AlertTriangle, ChevronLeft, ChevronRight, Check, X, ShieldAlert, Star, Trophy, Award, BookOpen, Flag, Lightbulb, Bookmark } from "lucide-react";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<{ [qId: string]: boolean }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [qId: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedResult, setSavedResult] = useState<ExamResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  // Lock Exam Mode if user is not Premium
  const isLocked = mode === "exam" && !user.isPremium;

  useEffect(() => {
    if (isLocked || questions.length === 0 || isCompleted) return;

    // Start timer for Exam Mode
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
  }, [mode, questions, isCompleted, isLocked]);

  useEffect(() => {
    if (mode === "exam" && !isCompleted && !isLocked) {
      onTimeUpdate?.(timeLeft);
    } else {
      onTimeUpdate?.(null);
    }
    return () => {
      onTimeUpdate?.(null);
    };
  }, [timeLeft, mode, isCompleted, isLocked, onTimeUpdate]);

  const handleExamAutoSubmit = () => {
    setIsCompleted(true);
    submitResult(600 - timeLeft);
  };

  const selectOption = (optionIndex: number) => {
    if (isCompleted) return;

    const currentQuestion = questions[currentIndex];
    
    if (mode === "practice") {
      // Practice mode allows submitting answer once per question
      if (submittedAnswers[currentQuestion.id]) return;
      setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
      setSubmittedAnswers((prev) => ({ ...prev, [currentQuestion.id]: true }));
    } else {
      // Exam mode stores selection, lets them change it anytime before final submission
      setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
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

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  };

  const handleSubmitExam = () => {
    if (window.confirm("Are you sure you want to submit your CBT exam? This will calculate your final score immediately.")) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsCompleted(true);
      submitResult(600 - timeLeft);
    }
  };

  const submitResult = async (timeTakenSeconds: number) => {
    setIsSaving(true);
    const { correct, total, percentage } = calculateScore();

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

  // Render premium locked screen
  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 border border-slate-200 rounded-xl shadow-md text-center space-y-6 my-10" id="premium-exam-lock">
        <div className="bg-amber-50 text-amber-600 inline-flex p-4 rounded-full border border-amber-200 animate-pulse">
          <Star className="h-10 w-10 fill-amber-400 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Full CBT Exam Mode</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Full simulated CBT exam mode features real timed exam pacing, question grids, and advanced score reports. It is reserved for premium subscribers.
          </p>
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 max-w-sm mx-auto text-left space-y-2.5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Premium Core Unlocks:</div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Check className="h-4 w-4 text-emerald-500 flex-none" />
            <span>Unlimited Full Timed Mock Exams</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Check className="h-4 w-4 text-emerald-500 flex-none" />
            <span>AI-Generated Advanced Study Guides</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Check className="h-4 w-4 text-emerald-500 flex-none" />
            <span>Detailed Result & Performance Tracking</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition cursor-pointer"
          >
            Back to Dashboard
          </button>
          <button
            onClick={onUpgradeTrigger}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Star className="h-4 w-4 fill-white" />
            Unlock Premium (₦2,500)
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto space-y-4" id="empty-questions">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
        <div>
          <h3 className="font-bold text-slate-800 text-lg">No Questions Found</h3>
          <p className="text-xs text-slate-500 mt-1">There are no questions uploaded or generated for this subject yet.</p>
        </div>
        <button onClick={onBack} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold text-xs transition cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const userSelection = selectedAnswers[currentQuestion.id];
  const isAnsweredInPractice = mode === "practice" && submittedAnswers[currentQuestion.id];

  // Render exam results screen
  if (isCompleted) {
    const { correct, total, percentage } = calculateScore();
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn" id="exam-results-screen">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-10 text-center space-y-6 transition-all duration-200">
          <div className="inline-flex bg-linear-to-b from-amber-100 to-amber-200/40 dark:from-amber-950/20 dark:to-slate-900 p-5 rounded-full border border-amber-200 dark:border-amber-900/60 text-amber-500 relative">
            {percentage >= 50 ? (
              <>
                <Trophy className="h-16 w-16 text-amber-500 fill-amber-300 animate-bounce" />
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-1 shadow-sm">
                  <Star className="h-4.5 w-4.5 fill-white text-white" />
                </span>
              </>
            ) : (
              <Award className="h-16 w-16 text-slate-400 dark:text-slate-500" />
            )}
          </div>
          <div>
            <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase">
              {mode === "exam" ? "🏆 CBT Mock Exam Finished" : "🎯 Practice Chapter Deck Cleared"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-white mt-1.5 tracking-tight">
              {percentage >= 50 ? "Excellent Job! 🎉" : "Keep Learning! 💪"}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
              You just finished reviewing <strong className="text-slate-700 dark:text-slate-300">{subject.title}</strong> of the course syllabus. Here are your final metrics:
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto py-2">
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
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Questions</div>
            </div>
          </div>

          {/* Gamified Advice Block based on performance */}
          <div className="p-4.5 rounded-2xl border text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-semibold bg-linear-to-r from-blue-50/60 to-indigo-50/20 dark:from-slate-850 dark:to-slate-850/60 border-blue-100 dark:border-slate-800 text-blue-800 dark:text-blue-300">
            {percentage >= 90 ? (
              "🏆 Absolute Gold Medal Standard! Your conceptual retention is top-tier. You are 100% prepared to hit an A grade in the actual examinations!"
            ) : percentage >= 70 ? (
              "🌟 Superb Grade Standard! Excellent retention. With a score of over 70%, you are comfortably in the straight A's zone. Keep practicing!"
            ) : percentage >= 50 ? (
              "👍 Solid Base! You passed, but a quick revisit of the active study slides and another quiz session will securely push you to 90% accuracy!"
            ) : (
              "📚 A Great Stepping Stone! GST courses test tricky words. Open the Study Guides to check the flash summaries first, then smash this quiz again!"
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => {
                // reset quiz state to retry
                setCurrentIndex(0);
                setSelectedAnswers({});
                setSubmittedAnswers({});
                setFlaggedQuestions({});
                setIsCompleted(false);
                setTimeLeft(600);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer"
            >
              Retry Session 🔄
            </button>
            <button
              onClick={onBack}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Return to Dashboard
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
            {questions.map((q, idx) => {
              const selectedOpt = selectedAnswers[q.id];
              const isCorrect = selectedOpt === q.correctAnswerIndex;
              return (
                <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-2 text-sm text-slate-800 dark:text-slate-200 font-extrabold leading-normal">
                      <span className="text-slate-400 dark:text-slate-500 font-black">Q{idx + 1}.</span>
                      <p>{q.text}</p>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isOptionSelected = selectedOpt === oIdx;
                      const isCorrectOption = q.correctAnswerIndex === oIdx;

                      let optStyle = "bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800";
                      if (isOptionSelected) {
                        optStyle = isCorrect
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-850"
                          : "bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-850";
                      } else if (isCorrectOption) {
                        optStyle = "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-850";
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

                  {/* Explanation card */}
                  <div className="bg-blue-50/25 dark:bg-blue-950/10 p-4 border border-blue-100/60 dark:border-blue-900/30 rounded-xl space-y-1.5">
                    <div className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                      CBT Concept Feedback:
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

  const isFlagged = flaggedQuestions[currentQuestion.id];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn" id="quiz-player-active">
      {/* Quiz/Exam Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-200/20">
            {mode === "exam" ? "⏱️ TIMED CBT EXAM RUN" : "🎯 PRACTICE LEARNING MODE"}
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1.5 leading-snug">{subject.title}</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">{course.title}</p>
        </div>

        {mode === "exam" && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-extrabold px-4 py-2.5 rounded-xl text-sm flex-none">
            <Timer className="h-4.5 w-4.5 animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* CBT Nav Grid for Exam Mode */}
      {mode === "exam" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Syllabus Grid Navigation</div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const isSelected = selectedAnswers[q.id] !== undefined;
              const isActive = currentIndex === idx;
              const isQFlagged = flaggedQuestions[q.id];

              let cellStyle = "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-755";
              if (isActive) {
                cellStyle = "bg-blue-600 text-white font-black scale-105 shadow-xs";
              } else if (isQFlagged) {
                cellStyle = "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-300/40 font-bold";
              } else if (isSelected) {
                cellStyle = "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-bold";
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
        {/* Top visual progress bar indicator */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
            {mode === "practice" && (
              <span className="text-blue-600 dark:text-blue-400 font-black">
                Progress: {calculateScore().correct}/{currentIndex + (isAnsweredInPractice ? 1 : 0)} Correct
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Flag button container */}
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white leading-snug">
            {currentQuestion.text}
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
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600"
            }`}
            title="Flag/Bookmark question to return later"
          >
            <Flag className={`h-4.5 w-4.5 ${isFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
          </button>
        </div>

        {/* Options Selection list with animated circular index keys */}
        <div className="grid grid-cols-1 gap-3.5">
          {currentQuestion.options.map((option, oIdx) => {
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
                optionStyle = "bg-blue-600 border-blue-600 text-white";
                badgeStyle = "bg-white text-blue-600";
              }
            } else if (mode === "practice" && isAnsweredInPractice && isCorrectOption) {
              optionStyle = "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-300 text-emerald-850 dark:text-emerald-300";
              badgeStyle = "bg-emerald-500 text-white";
            }

            return (
              <motion.button
                whileTap={{ scale: mode === "practice" && isAnsweredInPractice ? 1 : 0.985 }}
                key={oIdx}
                disabled={mode === "practice" && isAnsweredInPractice}
                onClick={() => selectOption(oIdx)}
                className={`w-full text-left p-4.5 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between gap-4 cursor-pointer ${optionStyle}`}
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
            className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 p-4 rounded-xl space-y-2"
          >
            <div className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              Tutor Explanation & Concept Tips
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
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
              onClick={handleSubmitExam}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg hover:scale-101 transition-all uppercase tracking-wider cursor-pointer"
              id="btn-quiz-submit"
            >
              Submit CBT Exam ⏱️
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
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
          Abort Session and Go Back ↩️
        </button>
      </div>
    </div>
  );
}


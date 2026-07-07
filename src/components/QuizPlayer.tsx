import { useState, useEffect, useRef } from "react";
import { Question, Course, Subject, ExamResult, User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Timer, AlertTriangle, ChevronLeft, ChevronRight, Check, X, ShieldAlert, Star, Trophy, Award, BookOpen } from "lucide-react";

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
      <div className="max-w-4xl mx-auto space-y-8" id="exam-results-screen">
        <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden p-6 sm:p-8 text-center space-y-6">
          <div className="inline-flex bg-blue-50 p-4 rounded-full border border-blue-100 text-blue-600">
            {percentage >= 50 ? <Trophy className="h-12 w-12" /> : <Award className="h-12 w-12 text-slate-500" />}
          </div>
          <div>
            <div className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">{mode === "exam" ? "CBT Mock Exam Completed" : "Practice Session Completed"}</div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{subject.title} Summary</h2>
            <p className="text-xs text-slate-400 mt-1">{course.title}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto py-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xl sm:text-2xl font-black text-slate-800">{percentage}%</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Final Score</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xl sm:text-2xl font-black text-blue-600">{correct}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Correct</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xl sm:text-2xl font-black text-slate-500">{total}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Questions</div>
            </div>
          </div>

          {/* Performance Review Status */}
          <div className="p-4 rounded-xl border text-sm max-w-lg mx-auto leading-relaxed font-medium bg-blue-50/50 border-blue-100 text-blue-800">
            {percentage >= 75
              ? "Excellent performance! You have high conceptual mastery and are fully prepared for the actual national exams."
              : percentage >= 50
              ? "Good job! You passed the baseline, but reviewing the key concepts and taking another test will solidify your A."
              : "Needs improvement. Use the study mode to read materials and generate custom study guides, then retry."}
          </div>

          <div className="flex justify-center">
            <button onClick={onBack} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm cursor-pointer">
              Return to Dashboard
            </button>
          </div>
        </div>

        {/* Question-by-Question Review Breakdown */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-slate-500" />
            Detailed Review Breakdown
          </h3>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const selectedOpt = selectedAnswers[q.id];
              const isCorrect = selectedOpt === q.correctAnswerIndex;
              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-2 text-sm text-slate-800 font-bold leading-normal">
                      <span className="text-slate-400">Q{idx + 1}.</span>
                      <p>{q.text}</p>
                    </div>
                    {selectedOpt === undefined ? (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md flex-none uppercase">Unanswered</span>
                    ) : isCorrect ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-md flex-none uppercase flex items-center gap-1">
                        <Check className="h-3 w-3" /> Correct
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-1 rounded-md flex-none uppercase flex items-center gap-1">
                        <X className="h-3 w-3" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isOptionSelected = selectedOpt === oIdx;
                      const isCorrectOption = q.correctAnswerIndex === oIdx;

                      let optStyle = "bg-slate-50 text-slate-700 border-slate-200";
                      if (isOptionSelected) {
                        optStyle = isCorrect ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200";
                      } else if (isCorrectOption) {
                        optStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
                      }

                      return (
                        <div key={oIdx} className={`border p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${optStyle}`}>
                          <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                          {isCorrectOption && <Check className="h-4 w-4 text-emerald-600 flex-none ml-2" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  <div className="bg-blue-50/40 p-4 border border-blue-100 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">CBT Concept Feedback:</div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="quiz-player-active">
      {/* Quiz/Exam Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {mode === "exam" ? "TIMED CBT EXAM MODE" : "STUDY PRACTICE MODE"}
          </span>
          <h2 className="text-lg font-black text-slate-800 mt-1.5">{subject.title}</h2>
          <p className="text-xs text-slate-400">{course.title}</p>
        </div>

        {mode === "exam" && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 font-bold px-4 py-2 rounded-xl text-sm flex-none">
            <Timer className="h-4.5 w-4.5 animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* CBT Nav Grid for Exam Mode */}
      {mode === "exam" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">Question Navigation Grid</div>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, idx) => {
              const isSelected = selectedAnswers[q.id] !== undefined;
              const isActive = currentIndex === idx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-9 text-xs font-bold rounded-lg cursor-pointer transition flex items-center justify-center ${
                    isActive
                       ? "bg-slate-800 text-white"
                       : isSelected
                       ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                       : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                  id={`nav-grid-${idx}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Question Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
          <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
          {mode === "practice" && (
            <span className="text-blue-600">
              Score: {calculateScore().correct}/{currentIndex + (isAnsweredInPractice ? 1 : 0)}
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
          {currentQuestion.text}
        </h3>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3.5">
          {currentQuestion.options.map((option, oIdx) => {
            const isOptionSelected = userSelection === oIdx;
            const isCorrectOption = currentQuestion.correctAnswerIndex === oIdx;

            let optionStyle = "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white text-slate-700";
            if (isOptionSelected) {
              if (mode === "practice") {
                optionStyle = isCorrectOption
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-rose-50 border-rose-300 text-rose-800";
              } else {
                optionStyle = "bg-slate-800 border-slate-800 text-white";
              }
            } else if (mode === "practice" && isAnsweredInPractice && isCorrectOption) {
              optionStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 animate-pulse";
            }

            return (
              <button
                key={oIdx}
                disabled={mode === "practice" && isAnsweredInPractice}
                onClick={() => selectOption(oIdx)}
                className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition cursor-pointer flex items-center justify-between ${optionStyle}`}
                id={`option-${oIdx}`}
              >
                <span>
                  <span className="mr-3 font-extrabold text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                  {option}
                </span>

                {mode === "practice" && isAnsweredInPractice && isCorrectOption && (
                  <Check className="h-5 w-5 text-emerald-600 flex-none" />
                )}
                {mode === "practice" && isAnsweredInPractice && isOptionSelected && !isCorrectOption && (
                  <X className="h-5 w-5 text-rose-600 flex-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* Practice Explanation Reveal */}
        {mode === "practice" && isAnsweredInPractice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl space-y-2"
          >
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              Explanation & Study Concepts
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {currentQuestion.explanation}
            </p>
          </motion.div>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex justify-between items-center border-t border-slate-100 pt-6">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
            id="btn-quiz-prev"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          {mode === "exam" && (
            <button
              onClick={handleSubmitExam}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              id="btn-quiz-submit"
            >
              Submit CBT Exam
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="flex items-center gap-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
            id="btn-quiz-next"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="text-center">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer">
          Abort Session and Go Back
        </button>
      </div>
    </div>
  );
}

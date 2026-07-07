import { useState, useEffect } from "react";
import { StudyGuide, Material } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Key, BrainCircuit, RefreshCw, ChevronLeft, ArrowRight, Loader2, Bookmark } from "lucide-react";

interface StudyGuideViewerProps {
  material: Material;
  token: string;
  onBack: () => void;
}

export default function StudyGuideViewer({ material, token, onBack }: StudyGuideViewerProps) {
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "vocab" | "flashcards">("summary");

  useEffect(() => {
    fetchStudyGuide();
  }, [material.id]);

  const fetchStudyGuide = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/materials/${material.id}/study-guide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load study guide.");
      }

      const data = await response.json();
      setGuide(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFlashcard = (idx: number) => {
    if (flippedIndex === idx) {
      setFlippedIndex(null);
    } else {
      setFlippedIndex(idx);
    }
  };

  return (
    <div className="space-y-6" id="study-guide-container">
      {/* Back Button and Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
            id="btn-guide-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{material.title}</h2>
            <p className="text-xs text-slate-500">Study Guide powered by Gemini AI</p>
          </div>
        </div>
        <button
          onClick={fetchStudyGuide}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-50 cursor-pointer"
          id="btn-guide-refresh"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Regenerate Guide
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Synthesizing Course Materials...</h3>
            <p className="text-xs text-slate-400 max-w-xs">Gemini is extracting vocabulary, creating practice flashcards, and summarizing key exam concepts.</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center text-red-600 max-w-md mx-auto space-y-3">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchStudyGuide}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        guide && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-1 bg-white p-4 border border-slate-200 rounded-xl shadow-xs space-y-1 h-fit">
              <button
                onClick={() => setActiveTab("summary")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left cursor-pointer ${
                  activeTab === "summary"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                id="btn-tab-summary"
              >
                <BookOpen className="h-4 w-4" />
                Key Concept Summary
              </button>
              <button
                onClick={() => setActiveTab("vocab")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left cursor-pointer ${
                  activeTab === "vocab"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                id="btn-tab-vocab"
              >
                <Key className="h-4 w-4" />
                Exam Vocabulary
              </button>
              <button
                onClick={() => setActiveTab("flashcards")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left cursor-pointer ${
                  activeTab === "flashcards"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                id="btn-tab-flashcards"
              >
                <BrainCircuit className="h-4 w-4" />
                Recall Flashcards
              </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {activeTab === "summary" && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Summary card */}
                    <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs space-y-4">
                      <div className="flex items-center gap-2 text-blue-600">
                        <BookOpen className="h-5 w-5" />
                        <h3 className="font-bold text-lg text-slate-800">Concept Overview</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{guide.summary}</p>
                    </div>

                    {/* Key points */}
                    <div className="bg-slate-50 p-6 border border-slate-200 rounded-xl space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Core Pillars & High-Yield Facts</h4>
                      <ul className="space-y-3.5">
                        {guide.keyPoints.map((point, index) => (
                          <li key={index} className="flex gap-3 text-sm text-slate-600">
                            <span className="flex-none flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xs h-5 w-5 rounded-full">
                              {index + 1}
                            </span>
                            <span className="leading-normal">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === "vocab" && (
                  <motion.div
                    key="vocab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {guide.vocabulary.map((v, index) => (
                      <div key={index} className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition duration-200 flex gap-4">
                        <div className="flex-none bg-blue-50 text-blue-600 h-9 w-9 rounded-xl flex items-center justify-center">
                          <Bookmark className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-800 text-base">{v.term}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{v.definition}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === "flashcards" && (
                  <motion.div
                    key="flashcards"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="text-center max-w-sm mx-auto mb-4">
                      <p className="text-xs text-slate-400">Flip the flashcards to test your knowledge. Active recall is proven to boost CBT exam scores.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {guide.practiceFlashcards.map((card, index) => {
                        const isFlipped = flippedIndex === index;
                        return (
                          <div
                            key={index}
                            onClick={() => toggleFlashcard(index)}
                            className="h-48 cursor-pointer relative perspective"
                            id={`flashcard-${index}`}
                          >
                            <div
                              className={`w-full h-full duration-500 preserve-3d relative ${
                                isFlipped ? "rotate-y-180" : ""
                              }`}
                            >
                              {/* Front */}
                              <div className="absolute inset-0 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between backface-hidden">
                                <div className="text-xs font-semibold text-blue-600 tracking-wider uppercase">FLASHCARD {index + 1}</div>
                                <div className="text-sm font-bold text-slate-800 text-center flex-grow flex items-center justify-center px-4">
                                  {card.question}
                                </div>
                                <div className="text-[10px] text-slate-400 text-center uppercase tracking-wide flex items-center justify-center gap-1">
                                  <span>Tap to Flip</span>
                                  <ArrowRight className="h-3 w-3" />
                                </div>
                              </div>

                              {/* Back */}
                              <div className="absolute inset-0 bg-blue-600 text-white rounded-xl p-6 shadow-xs flex flex-col justify-between backface-hidden rotate-y-180">
                                <div className="text-xs font-semibold text-blue-100 tracking-wider uppercase">CORRECT ANSWER</div>
                                <div className="text-sm font-semibold text-center flex-grow flex items-center justify-center px-4 leading-relaxed">
                                  {card.answer}
                                </div>
                                <div className="text-[10px] text-blue-200 text-center uppercase tracking-wide">
                                  Tap to return
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )
      )}
    </div>
  );
}

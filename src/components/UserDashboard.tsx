import React, { useState, useEffect } from "react";
import { Course, Subject, Material, ExamResult, User } from "../types";
import { BookOpen, BookText, Trophy, Clock, Star, BrainCircuit, PlayCircle, Eye, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface UserDashboardProps {
  user: User;
  courses: Course[];
  subjects: Subject[];
  token: string;
  onStartQuiz: (course: Course, subject: Subject, mode: "practice" | "exam") => void;
  onStartStudy: (material: Material) => void;
  onShowUpgrade: () => void;
}

export default function UserDashboard({
  user,
  courses,
  subjects,
  token,
  onStartQuiz,
  onStartStudy,
  onShowUpgrade,
}: UserDashboardProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<"100 LEVEL" | "200 LEVEL" | "ALL">("ALL");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();
    fetchUserResults();
  }, [token]);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/materials", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials);
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

  return (
    <div className="space-y-8 animate-fadeIn" id="user-dashboard-root">
      {/* Welcome Banner */}
      <div className="bg-blue-600 text-white rounded-xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-lg text-xs font-semibold text-blue-100">
            <Sparkles className="h-3 w-3 fill-blue-200 text-blue-200" />
            University GST CBT Exam Prep Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, <span className="text-amber-300 font-extrabold">{user.name}</span>!
          </h2>
          <p className="text-sm text-blue-50 max-w-lg leading-relaxed font-normal">
            Select a compulsory university GST course, explore AI-generated study summaries and flashcards, and simulate full-length timed CBT exams to guarantee excellent academic grades.
          </p>
        </div>
        {!user.isPremium && (
          <button
            onClick={onShowUpgrade}
            className="flex-none flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
            id="btn-banner-upgrade"
          >
            <Star className="h-4.5 w-4.5 fill-white" />
            Upgrade to Premium Plan
          </button>
        )}
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-lg">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{totalTests}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Practice Sessions</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-lg">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{avgScore}%</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Average Score</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{highestScore}%</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Highest Recorded Score</div>
          </div>
        </div>
      </div>

      {/* Course Catalog & Subjects Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <BookOpen className="h-5.5 w-5.5 text-blue-600" />
              Syllabus Course Catalogs
            </h3>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
              {["ALL", "100 LEVEL", "200 LEVEL"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    activeTab === cat
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Courses List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredCourses.length === 0 ? (
              <div className="col-span-2 text-center py-10 bg-white border border-slate-200 rounded-xl text-slate-400 font-medium">
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
                    className={`p-6 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3.5 ${
                      isSelected
                        ? "bg-blue-50/40 border-blue-500 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                    id={`course-card-${course.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                          {course.category || "CBT"}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{subCount} subjects</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{course.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{course.description}</p>
                    </div>

                    <div className="text-right pt-2">
                      <span className="text-xs font-bold text-blue-600 hover:text-blue-700">Select Syllabus →</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Subject Options for Selected Course */}
          {selectedCourse && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4 animate-fadeIn">
              <div>
                <h4 className="font-bold text-slate-800 text-base">{selectedCourse.title} Subjects</h4>
                <p className="text-xs text-slate-500">Select a subject syllabus to start active study and CBT training.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects
                  .filter((s) => s.courseId === selectedCourse.id)
                  .map((subject) => {
                    const mathCount = materials.filter((m) => m.subjectId === subject.id).length;

                    return (
                      <div
                        key={subject.id}
                        className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs hover:shadow-sm transition space-y-4 flex flex-col justify-between"
                        id={`subject-card-${subject.id}`}
                      >
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-800 text-sm">{subject.title}</h5>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{subject.description}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 justify-between items-center">
                          {mathCount > 0 ? (
                            <div className="flex gap-1.5 w-full">
                              <button
                                onClick={() => {
                                  // Find first material matching this subject and trigger study
                                  const material = materials.find((m) => m.subjectId === subject.id);
                                  if (material) onStartStudy(material);
                                }}
                                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold py-2 text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                                id={`btn-study-${subject.id}`}
                              >
                                <BrainCircuit className="h-3.5 w-3.5 text-blue-600" />
                                Study Guides
                              </button>
                              <button
                                onClick={() => onStartQuiz(selectedCourse, subject, "practice")}
                                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                                id={`btn-practice-${subject.id}`}
                              >
                                <BookText className="h-3.5 w-3.5 text-blue-600" />
                                Practice Quiz
                              </button>
                              <button
                                onClick={() => onStartQuiz(selectedCourse, subject, "exam")}
                                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                                id={`btn-exam-${subject.id}`}
                              >
                                <Clock className="h-3.5 w-3.5 text-rose-500" />
                                Timed CBT
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 flex items-center gap-1 italic py-1">
                              <AlertCircle className="h-3.5 w-3.5 flex-none text-slate-400" />
                              Admins are uploading materials and questions
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {subjects.filter((s) => s.courseId === selectedCourse.id).length === 0 && (
                  <p className="text-xs text-slate-400 col-span-2 text-center py-4">No active subjects created for this course yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar for Recent CBT history */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3.5 flex items-center gap-1.5">
              <Trophy className="h-4.5 w-4.5 text-blue-600" />
              My Study Activity Logs
            </h3>

            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {results.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">No tests taken yet. Start with a Practice Quiz above!</p>
                </div>
              ) : (
                results.slice(0, 5).map((res) => (
                  <div key={res.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs hover:bg-slate-100/50 transition">
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <div className="font-bold text-slate-800">{res.subjectTitle}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{res.mode} Mode</div>
                      </div>
                      <div className={`font-bold text-sm ${res.score >= 50 ? "text-green-600" : "text-rose-500"}`}>{res.score}%</div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100/60">
                      <span>{res.correctAnswers} / {res.totalQuestions} correct</span>
                      <span>{new Date(res.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

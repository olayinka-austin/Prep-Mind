import React, { useState, useEffect } from "react";
import { Course, Subject, Material, User, ExamResult } from "../types";
import { motion } from "motion/react";
import { PlusCircle, FileText, Settings, Users, Clipboard, Plus, Sparkles, Loader2, RefreshCw, Calendar, CheckCircle, UploadCloud, AlertCircle, Edit2, Trash2, X } from "lucide-react";

interface AdminPanelProps {
  token: string;
  courses: Course[];
  subjects: Subject[];
  onRefreshData: () => void;
}

export default function AdminPanel({ token, courses, subjects, onRefreshData }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"courses" | "materials" | "ai-questions" | "results" | "users">("courses");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Course Form
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseCat, setCourseCat] = useState("100 LEVEL");
  const [courseNumQuestions, setCourseNumQuestions] = useState("60");
  const [courseTimeLimit, setCourseTimeLimit] = useState("60");
  const [coursePassingScore, setCoursePassingScore] = useState("50");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Subject Form
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [subjectTitle, setSubjectTitle] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Material Form
  const [matCourseId, setMatCourseId] = useState("");
  const [matSubjectId, setMatSubjectId] = useState("");
  const [matTitle, setMatTitle] = useState("");
  const [matContent, setMatContent] = useState("");

  // AI Document Upload States
  const [fileLoading, setFileLoading] = useState(false);
  const [fileProgressPercent, setFileProgressPercent] = useState(0);
  const [fileProgressStep, setFileProgressStep] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    const allowedMimeTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "image/png",
      "image/jpeg",
      "image/jpg"
    ];

    const isTextFile = file.name.endsWith(".md") || file.name.endsWith(".txt");

    if (!allowedMimeTypes.includes(file.type) && !isTextFile) {
      setUploadError("Unsupported file format. Please upload PDF, TXT, MD, or JPG/PNG image files.");
      return;
    }

    setUploadError(null);
    setFileLoading(true);
    setFileProgressPercent(5);
    setFileProgressStep("Reading document bytes & local file buffer...");

    const getProgressStepText = (pct: number): string => {
      if (pct <= 20) return "Reading document bytes & local file buffer...";
      if (pct <= 45) return "Uploading document stream to Gemini 3.5 Flash...";
      if (pct <= 70) return "AI parsing pages & extracting text nodes...";
      if (pct <= 90) return "Structuring textbook theories & chapters...";
      return "Finalizing layout & validating educational context...";
    };

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Start simulation interval for smooth progress UI
        let currentPct = 12;
        setFileProgressPercent(currentPct);
        setFileProgressStep(getProgressStepText(currentPct));

        const progressInterval = setInterval(() => {
          currentPct = Math.min(99, currentPct + Math.floor(Math.random() * 5) + 2);
          setFileProgressPercent(currentPct);
          setFileProgressStep(getProgressStepText(currentPct));
        }, 350);

        try {
          const res = await fetch("/api/admin/extract-syllabus", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fileData: base64String,
              mimeType: file.type || (file.name.endsWith(".md") ? "text/markdown" : "text/plain"),
              fileName: file.name
            })
          });

          const data = await res.json();
          clearInterval(progressInterval);

          if (res.ok && data.title && data.content) {
            setFileProgressPercent(100);
            setFileProgressStep("Extraction Complete! Populating forms...");
            await new Promise((resolve) => setTimeout(resolve, 600));

            setMatTitle(data.title);
            setMatContent(data.content);
            showMsg("Successfully extracted syllabus contents using Gemini AI!");
          } else {
            setUploadError(data.error || "Failed to extract syllabus content from the document.");
            setFileProgressPercent(0);
            setFileProgressStep("");
          }
        } catch (err: any) {
          clearInterval(progressInterval);
          setUploadError(err.message || "An error occurred during file extraction.");
          setFileProgressPercent(0);
          setFileProgressStep("");
        } finally {
          setFileLoading(false);
        }
      };
      reader.onerror = () => {
        setUploadError("Failed to read file.");
        setFileLoading(false);
        setFileProgressPercent(0);
        setFileProgressStep("");
      };
    } catch (err: any) {
      setUploadError(err.message);
      setFileLoading(false);
      setFileProgressPercent(0);
      setFileProgressStep("");
    }
  };

  // AI Question Generator Form
  const [aiMatId, setAiMatId] = useState("");
  const [aiCount, setAiCount] = useState(5);

  // Lists from APIs
  const [materials, setMaterials] = useState<Material[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allResults, setAllResults] = useState<ExamResult[]>([]);

  useEffect(() => {
    fetchMaterials();
    fetchUsers();
    fetchResults();
  }, [activeTab]);

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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch("/api/results/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllResults(data.results);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showMsg = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseDesc) return;
    setLoading(true);

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title: courseTitle, 
          description: courseDesc, 
          category: courseCat,
          numQuestions: parseInt(courseNumQuestions, 10),
          timeLimit: parseInt(courseTimeLimit, 10),
          passingScore: parseInt(coursePassingScore, 10)
        }),
      });

      if (response.ok) {
        showMsg("Course created successfully!");
        setCourseTitle("");
        setCourseDesc("");
        setCourseNumQuestions("60");
        setCourseTimeLimit("60");
        setCoursePassingScore("50");
        onRefreshData();
      } else {
        showMsg("Failed to create course.", "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !subjectTitle || !subjectDesc) return;
    setLoading(true);

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: selectedCourseId, title: subjectTitle, description: subjectDesc }),
      });

      if (response.ok) {
        showMsg("Subject created successfully!");
        setSubjectTitle("");
        setSubjectDesc("");
        onRefreshData();
      } else {
        showMsg("Failed to create subject.", "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !courseTitle || !courseDesc) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title: courseTitle, 
          description: courseDesc, 
          category: courseCat,
          numQuestions: parseInt(courseNumQuestions, 10),
          timeLimit: parseInt(courseTimeLimit, 10),
          passingScore: parseInt(coursePassingScore, 10)
        }),
      });

      if (response.ok) {
        showMsg("Course updated successfully!");
        setCourseTitle("");
        setCourseDesc("");
        setCourseNumQuestions("60");
        setCourseTimeLimit("60");
        setCoursePassingScore("50");
        setEditingCourse(null);
        onRefreshData();
      } else {
        showMsg("Failed to update course.", "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course? This will also delete all related subjects/syllabuses, textbooks, and questions! This action is irreversible.")) {
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showMsg("Course and all related data deleted successfully!");
        if (editingCourse?.id === id) {
          setEditingCourse(null);
          setCourseTitle("");
          setCourseDesc("");
        }
        onRefreshData();
      } else {
        showMsg("Failed to delete course.", "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !selectedCourseId || !subjectTitle || !subjectDesc) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/subjects/${editingSubject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: selectedCourseId, title: subjectTitle, description: subjectDesc }),
      });

      if (response.ok) {
        showMsg("Subject syllabus updated successfully!");
        setSubjectTitle("");
        setSubjectDesc("");
        setSelectedCourseId("");
        setEditingSubject(null);
        onRefreshData();
      } else {
        showMsg("Failed to update subject.", "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject/syllabus? This will also delete all associated materials and questions! This action is irreversible.")) {
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showMsg("Subject syllabus deleted successfully!");
        if (editingSubject?.id === id) {
          setEditingSubject(null);
          setSubjectTitle("");
          setSubjectDesc("");
          setSelectedCourseId("");
        }
        onRefreshData();
      } else {
        showMsg("Failed to delete subject.", "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseDesc(course.description);
    setCourseCat(course.category || "100 LEVEL");
    setCourseNumQuestions((course.numQuestions || 60).toString());
    setCourseTimeLimit((course.timeLimit || 60).toString());
    setCoursePassingScore((course.passingScore || 50).toString());
  };

  const handleStartEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectTitle(subject.title);
    setSubjectDesc(subject.description);
    setSelectedCourseId(subject.courseId);
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matCourseId || !matSubjectId || !matTitle || !matContent) return;
    setLoading(true);

    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: matCourseId,
          subjectId: matSubjectId,
          title: matTitle,
          content: matContent,
        }),
      });

      if (response.ok) {
        showMsg("Material uploaded successfully!");
        setMatTitle("");
        setMatContent("");
        fetchMaterials();
      } else {
        showMsg("Failed to upload material.", "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMatId) return;
    setLoading(true);

    try {
      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ materialId: aiMatId, count: aiCount }),
      });

      const data = await response.json();
      if (response.ok) {
        showMsg(`Success! Generated and saved ${data.questions?.length || aiCount} CBT questions.`);
        setAiMatId("");
      } else {
        showMsg(data.error || "Failed to generate questions.", "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper for material course filter change
  const handleMaterialCourseChange = (courseId: string) => {
    setMatCourseId(courseId);
    setMatSubjectId(""); // Reset subject
  };

  const filteredSubjects = subjects.filter((s) => s.courseId === matCourseId);

  return (
    <div className="space-y-6 animate-fadeIn" id="admin-panel-root">
      {/* Admin Title Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-6 w-6 text-blue-400" />
              NaijaCBT Administrator Control Desk
            </h2>
            <p className="text-sm text-slate-400 mt-1">Add courses, subjects, upload text materials, and activate Gemini AI to generate CBT questions automatically.</p>
          </div>
          <button
            onClick={() => {
              onRefreshData();
              fetchMaterials();
              fetchUsers();
              fetchResults();
            }}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border border-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5 text-blue-300" />
            Reload Data
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div
          className={`p-4 rounded-lg border text-sm font-semibold transition ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
          id="admin-alert"
        >
          {message.text}
        </div>
      )}

      {/* Quick Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
            activeTab === "courses"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          Courses & Subjects
        </button>
        <button
          onClick={() => setActiveTab("materials")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
            activeTab === "materials"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <FileText className="h-4 w-4" />
          Upload Syllabus
        </button>
        <button
          onClick={() => setActiveTab("ai-questions")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
            activeTab === "ai-questions"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          AI CBT Generator
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
            activeTab === "results"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Clipboard className="h-4 w-4" />
          Student Results
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
            activeTab === "users"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Users className="h-4 w-4" />
          User Records
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {activeTab === "courses" && (
          <>
            {/* Create/Edit Course Form */}
            <div className={`xl:col-span-1 p-6 border rounded-xl shadow-sm space-y-4 transition-all duration-300 ${
              editingCourse ? "bg-amber-50/50 border-amber-200" : "bg-white border-slate-200"
            }`}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                  {editingCourse ? (
                    <>
                      <Edit2 className="h-4 w-4 text-amber-600" />
                      Edit Prep Course
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 text-blue-600" />
                      Add New Prep Course
                    </>
                  )}
                </h3>
                {editingCourse && (
                  <button
                    onClick={() => {
                      setEditingCourse(null);
                      setCourseTitle("");
                      setCourseDesc("");
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                )}
              </div>
              <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">COURSE NAME</label>
                  <input
                    type="text"
                    placeholder="e.g., JAMB UTME Core 2026"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">CATEGORY</label>
                  <select
                    value={courseCat}
                    onChange={(e) => setCourseCat(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="100 LEVEL">100 Level GST</option>
                    <option value="200 LEVEL">200 Level GST</option>
                    <option value="300 LEVEL">300 Level GST</option>
                    <option value="400 LEVEL">400 Level GST</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">QUESTIONS</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={courseNumQuestions}
                      onChange={(e) => setCourseNumQuestions(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">TIME (MINS)</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={courseTimeLimit}
                      onChange={(e) => setCourseTimeLimit(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">PASS SCORE %</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={coursePassingScore}
                      onChange={(e) => setCoursePassingScore(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 font-bold"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">COURSE DESCRIPTION</label>
                  <textarea
                    placeholder="Syllabus overview and curriculum descriptions"
                    rows={3}
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-500 font-medium"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex justify-center items-center gap-1 ${
                      editingCourse 
                        ? "bg-amber-600 hover:bg-amber-700 text-white" 
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : editingCourse ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    {editingCourse ? "Update Prep Course" : "Create Prep Course"}
                  </button>
                </div>
              </form>
            </div>

            {/* Create/Edit Subject Form */}
            <div className={`xl:col-span-1 p-6 border rounded-xl shadow-sm space-y-4 transition-all duration-300 ${
              editingSubject ? "bg-amber-50/50 border-amber-200" : "bg-white border-slate-200"
            }`}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                  {editingSubject ? (
                    <>
                      <Edit2 className="h-4 w-4 text-amber-600" />
                      Edit Subject Syllabus
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 text-blue-600" />
                      Add Subject Syllabus
                    </>
                  )}
                </h3>
                {editingSubject && (
                  <button
                    onClick={() => {
                      setEditingSubject(null);
                      setSubjectTitle("");
                      setSubjectDesc("");
                      setSelectedCourseId("");
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                )}
              </div>
              <form onSubmit={editingSubject ? handleUpdateSubject : handleCreateSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">PARENT COURSE</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-500 font-medium"
                    required
                  >
                    <option value="">Select Target Course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.category}] {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">SUBJECT SYLLABUS TITLE</label>
                  <input
                    type="text"
                    placeholder="e.g., Chemistry"
                    value={subjectTitle}
                    onChange={(e) => setSubjectTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">SUBJECT CURRICULUM DESCRIPTION</label>
                  <textarea
                    placeholder="Describe topics, concepts covered, e.g., Organic chemistry, gas laws"
                    rows={3}
                    value={subjectDesc}
                    onChange={(e) => setSubjectDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-500 font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex justify-center items-center gap-1 ${
                    editingSubject 
                      ? "bg-amber-600 hover:bg-amber-700 text-white" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : editingSubject ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  {editingSubject ? "Update Subject Syllabus" : "Create Subject"}
                </button>
              </form>
            </div>

            {/* List current Setup */}
            <div className="xl:col-span-1 bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Active Syllabus Structure</h3>
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {courses.length === 0 ? (
                  <p className="text-xs text-slate-400">No active prep courses created.</p>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1.5 flex-1">
                          <h4 className="font-extrabold text-slate-800 text-xs leading-tight">{course.title}</h4>
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="inline-block bg-blue-100 text-blue-800 font-bold text-[8px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">{course.category}</span>
                            <span className="inline-block bg-slate-100 text-slate-600 font-extrabold text-[8px] px-1.5 py-0.5 rounded-md uppercase">{course.numQuestions || 60} Qs</span>
                            <span className="inline-block bg-slate-100 text-slate-600 font-extrabold text-[8px] px-1.5 py-0.5 rounded-md uppercase">{course.timeLimit || 60}m</span>
                            <span className="inline-block bg-emerald-100 text-emerald-800 font-extrabold text-[8px] px-1.5 py-0.5 rounded-md uppercase">Pass: {course.passingScore || 50}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-md border border-slate-100 shadow-xs">
                          <button
                            onClick={() => handleStartEditCourse(course)}
                            title="Edit Course"
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            title="Delete Course"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="pl-2 border-l-2 border-slate-200 space-y-2">
                        {subjects
                          .filter((s) => s.courseId === course.id)
                          .map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between gap-1.5 text-[11px] text-slate-600 font-semibold group/sub p-1 hover:bg-slate-100 rounded-md transition">
                              <span className="truncate flex-1">• {sub.title}</span>
                              <div className="opacity-0 group-hover/sub:opacity-100 flex items-center gap-0.5 shrink-0 bg-white/90 p-0.5 rounded border border-slate-200/60 shadow-xs transition">
                                <button
                                  onClick={() => handleStartEditSubject(sub)}
                                  title="Edit Subject"
                                  className="p-0.5 text-slate-400 hover:text-amber-600 rounded transition cursor-pointer"
                                >
                                  <Edit2 className="h-2.5 w-2.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubject(sub.id)}
                                  title="Delete Subject"
                                  className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {subjects.filter((s) => s.courseId === course.id).length === 0 && (
                          <div className="text-[10px] text-slate-400 italic pl-1">No active subjects yet</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "materials" && (
          <>
            {/* Upload form */}
            <div className="lg:col-span-1 bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                Upload Course Textbook/Material
              </h3>
              <form onSubmit={handleUploadMaterial} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">SELECT PREP COURSE</label>
                  <select
                    value={matCourseId}
                    onChange={(e) => handleMaterialCourseChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden"
                    required
                  >
                    <option value="">Select Prep Course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">SELECT SYLLABUS SUBJECT</label>
                  <select
                    value={matSubjectId}
                    disabled={!matCourseId}
                    onChange={(e) => setMatSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden disabled:opacity-50"
                    required
                  >
                    <option value="">Select Subject...</option>
                    {filteredSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Document Upload / Extraction */}
                <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500 fill-blue-500 animate-pulse" />
                      AI Document Parser
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      PDF, TXT, Images
                    </span>
                  </div>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      dragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-blue-400 bg-white"
                    }`}
                  >
                    <input
                      type="file"
                      id="syllabus-file-upload"
                      className="hidden"
                      accept=".pdf,.txt,.md,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      disabled={fileLoading}
                    />
                    
                    <label htmlFor="syllabus-file-upload" className="cursor-pointer w-full flex flex-col items-center justify-center">
                      {fileLoading ? (
                        <div className="w-full py-4 px-2 space-y-4 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-blue-700 flex items-center gap-1.5 animate-pulse">
                              <Sparkles className="h-4 w-4 text-blue-500 fill-blue-500" />
                              AI Extraction In Progress
                            </span>
                            <span className="font-mono font-black text-slate-700">
                              {fileProgressPercent}%
                            </span>
                          </div>
                          
                          {/* Progress Track */}
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${fileProgressPercent}%` }}
                            />
                          </div>

                          {/* Steps and detail messages */}
                          <div className="space-y-1 text-center">
                            <p className="text-xs font-bold text-slate-800 min-h-[16px] transition-all">
                              {fileProgressStep}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Gemini is scanning text and diagrams. Please wait...
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center">
                          <UploadCloud className="h-8 w-8 text-slate-400 animate-bounce" />
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-700">
                              <span className="text-blue-600 underline">Click to upload</span> or drag & drop
                            </p>
                            <p className="text-[10px] text-slate-400">PDF, TXT, MD, or textbook photos (OCR)</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {uploadError && (
                    <div className="flex items-start gap-1.5 p-2 bg-rose-50 text-rose-800 rounded-lg text-[10px] font-medium border border-rose-100">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">CHAPTER / TOPIC TITLE</label>
                  <input
                    type="text"
                    placeholder="e.g., Atomic Theory & Bonding"
                    value={matTitle}
                    onChange={(e) => setMatTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">PASTE STUDY TEXT CONTENT (SYLLABUS DETAILS)</label>
                  <textarea
                    placeholder="Paste textbook page excerpts, study notes or outline syllabus content. Gemini AI will parse this text to generate Study Guides and CBT Questions!"
                    rows={6}
                    value={matContent}
                    onChange={(e) => setMatContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-hidden"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex justify-center items-center gap-1"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                  Save Course Material
                </button>
              </form>
            </div>

            {/* List uploaded materials */}
            <div className="lg:col-span-2 bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Uploaded Study Volumes</h3>
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {materials.length === 0 ? (
                  <p className="text-xs text-slate-400">No textbook materials uploaded yet.</p>
                ) : (
                  materials.map((m) => {
                    const c = courses.find((course) => course.id === m.courseId);
                    const s = subjects.find((sub) => sub.id === m.subjectId);
                    return (
                      <div key={m.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{m.title}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                              {c?.title} • {s?.title}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">Uploaded: {new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3 bg-white p-3 border border-slate-200 rounded-lg leading-relaxed">
                          {m.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "ai-questions" && (
          <div className="xl:col-span-3 bg-white p-6 sm:p-8 border border-slate-200 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
              <Sparkles className="h-5.5 w-5.5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-lg">AI CBT Question Engine</h3>
                <p className="text-xs text-slate-500 mt-0.5">Utilize Gemini AI to automatically construct multiple-choice questions complete with educational feedback.</p>
              </div>
            </div>

            <form onSubmit={handleGenerateQuestions} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">SELECT STUDY SOURCE VOLUME</label>
                  <select
                    value={aiMatId}
                    onChange={(e) => setAiMatId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-500"
                    required
                  >
                    <option value="">Select Uploaded Material Source...</option>
                    {materials.map((m) => {
                      const c = courses.find((course) => course.id === m.courseId);
                      const s = subjects.find((sub) => sub.id === m.subjectId);
                      return (
                        <option key={m.id} value={m.id}>
                          [{c?.category || "General"}] {s?.title} - {m.title}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 flex justify-between">
                    <span>QUESTIONS TO GENERATE</span>
                    <span className="text-blue-600 font-bold">{aiCount} questions</span>
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 mt-1">
                    <span>3 (Fast)</span>
                    <span>5 (Default)</span>
                    <span>10 (Full)</span>
                    <span>15 (Comprehensive)</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1 bg-blue-50 p-5 border border-blue-100 rounded-xl h-fit space-y-3">
                <div className="text-xs font-bold text-blue-800 uppercase tracking-wide">CBT AI Blueprint:</div>
                <ul className="text-[11px] text-blue-700 space-y-2 font-semibold">
                  <li className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-500 flex-none" />
                    <span>Exact Syllabus-Based Questions</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-500 flex-none" />
                    <span>Balanced 4-Option (A-D) Layout</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-500 flex-none" />
                    <span>Comprehensive Explanations</span>
                  </li>
                </ul>

                <button
                  type="submit"
                  disabled={loading || !aiMatId}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-xs transition shadow-sm hover:shadow-md cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
                  id="btn-trigger-ai"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Synthesizing questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-blue-200 fill-blue-200" />
                      <span>Generate with Gemini AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "results" && (
          <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm overflow-hidden space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Complete Student Exam Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3">STUDENT NAME</th>
                    <th className="p-3">EMAIL</th>
                    <th className="p-3">TEST SYLLABUS</th>
                    <th className="p-3 text-center">MODE</th>
                    <th className="p-3 text-center">SCORE</th>
                    <th className="p-3 text-right">DATE TAKEN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-slate-400">No CBT student results recorded yet.</td>
                    </tr>
                  ) : (
                    allResults.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/50 font-semibold text-slate-700">
                        <td className="p-3 font-bold">{res.userName}</td>
                        <td className="p-3 text-slate-500">{res.userEmail}</td>
                        <td className="p-3">
                          <div>{res.subjectTitle}</div>
                          <div className="text-[10px] text-slate-400">{res.courseTitle}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            res.mode === "exam" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-green-50 text-green-700 border border-green-100"
                          }`}>
                            {res.mode}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span className={res.score >= 50 ? "text-green-600" : "text-rose-500"}>
                            {res.score}% ({res.correctAnswers}/{res.totalQuestions})
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-400 text-[10px]">{new Date(res.date).toLocaleDateString()} {new Date(res.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm overflow-hidden space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Registered User Index</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3">FULL NAME</th>
                    <th className="p-3">EMAIL ADDRESS</th>
                    <th className="p-3">ROLE</th>
                    <th className="p-3">MEMBERSHIP</th>
                    <th className="p-3 text-right">USER ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 font-semibold text-slate-700">
                      <td className="p-3 font-bold">{u.name}</td>
                      <td className="p-3 text-slate-500">{u.email}</td>
                      <td className="p-3 capitalize">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.role === "admin" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-50 text-slate-600"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.isPremium ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-50 text-slate-500"
                        }`}>
                          {u.isPremium ? "⭐ Premium Unlocked" : "Free Plan"}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-400 font-mono text-[10px]">{u.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

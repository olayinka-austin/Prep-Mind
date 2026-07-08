export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isPremium: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category?: string; // e.g., UTME, WAEC, NECO, Professional
  numQuestions?: number; // default e.g. 60
  timeLimit?: number; // default e.g. 60 minutes
  passingScore?: number; // default e.g. 50%
}

export interface Subject {
  id: string;
  courseId: string;
  title: string;
  description: string;
}

export interface Material {
  id: string;
  courseId: string;
  subjectId: string;
  title: string;
  content: string; // The uploaded text content
  createdAt: string;
}

export interface Question {
  id: string;
  courseId: string;
  subjectId: string;
  materialId?: string; // Optional: if generated from a specific material
  text: string;
  options: string[]; // Usually 4 options (A, B, C, D)
  correctAnswerIndex: number; // 0-indexed
  explanation: string;
}

export interface ExamResult {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  subjectId: string;
  subjectTitle: string;
  score: number; // percentage, e.g., 85
  correctAnswers: number;
  totalQuestions: number;
  mode: 'practice' | 'exam';
  date: string;
}

export interface StudyGuide {
  id: string;
  courseId: string;
  subjectId: string;
  materialId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  vocabulary: { term: string; definition: string }[];
  practiceFlashcards: { question: string; answer: string }[];
}

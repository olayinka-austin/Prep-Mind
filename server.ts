import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Ensure data folder exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, "db.json");

// Helper for hashing passwords
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Interfaces for our DB structure
interface DB {
  users: any[];
  sessions: { [token: string]: { userId: string; expiresAt: number } };
  courses: any[];
  subjects: any[];
  materials: any[];
  questions: any[];
  results: any[];
  studyGuides: any[];
}

// Initial DB structure
const initialDB: DB = {
  users: [
    {
      id: "admin-user",
      email: "austinolayinka667@gmail.com",
      name: "Admin Austin",
      passwordHash: hashPassword("admin123"),
      role: "admin",
      isPremium: true,
    },
    {
      id: "test-student",
      email: "student@cbtprep.com",
      name: "Test Student",
      passwordHash: hashPassword("student123"),
      role: "user",
      isPremium: false,
    }
  ],
  sessions: {},
  courses: [
    {
      id: "course-gst-100",
      title: "GST 100-Level Compulsory Courses",
      description: "Foundational general studies program covering academic communication, philosophy, logic, library usage, and Nigerian cultural heritage.",
      category: "100 LEVEL",
    },
    {
      id: "course-gst-200",
      title: "GST 200-Level Compulsory Courses",
      description: "Advanced general studies courses focusing on scientific evolution, peace, security, conflict management, and national cohesion.",
      category: "200 LEVEL",
    }
  ],
  subjects: [
    {
      id: "subj-gst111",
      courseId: "course-gst-100",
      title: "GST 111: Communication in English",
      description: "Focuses on active study skills, paragraphs, listening comprehension, note-taking, spelling, vocabulary, and phonetic transcriptions.",
    },
    {
      id: "subj-gst112",
      courseId: "course-gst-100",
      title: "GST 112: Philosophy, Human Existence & Logic",
      description: "An introduction to logic, formal and informal fallacies, philosophical inquiry, scientific methods, and theories of existence.",
    },
    {
      id: "subj-gst113",
      courseId: "course-gst-100",
      title: "GST 113: Nigerian Peoples and Culture",
      description: "Examines pre-colonial political administrations, cultural zones, traditional family structures, and socio-economic integration in Nigeria.",
    },
    {
      id: "subj-gst121",
      courseId: "course-gst-100",
      title: "GST 121: Use of Library & ICT",
      description: "Study of library catalogs, classifications (Library of Congress, DDC), search strategies, bibliographical citations, and digital literacy.",
    },
    {
      id: "subj-gst211",
      courseId: "course-gst-200",
      title: "GST 211: History and Philosophy of Science",
      description: "Examines the evolution of science, major scientific revolutions, theories of development, and the impact of technology on society.",
    },
    {
      id: "subj-gst222",
      courseId: "course-gst-200",
      title: "GST 222: Peace Studies & Conflict Resolution",
      description: "Explores positive vs negative peace, conflict analysis, mechanisms of mediation, arbitration, human rights, and national integration.",
    }
  ],
  materials: [
    {
      id: "mat-gst111-1",
      courseId: "course-gst-100",
      subjectId: "subj-gst111",
      title: "Study Skills, Active Reading & SQ3R Method",
      content: "Effective study skills are critical for undergraduate success. The SQ3R reading method represents: Survey, Question, Read, Recite, and Review. Surveying involves skimming through headings, summaries, and charts to gain an overview. Questioning turns headings into active queries (e.g., changing 'Definition of Logic' to 'What is logic?'). Reading involves active engagement to find answers to those questions. Reciting means speaking or writing down key summaries from memory. Reviewing is the periodic repetition of key concepts over spaced intervals to optimize retention. Paragraphs are basic units of written communication; a standard academic paragraph contains a topic sentence, supporting details, and a concluding or transitioning sentence.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mat-gst113-1",
      courseId: "course-gst-100",
      subjectId: "subj-gst113",
      title: "Pre-Colonial Administration & Social Systems",
      content: "Pre-colonial Nigerian societies exhibited distinct political structures. In the Hausa-Fulani Emirate system (Northern Nigeria), administration was highly centralized and autocratic, headed by an Emir. The Emir held legislative, executive, and judicial powers, supported by officials like the Waziri (Prime Minister), Galadima, and Madawaki (Army Commander). In the Yoruba Kingdom (Western Nigeria), the system was a centralized constitutional monarchy headed by the Oba (king), who ruled with the support of a council of chiefs called the Oyomesi. The Oyomesi could dethrone a tyrannical Oba through check-and-balance systems including the Ogboni society. In contrast, the Igbo traditional system (Eastern Nigeria) was highly decentralized, egalitarian, and acephalous (stateless), relying on age-grades, title societies (like Ozo), elders' councils (Ama-ala), and oracle systems to maintain social control without a single ruler.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mat-gst222-1",
      courseId: "course-gst-200",
      subjectId: "subj-gst222",
      title: "Concepts of Peace and Conflict Theories",
      content: "Peace can be defined in two dimensions: negative peace and positive peace. Negative peace is the simple absence of direct physical violence or active war. Positive peace is the presence of social justice, structural equality, and institutional mechanisms that resolve grievances. Conflict is a natural collision of values, interests, or goals, but it is not inherently violent. Standard conflict theories include: 1. Marxist/Structuralist theory: conflict arises from material inequality and resource scarcity. 2. Human Needs theory (John Burton): conflict occurs when basic human needs (identity, security, recognition) are blocked. 3. Frustration-Aggression theory: conflict is triggered when goals are repeatedly thwarted. Conflict resolution processes include negotiation, mediation (third-party facilitation without decision-making power), and arbitration (third-party decides the binding outcome).",
      createdAt: new Date().toISOString(),
    }
  ],
  questions: [
    {
      id: "q-gst111-1",
      courseId: "course-gst-100",
      subjectId: "subj-gst111",
      materialId: "mat-gst111-1",
      text: "What does the first 'S' in the SQ3R study method stand for?",
      options: [
        "Study",
        "Survey",
        "Sentence",
        "Summary"
      ],
      correctAnswerIndex: 1,
      explanation: "SQ3R stands for Survey, Question, Read, Recite, and Review. The first step is to Survey the material to gain a structural overview.",
    },
    {
      id: "q-gst111-2",
      courseId: "course-gst-100",
      subjectId: "subj-gst111",
      materialId: "mat-gst111-1",
      text: "What is the primary function of a topic sentence in an academic paragraph?",
      options: [
        "To provide a dramatic transition to the next chapter",
        "To introduce the central controlling idea of the paragraph",
        "To list all relevant references and external citations",
        "To conclude the essay with a personal signature"
      ],
      correctAnswerIndex: 1,
      explanation: "The topic sentence states the primary controlling idea of the paragraph, which the other sentences support and elaborate upon.",
    },
    {
      id: "q-gst113-1",
      courseId: "course-gst-100",
      subjectId: "subj-gst113",
      materialId: "mat-gst113-1",
      text: "Which of the following pre-colonial political systems in Nigeria was characterized as decentralized, egalitarian, and acephalous?",
      options: [
        "The Hausa-Fulani Emirate",
        "The Oyo Empire",
        "The Igbo traditional political system",
        "The Benin Kingdom"
      ],
      correctAnswerIndex: 2,
      explanation: "The traditional Igbo political system lacked a single centralized ruler (stateless/acephalous) and instead relied on a democratic network of elders, title societies, and age-grades.",
    },
    {
      id: "q-gst113-2",
      courseId: "course-gst-100",
      subjectId: "subj-gst113",
      materialId: "mat-gst113-1",
      text: "In the pre-colonial Yoruba administration, which group of chiefs held the constitutional power to check and impeach a tyrannical Alaafin (Oba)?",
      options: [
        "The Waziri council",
        "The Oyomesi council",
        "The Ama-ala assembly",
        "The Ozo society"
      ],
      correctAnswerIndex: 1,
      explanation: "The Oyomesi was the supreme council of state consisting of seven chief kingmakers, who held the power to reject or impeach an autocratic Oba.",
    },
    {
      id: "q-gst222-1",
      courseId: "course-gst-200",
      subjectId: "subj-gst222",
      materialId: "mat-gst222-1",
      text: "How is 'Positive Peace' defined in General Studies conflict modules?",
      options: [
        "The simple absence of active military warfare",
        "An enforced period of peace through aggressive police deterrence",
        "The presence of social justice, structural equality, and institutional fairness",
        "A temporary truce signed between warring ethnic factions"
      ],
      correctAnswerIndex: 2,
      explanation: "Positive peace addresses structural violence and represents the presence of justice, equity, and cooperation, rather than just the absence of direct physical violence (negative peace).",
    },
    {
      id: "q-gst222-2",
      courseId: "course-gst-200",
      subjectId: "subj-gst222",
      materialId: "mat-gst222-1",
      text: "Which conflict resolution mechanism involves a neutral third party facilitating communication but lacking the power to impose a binding decision?",
      options: [
        "Arbitration",
        "Mediation",
        "Litigation",
        "Inquisition"
      ],
      correctAnswerIndex: 1,
      explanation: "In mediation, a neutral mediator helps parties find a voluntary mutual agreement. In arbitration, the arbitrator imposes a final binding decision.",
    },
    {
      id: "q-gst112-1",
      courseId: "course-gst-100",
      subjectId: "subj-gst112",
      text: "Which informal fallacy is committed when an arguer attacks the opponent's personality instead of addressing the core of their argument?",
      options: [
        "Strawman fallacy",
        "Ad Hominem fallacy",
        "Red Herring fallacy",
        "Slippery Slope fallacy"
      ],
      correctAnswerIndex: 1,
      explanation: "An Ad Hominem fallacy (Latin for 'to the man') discredits an argument by attacking the arguer's personal character or status rather than the logic itself.",
    }
  ],
  results: [],
  studyGuides: [
    {
      id: "guide-gst111-1",
      courseId: "course-gst-100",
      subjectId: "subj-gst111",
      materialId: "mat-gst111-1",
      title: "GST 111 Study Guide: Master SQ3R & Paragraph Structures",
      summary: "This guide breaks down essential study skills and paragraph structure required for Nigerian university General Studies examinations. By mastering the SQ3R system, undergraduates can maximize active retention and recall, translating to exceptional performance in university computer-based tests (CBT).",
      keyPoints: [
        "The SQ3R reading system is divided into Survey, Question, Read, Recite, and Review.",
        "Active reading demands transforming passive headers into active questions before reading.",
        "A standard university academic paragraph is composed of a clear topic sentence, supporting facts, and a transitioning summary.",
        "Spaced retrieval practice (Reviewing) is the single most effective way to transfer knowledge to long-term memory."
      ],
      vocabulary: [
        { "term": "SQ3R", "definition": "A classical active study method representing Survey, Question, Read, Recite, and Review." },
        { "term": "Topic Sentence", "definition": "A sentence that states the primary, controlling idea of a paragraph." },
        { "term": "Spaced Repetition", "definition": "Reviewing material at increasing intervals of time to optimize brain retention." }
      ],
      practiceFlashcards: [
        { "question": "What are the five steps of the SQ3R study system?", "answer": "Survey, Question, Read, Recite, and Review." },
        { "question": "True or False: A topic sentence should always be placed at the very end of a paragraph.", "answer": "False. It is usually placed at or near the beginning of a paragraph." },
        { "question": "What is the difference between active and passive reading?", "answer": "Active reading involves questioning and summarizing, whereas passive reading is just scanning words." }
      ]
    },
    {
      id: "guide-gst113-1",
      courseId: "course-gst-100",
      subjectId: "subj-gst113",
      materialId: "mat-gst113-1",
      title: "GST 113 Study Guide: Pre-Colonial Political Administrations",
      summary: "An overview of the unique systems of governance in pre-colonial Nigeria. This study guide contrasts the centralized autocratic emirates of the North, the constitutional checks and balances of the Yoruba obas, and the highly decentralized egalitarian age-grade systems of the Igbos.",
      keyPoints: [
        "The Hausa-Fulani Emirate was a highly centralized, administrative system ruled by an Emir.",
        "The Yoruba pre-colonial system was a constitutional monarchy where the Oba ruled with checks from the Oyomesi chief council.",
        "The pre-colonial Igbo society was acephalous (meaning stateless or decentralized), using age-grades and Ama-ala councils rather than kings.",
        "Traditional checks-and-balances systems ensured that leaders who abused power were held accountable by local secret or elder groups."
      ],
      vocabulary: [
        { "term": "Acephalous", "definition": "A stateless or decentralized system of governance lacking a single political head or king." },
        { "term": "Oyomesi", "definition": "The powerful council of seven kingmakers in the traditional Oyo Empire." },
        { "term": "Waziri", "definition": "The senior administrative officer or Prime Minister in the traditional Hausa-Fulani Emirate." }
      ],
      practiceFlashcards: [
        { "question": "What is meant by the term 'acephalous society'?", "answer": "A stateless society governed democratically without a single king or monarch (e.g., traditional Igbo system)." },
        { "question": "What was the supreme council of state in the Yoruba Oyo Empire called?", "answer": "The Oyomesi." },
        { "question": "Who was the administrative Prime Minister in the pre-colonial Northern emirates?", "answer": "The Waziri." }
      ]
    }
  ]
};

// Database state
let db: DB;

// Load or seed database
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      // Ensure all fields exist
      db.users = db.users || [];
      db.sessions = db.sessions || {};
      db.courses = db.courses || [];
      db.subjects = db.subjects || [];
      db.materials = db.materials || [];
      db.questions = db.questions || [];
      db.results = db.results || [];
      db.studyGuides = db.studyGuides || [];
    } catch (e) {
      console.error("Error reading database file, using initial memory state", e);
      db = { ...initialDB };
    }
  } else {
    db = { ...initialDB };
    saveDB();
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save database file", e);
  }
}

// Load database immediately
loadDB();

// Initialize Express
const app = express();
app.use(express.json());

// Auth Middleware
function authenticate(req: any, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Missing or invalid token." });
  }

  const token = authHeader.substring(7);
  const session = db.sessions[token];

  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      delete db.sessions[token];
      saveDB();
    }
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found." });
  }

  req.user = user;
  next();
}

function isAdmin(req: any, res: express.Response, next: express.NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
}

// Gemini Client initialization
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// -------------------------------------------------------------
// AUTH ENDPOINTS
// -------------------------------------------------------------

app.post("/api/auth/signup", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  // Determine role. If it is the user's email from additional metadata, automatically make admin
  const isTargetAdmin = normalizedEmail === "austinolayinka667@gmail.com";
  const role = isTargetAdmin ? "admin" : "user";

  const newUser = {
    id: "u-" + crypto.randomUUID(),
    email: normalizedEmail,
    name: name.trim(),
    passwordHash: hashPassword(password),
    role,
    isPremium: isTargetAdmin, // Admin gets premium auto
  };

  db.users.push(newUser);
  saveDB();

  // Log them in immediately
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  db.sessions[token] = { userId: newUser.id, expiresAt };
  saveDB();

  const { passwordHash, ...userResponse } = newUser;
  res.status(201).json({ token, user: userResponse });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(400).json({ error: "Invalid email or password." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  db.sessions[token] = { userId: user.id, expiresAt };
  saveDB();

  const { passwordHash, ...userResponse } = user;
  res.json({ token, user: userResponse });
});

app.get("/api/auth/me", authenticate, (req: any, res) => {
  const { passwordHash, ...userResponse } = req.user;
  res.json({ user: userResponse });
});

app.post("/api/auth/firebase-google", (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Email and name are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    // Determine role. If it is the user's email, automatically make admin
    const isTargetAdmin = normalizedEmail === "austinolayinka667@gmail.com";
    const role = isTargetAdmin ? "admin" : "user";

    user = {
      id: "u-" + crypto.randomUUID(),
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: hashPassword(crypto.randomBytes(16).toString("hex")),
      role,
      isPremium: isTargetAdmin, // Admin gets premium auto
    };

    db.users.push(user);
    saveDB();
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  db.sessions[token] = { userId: user.id, expiresAt };
  saveDB();

  const { passwordHash, ...userResponse } = user;
  res.json({ token, user: userResponse });
});

// -------------------------------------------------------------
// COURSES & SUBJECTS ENDPOINTS
// -------------------------------------------------------------

app.get("/api/courses", (req, res) => {
  res.json({ courses: db.courses, subjects: db.subjects });
});

app.get("/api/subjects", (req, res) => {
  res.json({ subjects: db.subjects });
});

app.post("/api/courses", authenticate, isAdmin, (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  const newCourse = {
    id: "course-" + crypto.randomUUID().substring(0, 8),
    title: title.trim(),
    description: description.trim(),
    category: category ? category.trim() : "General",
  };

  db.courses.push(newCourse);
  saveDB();
  res.status(201).json(newCourse);
});

app.post("/api/subjects", authenticate, isAdmin, (req, res) => {
  const { courseId, title, description } = req.body;
  if (!courseId || !title || !description) {
    return res.status(400).json({ error: "Course ID, title, and description are required." });
  }

  const courseExists = db.courses.some((c) => c.id === courseId);
  if (!courseExists) {
    return res.status(404).json({ error: "Course not found." });
  }

  const newSubject = {
    id: "subj-" + crypto.randomUUID().substring(0, 8),
    courseId,
    title: title.trim(),
    description: description.trim(),
  };

  db.subjects.push(newSubject);
  saveDB();
  res.status(201).json(newSubject);
});

// -------------------------------------------------------------
// MATERIALS ENDPOINTS
// -------------------------------------------------------------

app.get("/api/materials", authenticate, (req, res) => {
  const { subjectId } = req.query;
  if (subjectId) {
    const filtered = db.materials.filter((m) => m.subjectId === subjectId);
    return res.json({ materials: filtered });
  }
  res.json({ materials: db.materials });
});

app.post("/api/materials", authenticate, isAdmin, (req, res) => {
  const { courseId, subjectId, title, content } = req.body;
  if (!courseId || !subjectId || !title || !content) {
    return res.status(400).json({ error: "Course ID, Subject ID, title, and content are required." });
  }

  const newMaterial = {
    id: "mat-" + crypto.randomUUID().substring(0, 8),
    courseId,
    subjectId,
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  db.materials.push(newMaterial);
  saveDB();
  res.status(201).json(newMaterial);
});

// -------------------------------------------------------------
// QUESTIONS ENDPOINTS
// -------------------------------------------------------------

app.get("/api/questions", authenticate, (req, res) => {
  const { subjectId } = req.query;
  if (subjectId) {
    const filtered = db.questions.filter((q) => q.subjectId === subjectId);
    return res.json({ questions: filtered });
  }
  res.json({ questions: db.questions });
});

// Create question manually
app.post("/api/questions", authenticate, isAdmin, (req, res) => {
  const { courseId, subjectId, text, options, correctAnswerIndex, explanation, materialId } = req.body;
  if (!courseId || !subjectId || !text || !options || correctAnswerIndex === undefined || !explanation) {
    return res.status(400).json({ error: "Missing required fields for question." });
  }

  const newQuestion = {
    id: "q-" + crypto.randomUUID().substring(0, 8),
    courseId,
    subjectId,
    materialId,
    text: text.trim(),
    options: options.map((opt: string) => opt.trim()),
    correctAnswerIndex: Number(correctAnswerIndex),
    explanation: explanation.trim(),
  };

  db.questions.push(newQuestion);
  saveDB();
  res.status(201).json(newQuestion);
});

// AI Question Generator using Gemini API
app.post("/api/questions/generate", authenticate, isAdmin, async (req, res) => {
  const { materialId, count } = req.body;
  if (!materialId) {
    return res.status(400).json({ error: "Material ID is required." });
  }

  const material = db.materials.find((m) => m.id === materialId);
  if (!material) {
    return res.status(404).json({ error: "Material not found." });
  }

  const numQuestions = Math.min(Math.max(Number(count) || 5, 1), 15);

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API is not configured on this environment. Please configure your GEMINI_API_KEY.",
    });
  }

  try {
    const prompt = `Based on the following educational course material, generate exactly ${numQuestions} multiple-choice questions (CBT format) suitable for university General Studies (GST) undergraduate exams.
Each question must have exactly 4 choices (A, B, C, D). Choose a single correct answer. Provide a helpful educational explanation of why the correct choice is correct.

Material Title: "${material.title}"
Material Content:
"""
${material.content}
"""

Return the output strictly as a JSON list matching this structure:
[
  {
    "text": "The text of the question?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswerIndex": 1, // 0-indexed integer corresponding to the correct option index (0 to 3)
    "explanation": "Why this answer is correct and educational feedback."
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ["text", "options", "correctAnswerIndex", "explanation"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API.");
    }

    const generated = JSON.parse(text);
    if (!Array.isArray(generated)) {
      throw new Error("Gemini response is not an array of questions.");
    }

    // Map and inject IDs and course/subject mapping
    const finalQuestions = generated.map((q: any) => ({
      id: "q-ai-" + crypto.randomUUID().substring(0, 8),
      courseId: material.courseId,
      subjectId: material.subjectId,
      materialId: material.id,
      text: q.text,
      options: q.options,
      correctAnswerIndex: Number(q.correctAnswerIndex),
      explanation: q.explanation,
    }));

    // Save questions in database
    db.questions.push(...finalQuestions);
    saveDB();

    res.status(200).json({
      message: `Successfully generated and saved ${finalQuestions.length} AI questions.`,
      questions: finalQuestions,
    });
  } catch (err: any) {
    console.error("AI Question Generation error: ", err);
    res.status(500).json({
      error: "Failed to generate questions with AI.",
      details: err.message,
    });
  }
});

// AI Study Guide Generator Endpoint
app.post("/api/materials/:id/study-guide", authenticate, async (req, res) => {
  const { id } = req.params;
  const material = db.materials.find((m) => m.id === id);
  if (!material) {
    return res.status(404).json({ error: "Material not found." });
  }

  // Check if study guide is already cached in db
  const existingGuide = db.studyGuides.find((g) => g.materialId === id);
  if (existingGuide) {
    return res.json(existingGuide);
  }

  if (!ai) {
    // If no AI key, return a mock study guide nicely based on the material text
    const fallbackGuide = {
      id: "guide-fb-" + crypto.randomUUID().substring(0, 8),
      courseId: material.courseId,
      subjectId: material.subjectId,
      materialId: material.id,
      title: `AI-Powered Study Guide: ${material.title}`,
      summary: `This is a quick summary of: "${material.title}". The material covers essential concepts, definitions, and rules critical for CBT exam performance.`,
      keyPoints: [
        "Focus on core definitions and rules detailed in the material.",
        "Review the examples provided in the material text to master practical applications.",
        "Make sure to test yourself using Practice Quizzes."
      ],
      vocabulary: [
        { term: "Subject Matter", definition: "The core focus or academic topic presented in this chapter." }
      ],
      practiceFlashcards: [
        { question: `What is the primary topic of ${material.title}?`, answer: `It focuses on explaining foundational principles of the subject.` }
      ]
    };
    db.studyGuides.push(fallbackGuide);
    saveDB();
    return res.json(fallbackGuide);
  }

  try {
    const prompt = `Act as an expert tutor for Nigerian university undergraduates preparing for General Studies (GST) courses (e.g., GST 111, 112, 113, 121, 211, 222).
Generate a structured, interactive, highly-engaging Study Guide based on this study material.

Material Title: "${material.title}"
Material Content:
"""
${material.content}
"""

Return the output strictly as a JSON object matching this structure:
{
  "title": "A highly engaging title, e.g., Mastery Guide to Subject-Verb Agreement",
  "summary": "A concise, conversational 3-4 sentence overview of the core educational concepts.",
  "keyPoints": [
    "Key point 1 explaining an essential takeaway",
    "Key point 2 explaining another essential takeaway",
    "Key point 3..."
  ],
  "vocabulary": [
    { "term": "Academic term", "definition": "Clear, contextual definition" },
    { "term": "Another term", "definition": "Definition..." }
  ],
  "practiceFlashcards": [
    { "question": "An active-recall question suitable for quick review", "answer": "The concise direct answer" },
    { "question": "Another flashcard question", "answer": "Answer..." }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ["term", "definition"],
              },
            },
            practiceFlashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ["question", "answer"],
              },
            },
          },
          required: ["title", "summary", "keyPoints", "vocabulary", "practiceFlashcards"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini.");
    }

    const generated = JSON.parse(text);
    const newGuide = {
      id: "guide-" + crypto.randomUUID().substring(0, 8),
      courseId: material.courseId,
      subjectId: material.subjectId,
      materialId: material.id,
      title: generated.title || `Mastery Guide: ${material.title}`,
      summary: generated.summary,
      keyPoints: generated.keyPoints || [],
      vocabulary: generated.vocabulary || [],
      practiceFlashcards: generated.practiceFlashcards || [],
    };

    db.studyGuides.push(newGuide);
    saveDB();
    res.json(newGuide);
  } catch (err: any) {
    console.error("AI Study Guide generation error: ", err);
    res.status(500).json({ error: "Failed to generate AI study guide.", details: err.message });
  }
});

// -------------------------------------------------------------
// RESULTS ENDPOINTS
// -------------------------------------------------------------

app.get("/api/results", authenticate, (req: any, res) => {
  const userResults = db.results.filter((r) => r.userId === req.user.id);
  res.json({ results: userResults });
});

app.post("/api/results", authenticate, (req: any, res) => {
  const { courseId, courseTitle, subjectId, subjectTitle, score, correctAnswers, totalQuestions, mode } = req.body;
  if (!courseId || !courseTitle || !subjectId || !subjectTitle || score === undefined || correctAnswers === undefined || !totalQuestions || !mode) {
    return res.status(400).json({ error: "Missing required fields for exam results." });
  }

  const newResult = {
    id: "res-" + crypto.randomUUID().substring(0, 8),
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    courseId,
    courseTitle,
    subjectId,
    subjectTitle,
    score: Number(score),
    correctAnswers: Number(correctAnswers),
    totalQuestions: Number(totalQuestions),
    mode,
    date: new Date().toISOString(),
  };

  db.results.push(newResult);
  saveDB();
  res.status(201).json(newResult);
});

// Admin-only results viewer
app.get("/api/results/admin", authenticate, isAdmin, (req, res) => {
  res.json({ results: db.results });
});

// Admin-only users list
app.get("/api/admin/users", authenticate, isAdmin, (req, res) => {
  const safeUsers = db.users.map(({ passwordHash, ...u }) => u);
  res.json({ users: safeUsers });
});

// -------------------------------------------------------------
// PAYMENTS ENDPOINTS (PAYSTACK)
// -------------------------------------------------------------

// Paystack payment initialization (Simulates when key is absent, calls Paystack API when key is present)
app.post("/api/payments/initialize", authenticate, async (req: any, res) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const { amount } = req.body; // Amount in Kobo (1 Naira = 100 Kobo)

  if (!amount) {
    return res.status(400).json({ error: "Amount in Kobo is required." });
  }

  const reference = "pay-" + crypto.randomUUID().substring(0, 12);

  // If live/sandbox key is configured, call official Paystack API
  if (PAYSTACK_SECRET_KEY) {
    try {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: req.user.email,
          amount,
          reference,
          callback_url: `${process.env.APP_URL || "http://localhost:3000"}/api/payments/callback`,
        }),
      });

      const data = await response.json();
      if (data.status) {
        return res.json({
          status: true,
          live: true,
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference,
        });
      } else {
        throw new Error(data.message || "Paystack initialization failed.");
      }
    } catch (err: any) {
      console.error("Paystack API call error, falling back to simulated checkout: ", err);
    }
  }

  // Fallback / Sandbox Simulation Mode (Highly realistic)
  // We return a simulated token so the client can trigger a beautiful Paystack modal
  res.json({
    status: true,
    live: false,
    reference,
    amount,
    email: req.user.email,
    message: "Paystack simulated environment initialized successfully.",
  });
});

// Verify Paystack Payment
app.post("/api/payments/verify", authenticate, async (req: any, res) => {
  const { reference, simulatedSuccess } = req.body;
  if (!reference) {
    return res.status(400).json({ error: "Reference is required." });
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  // Verify via API if keys are set
  if (PAYSTACK_SECRET_KEY) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });

      const data = await response.json();
      if (data.status && data.data.status === "success") {
        // Find user and upgrade to Premium
        const userIndex = db.users.findIndex((u) => u.id === req.user.id);
        if (userIndex !== -1) {
          db.users[userIndex].isPremium = true;
          saveDB();
        }
        return res.json({
          status: "success",
          user: db.users[userIndex],
          message: "Payment successfully verified via Paystack!",
        });
      }
    } catch (err) {
      console.error("Paystack verification failed, checking simulation...", err);
    }
  }

  // Handle simulation verification
  if (simulatedSuccess) {
    const userIndex = db.users.findIndex((u) => u.id === req.user.id);
    if (userIndex !== -1) {
      db.users[userIndex].isPremium = true;
      saveDB();
    }
    return res.json({
      status: "success",
      user: db.users[userIndex],
      message: "Payment verified successfully (Simulation Mode).",
    });
  }

  res.status(400).json({ error: "Payment verification failed." });
});

// -------------------------------------------------------------
// VITE AND ASSET HANDLERS
// -------------------------------------------------------------

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CBT Prep Platform running on http://localhost:${PORT}`);
  });
}

startServer();

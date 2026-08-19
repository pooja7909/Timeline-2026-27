import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { INITIAL_PLAN } from "./src/data/defaultPlan.ts";
import { DEFAULT_YEAR_REPORT_DATES } from "./src/data/reportCycles.ts";
import { CurriculumState, TermData, LockState, YearReportDate } from "./src/types.ts";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "curriculum-store.json");

let state: CurriculumState = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  lock: {
    isLocked: false,
    hasPin: true,
    lockedBy: "Department",
    lockedAt: ""
  },
  plan: JSON.parse(JSON.stringify(INITIAL_PLAN)),
  reportDates: JSON.parse(JSON.stringify(DEFAULT_YEAR_REPORT_DATES))
};

let storedPin: string | null = "2026";

// Initialize persistence directory and store
function loadStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.plan)) {
        state = {
          version: parsed.version || 1,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          lock: parsed.lock || { isLocked: false, hasPin: true },
          plan: parsed.plan,
          reportDates: Array.isArray(parsed.reportDates) ? parsed.reportDates : JSON.parse(JSON.stringify(DEFAULT_YEAR_REPORT_DATES))
        };
        storedPin = parsed.secretPin || "2026";
      }
    } else {
      saveStore();
    }
  } catch (err) {
    console.error("Error loading curriculum store:", err);
  }
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const toSave = {
      ...state,
      secretPin: storedPin
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(toSave, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing curriculum store:", err);
  }
}

loadStore();

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: state.version, isLocked: state.lock.isLocked });
});

// GET curriculum state
app.get("/api/curriculum", (_req, res) => {
  res.json(state);
});

// UPDATE curriculum plan or reportDates
app.put("/api/curriculum", (req, res) => {
  const { plan, reportDates, pin } = req.body;

  // If locked, verify PIN or reject
  if (state.lock.isLocked) {
    if (storedPin && storedPin !== pin) {
      return res.status(403).json({ error: "Timeline is locked. Provide valid PIN to modify." });
    }
  }

  let updated = false;
  if (plan && Array.isArray(plan)) {
    state.plan = plan;
    updated = true;
  }
  if (reportDates && Array.isArray(reportDates)) {
    state.reportDates = reportDates;
    updated = true;
  }

  if (!updated) {
    return res.status(400).json({ error: "No valid plan or reportDates data provided" });
  }

  state.version += 1;
  state.lastUpdated = new Date().toISOString();
  saveStore();

  res.json({ success: true, version: state.version, lastUpdated: state.lastUpdated });
});

// VERIFY TEACHER PASSWORD (Default: 2026)
app.post("/api/teacher/verify", (req, res) => {
  const { password } = req.body;
  const targetPin = storedPin || "2026";
  if (password === targetPin || password === "2026") {
    return res.json({ valid: true });
  }
  return res.status(401).json({ valid: false, error: "Incorrect teacher password." });
});

// LOCK / UNLOCK curriculum
app.post("/api/curriculum/lock", (req, res) => {
  const { isLocked, pin, currentPin, lockedBy } = req.body;

  // If currently locked and trying to unlock with a PIN set:
  if (state.lock.isLocked && !isLocked) {
    const targetPin = storedPin || "2026";
    if (currentPin !== targetPin && currentPin !== "2026") {
      return res.status(401).json({ error: "Incorrect PIN to unlock timeline." });
    }
  }

  if (isLocked && pin) {
    storedPin = String(pin).trim();
  } else if (!isLocked) {
    // Keep default 2026 if not cleared
    if (req.body.clearPin) {
      storedPin = "2026";
    }
  }

  state.lock = {
    isLocked: !!isLocked,
    hasPin: true,
    lockedBy: lockedBy || (isLocked ? "Department Lead" : undefined),
    lockedAt: isLocked ? new Date().toISOString() : undefined
  };
  state.version += 1;
  state.lastUpdated = new Date().toISOString();
  saveStore();

  res.json({ success: true, lock: state.lock, version: state.version });
});

// RESET to defaults
app.post("/api/curriculum/reset", (req, res) => {
  const { pin } = req.body;
  if (state.lock.isLocked && storedPin && storedPin !== pin) {
    return res.status(403).json({ error: "Timeline is locked. PIN required to reset." });
  }

  state.plan = JSON.parse(JSON.stringify(INITIAL_PLAN));
  state.version += 1;
  state.lastUpdated = new Date().toISOString();
  saveStore();

  res.json({ success: true, version: state.version, plan: state.plan });
});

// AI ASSISTANT: Generate teaching ideas, differentiation, assessment rubrics
app.post("/api/ai/suggest", async (req, res) => {
  const { yearGroup, topic, term, week, contextType } = req.body;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        fallback: true,
        suggestion: `Practical suggestions for ${yearGroup || 'Computing'} — "${topic}":\n• Starter (5 min): Quick recall quiz on prior concept.\n• Main (30 min): Guided coding / hands-on task with scaffolded examples.\n• Extension: Open-ended algorithmic challenge or edge-case testing.\n• Plenary: Peer review with mark scheme rubric.`
      });
    }

    const prompt = `You are an expert Head of Computing at a British International School following KS3, Edexcel IGCSE (4CP0) and IB DP Computer Science.
Please provide concise, highly practical teaching suggestions for:
- Year Group: ${yearGroup}
- Current Topic / Task: "${topic}"
- Term & Week: ${term || 'Term 1'} Week ${week || 1}
- Request: ${contextType || 'lesson plan starter, hands-on tasks, high-achiever extension and common misconceptions'}

Format your response cleanly with brief bullet points, zero fluff, ready for classroom implementation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    res.json({ suggestion: response.text });
  } catch (err: any) {
    console.error("AI Suggestion error:", err);
    res.status(500).json({ error: "Could not generate AI suggestions", details: err.message });
  }
});

// ----------------------------------------------------
// VITE OR STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Curriculum Planner Server running on http://localhost:${PORT}`);
  });
}

startServer();

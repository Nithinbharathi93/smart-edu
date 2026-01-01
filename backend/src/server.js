import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import pLimit from "p-limit";

import {
  extractTextFromPDF,
  chunkText,
} from "./controllers/textExtractController.js";
import { getEmbedding, getChatResponse } from "./controllers/aiController.js";
import { listDocuments } from "./controllers/documentController.js";
import { generateSyllabus } from "./controllers/syllabusController.js";
import { signUp, signIn } from "./controllers/authController.js";
import { generateCodingProblem } from "./controllers/problemController.js";
import { generateTopicSyllabus } from "./controllers/topicSyllabusController.js";
import { executeCode } from "./controllers/compilerController.js";
import {
  generateSolution,
  provideGuidance,
} from "./controllers/tutorController.js";
import { generateAdaptiveTest, calculateLevel } from "./controllers/assessmentController.js";
import { upsertProfile, getProfile } from "./controllers/profileController.js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, { origin: "*" });
await fastify.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 },
});

const authenticateUser = async (req, reply) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    reply.code(401).send({ error: "No token provided." });
    return null;
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    reply.code(401).send({ error: "Invalid token." });
    return null;
  }
  return user;
};

fastify.post("/register", async (req, reply) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return reply.code(400).send({ error: "Email and password are required" });
  }
  try {
    const data = await signUp(email, password);
    return {
      message:
        "Registration successful! Please check your email for verification.",
      data,
    };
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
});

fastify.post("/login", async (req, reply) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return reply.code(400).send({ error: "Email and password are required" });
  }
  try {
    const data = await signIn(email, password);
    return {
      message: "Login successful",
      token: data.session.access_token,
      user: data.user,
    };
  } catch (error) {
    return reply.code(401).send({ error: "Invalid login credentials" });
  }
});

fastify.post("/ingest", async (req, reply) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return reply.code(401).send({ error: "No token provided" });
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return reply.code(401).send({ error: "Unauthorized" });
    const data = await req.file();
    const buffer = await data.toBuffer();
    const rawText = await extractTextFromPDF(buffer);
    const chunks = await chunkText(rawText);
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        filename: data.filename,
        user_id: user.id,
      })
      .select()
      .single();
    if (docError) return reply.code(500).send({ error: docError.message });
    const limit = pLimit(5);
    const sections = await Promise.all(
      chunks.map((chunk) =>
        limit(async () => {
          const vector = await getEmbedding(chunk);
          return {
            document_id: doc.id,
            content: chunk,
            embedding: vector,
          };
        })
      )
    );
    const { error: sectionError } = await supabase
      .from("document_sections")
      .insert(sections);
    if (sectionError)
      return reply.code(500).send({ error: sectionError.message });
    return { success: true, pdf_id: doc.id };
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
});

fastify.post("/chat", async (req, reply) => {
  const { pdf_id, question, level } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const numericPdfId = Number(pdf_id);
  const userLevel = level || "Beginner";
  const queryVector = await getEmbedding(question);
  const { data: matchedSections, error: rpcError } = await supabase.rpc(
    "match_document_sections",
    {
      p_query_embedding: queryVector,
      p_match_threshold: 0.1,
      p_match_count: 5,
      p_filter_pdf_id: numericPdfId,
      p_user_id: user.id,
    }
  );
  if (rpcError) return reply.code(500).send({ error: rpcError.message });
  if (!matchedSections || matchedSections.length === 0) {
    const { data: fallbackSections } = await supabase
      .from("document_sections")
      .select("id, content")
      .eq("document_id", numericPdfId)
      .limit(3)
      .order("id", { ascending: true });
    matchedSections = fallbackSections || [];
  }
  if (rpcError) return reply.code(500).send({ error: rpcError.message });
  const context = matchedSections.map((section) => section.content);
  const answer = await getChatResponse(question, context, userLevel);
  return { answer, sources: matchedSections.map((s) => s.id) };
});

fastify.post("/generate-syllabus", async (req, reply) => {
  const { pdf_id, duration, level } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;
  if (!pdf_id || !duration || !level) {
    return reply.code(400).send({ error: "Missing parameters" });
  }
  const { data: existingSyllabus } = await supabase
    .from("syllabi")
    .select("syllabus_data")
    .eq("document_id", pdf_id)
    .eq("user_id", user.id)
    .eq("duration", duration)
    .eq("level", level)
    .single();
  if (existingSyllabus) {
    return { ...existingSyllabus.syllabus_data, cached: true };
  }
  const { data: sections, error: dbError } = await supabase
    .from("document_sections")
    .select(
      `
      content, 
      documents!inner(filename, user_id)
    `
    )
    .eq("document_id", pdf_id)
    .eq("documents.user_id", user.id)
    .limit(15);
  if (dbError || !sections || sections.length === 0) {
    return reply
      .code(404)
      .send({ error: "PDF content not found or access denied." });
  }
  const filename = sections[0].documents.filename;
  const context = sections.map((s) => s.content);
  const syllabusJson = await generateSyllabus(
    filename,
    context,
    duration,
    level
  );
  const title = syllabusJson.syllabus_title || `Analysis of ${filename}`;

  await supabase.from("syllabi").insert({
    document_id: pdf_id,
    user_id: user.id,
    syllabus_title: title, // SAVING TO NEW COLUMN
    syllabus_data: syllabusJson,
    duration: duration,
    level: level,
  });

  return { ...syllabusJson, cached: false };
});

fastify.get("/list-pdfs", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { data, error } = await supabase
    .from("documents")
    .select("id, filename")
    .eq("user_id", user.id);
  return data;
});

fastify.get("/my-courses", async (req, reply) => {
  // 1. Authenticate the user
  const user = await authenticateUser(req, reply); 
  if (!user) return;

  // 2. Fetch data using the new syllabus_title column
  const { data, error } = await supabase
    .from("syllabi")
    .select(`
      id,
      syllabus_title,
      level,
      duration,
      created_at,
      documents ( filename )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }); // Show newest courses first

  if (error) {
    return reply.code(500).send({ error: error.message });
  }

  return data;
});

fastify.post("/generate-problem", async (req, reply) => {
  const { syllabus_id, week_number, concept, level } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;

  // 1. Check if problem already exists (Cache check)
  const { data: existingProblem } = await supabase
    .from("coding_problems")
    .select("*")
    .eq("syllabus_id", syllabus_id)
    .eq("week_number", week_number)
    .eq("concept", concept)
    .single();

  if (existingProblem) return { ...existingProblem, cached: true };

  // 2. Fetch Syllabus to get the document_id (if any)
  const { data: syllabus, error: sylError } = await supabase
    .from("syllabi")
    .select("document_id, level")
    .eq("id", syllabus_id)
    .single();

  if (sylError || !syllabus) return reply.code(404).send({ error: "Syllabus not found" });

  let context = [];
  
  // 3. Logic: If document exists, get chunks. If not, it's AI Topic based.
  if (syllabus.document_id) {
    const { data: sections } = await supabase
      .from("document_sections")
      .select("content")
      .eq("document_id", syllabus.document_id)
      .limit(8); // Optimization: 8 chunks is usually enough context
    
    if (sections) context = sections.map((s) => s.content);
  }

  // 4. Generate Problem
  const problemJson = await generateCodingProblem(
    context,
    level || syllabus.level,
    week_number,
    concept
  );

  if (problemJson.error) {
    return reply.code(500).send({ error: "AI generation failed", details: problemJson.raw });
  }

  // 5. Save to Supabase
  const { data: savedProblem, error } = await supabase
    .from("coding_problems")
    .insert({
      user_id: user.id,
      syllabus_id: syllabus_id,
      document_id: syllabus.document_id, // Will be null for topic-based
      week_number: week_number,
      concept: concept,
      title: problemJson.title,
      description: problemJson.description,
      difficulty: problemJson.difficulty,
      topics: problemJson.topics,
      constraints: problemJson.constraints,
      examples: problemJson.examples,
    })
    .select()
    .single();

  if (error) return reply.code(500).send({ error: error.message });

  return { ...savedProblem, cached: false };
});

fastify.get("/syllabus/:id/problems", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { data, error } = await supabase
    .from("coding_problems")
    .select("id, title, difficulty, week_number, concept")
    .eq("syllabus_id", req.params.id)
    .eq("user_id", user.id)
    .order("week_number", { ascending: true });

  if (error) return reply.code(500).send({ error: error.message });
  return data;
});

fastify.post("/generate-topic-syllabus", async (req, reply) => {
  const { topic, duration, level } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;

  if (!topic || !duration || !level) {
    return reply.code(400).send({ error: "Missing parameters" });
  }

  const syllabusJson = await generateTopicSyllabus(topic, duration, level);

  // Extract the title from the AI response
  const title = syllabusJson.syllabus_title || `Course on ${topic}`;

  const { data: savedSyllabus, error: insertError } = await supabase
    .from("syllabi")
    .insert({
      user_id: user.id,
      document_id: null,
      syllabus_title: title, // SAVING TO NEW COLUMN
      syllabus_data: syllabusJson,
      duration: duration,
      level: level,
    })
    .select()
    .single();

  if (insertError) return reply.code(500).send({ error: insertError.message });

  return {
    syllabus: syllabusJson,
    id: savedSyllabus?.id,
    type: "topic-based",
  };
});

fastify.get("/get-syllabus/:id", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { id } = req.params;
  const { data: syllabus, error } = await supabase
    .from("syllabi")
    .select(
      `
      id,
      level,
      duration,
      syllabus_data,
      created_at,
      document_id
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !syllabus) {
    return reply
      .code(404)
      .send({ error: "Syllabus not found or access denied." });
  }
  return syllabus;
});

fastify.post("/compile", async (req, reply) => {
  const { language, version, source_code } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;
  if (!language || !source_code) {
    return reply.code(400).send({ error: "Missing language or source_code" });
  }
  const result = await executeCode(language, version, source_code);
  if (!result.success) {
    return reply.code(500).send({ error: result.error });
  }
  return result;
});

fastify.post("/problem/solution", async (req, reply) => {
  const { problem_details, language } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user || !problem_details)
    return reply.code(400).send({ error: "Missing data" });
  try {
    const solution = await generateSolution(problem_details, language);
    return solution;
  } catch (e) {
    return reply.code(500).send({ error: "Failed to generate JSON solution" });
  }
});

fastify.post("/problem/guide", async (req, reply) => {
  const { problem_details, user_query, user_code } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user || !problem_details)
    return reply.code(400).send({ error: "Missing data" });
  try {
    const hint = await provideGuidance(
      problem_details,
      user_query,
      user_code || "none"
    );
    return hint;
  } catch (e) {
    return reply.code(500).send({ error: "Failed to generate JSON guidance" });
  }
});

fastify.delete("/delete-pdf/:id", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { id } = req.params;
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); 
  if (error) return reply.code(500).send({ error: error.message });
  return { success: true, message: "Document and associated embeddings deleted." };
});

fastify.delete("/delete-syllabus/:id", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { id } = req.params;
  const { error } = await supabase
    .from("syllabi")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Security: User can only delete their own syllabus
  if (error) return reply.code(500).send({ error: error.message });
  return { success: true, message: "Syllabus and associated problems deleted." };
});

fastify.get("/assessment/questions", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { data: profile } = await supabase.from("profiles").select("persona").eq("id", user.id).single();
  if (['casual', 'seasoned_dev'].includes(profile?.persona)) {
    return reply.code(403).send({ error: "Assessment not required for your persona." });
  }
  const questions = await generateAdaptiveTest();
  return questions;
});

fastify.post("/assessment/submit", async (req, reply) => {
  const { score, answers } = req.body; // Score out of 15
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const assessment = calculateLevel(score);
  await supabase.from("profiles").update({
    current_level: assessment.level,
    level_name: assessment.name,
    last_assessed_at: new Date()
  }).eq("id", user.id);
  await supabase.from("proficiency_tests").insert({
    user_id: user.id,
    score: score,
    assigned_level: assessment.level,
    answers_json: answers
  });
  return { message: `Assessment complete! You are a ${assessment.name}`, ...assessment };
});

fastify.get("/profile/me", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;

  try {
    const profile = await getProfile(user.id);
    return profile || {}; // Return empty object if no profile yet
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
});

fastify.post("/profile/setup", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;

  try {
    // SECURITY: We spread req.body but FORCE the id to be user.id from the token
    const profilePayload = {
      ...req.body,
      id: user.id 
    };

    const updatedProfile = await upsertProfile(user.id, profilePayload);
    return { message: "Profile updated successfully", profile: updatedProfile };
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
});


const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running on port http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

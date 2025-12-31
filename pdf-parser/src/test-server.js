import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import pLimit from "p-limit";

import { extractTextFromPDF, chunkText } from "./controllers/textExtractController.js";
import { getEmbedding, getChatResponse } from "./controllers/aiController.js";
import { listDocuments } from "./controllers/documentController.js";
import { generateSyllabus } from "./controllers/syllabusController.js";
import { signUp, signIn } from "./controllers/authController.js";
import { generateCodingProblem } from "./controllers/problemController.js";
import { generateTopicSyllabus } from "./controllers/topicSyllabusController.js";
import { executeCode } from "./controllers/compilerController.js";
import { generateSolution, provideGuidance } from "./controllers/tutorController.js";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: "*" });
await fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

const authenticateUser = async (req, reply) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    reply.code(401).send({ error: "No token provided." });
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    reply.code(401).send({ error: "Invalid token." });
    return null;
  }
  return user;
};

fastify.post("/register", async (req, reply) => {
  const { email, password } = req.body;
  if (!email || !password) return reply.code(400).send({ error: "Email and password are required" });

  try {
    const data = await signUp(email, password);
    return { 
      message: "Registration successful! Please check your email for verification.", 
      data 
    };
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
});

fastify.post("/login", async (req, reply) => {
  const { email, password } = req.body;
  if (!email || !password) return reply.code(400).send({ error: "Email and password are required" });

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
  const user = await authenticateUser(req, reply);
  if (!user) return;

  try {
    const data = await req.file();
    const buffer = await data.toBuffer();
    const rawText = await extractTextFromPDF(buffer);
    const chunks = await chunkText(rawText);

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ filename: data.filename, user_id: user.id })
      .select()
      .single();

    if (docError) return reply.code(500).send({ error: docError.message });

    const limit = pLimit(5);
    const sections = await Promise.all(
      chunks.map((chunk) =>
        limit(async () => {
          const vector = await getEmbedding(chunk);
          return { document_id: doc.id, content: chunk, embedding: vector };
        })
      )
    );

    const { error: sectionError } = await supabase.from("document_sections").insert(sections);
    if (sectionError) return reply.code(500).send({ error: sectionError.message });

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

  const { data: matchedSections, error: rpcError } = await supabase.rpc("match_document_sections", {
    p_query_embedding: queryVector,
    p_match_threshold: 0.1,
    p_match_count: 5,
    p_filter_pdf_id: numericPdfId,
    p_user_id: user.id,
  });

  if (rpcError) return reply.code(500).send({ error: rpcError.message });

  let contextData = matchedSections || [];
  if (contextData.length === 0) {
    const { data: fallback } = await supabase
      .from("document_sections")
      .select("id, content")
      .eq("document_id", numericPdfId)
      .limit(3)
      .order("id", { ascending: true });
    contextData = fallback || [];
  }

  const contextStrings = contextData.map((s) => s.content);
  const answer = await getChatResponse(question, contextStrings, userLevel);

  return { answer, sources: contextData.map((s) => s.id) };
});

fastify.post("/generate-syllabus", async (req, reply) => {
  const { pdf_id, duration, level } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;

  if (!pdf_id || !duration || !level) return reply.code(400).send({ error: "Missing parameters" });

  const { data: existing } = await supabase
    .from("syllabi")
    .select("syllabus_data")
    .eq("document_id", pdf_id)
    .eq("user_id", user.id)
    .eq("duration", duration)
    .eq("level", level)
    .single();

  if (existing) return { ...existing.syllabus_data, cached: true };

  const { data: sections, error: dbError } = await supabase
    .from("document_sections")
    .select("content, documents!inner(filename, user_id)")
    .eq("document_id", pdf_id)
    .eq("documents.user_id", user.id)
    .limit(15);

  if (dbError || !sections?.length) {
    return reply.code(404).send({ error: "PDF content not found or access denied." });
  }

  const filename = sections[0].documents.filename;
  const context = sections.map((s) => s.content);
  const syllabusJson = await generateSyllabus(filename, context, duration, level);

  await supabase.from("syllabi").insert({
    document_id: pdf_id,
    user_id: user.id,
    syllabus_data: syllabusJson,
    duration: duration,
    level: level,
  });

  return { ...syllabusJson, cached: false };
});

fastify.get("/list-pdfs", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;

  const { data } = await supabase.from("documents").select("id, filename").eq("user_id", user.id);
  return data;
});

fastify.get("/my-courses", async (req, reply) => {
  const { data, error } = await supabase.from("syllabi").select(`
      id, level, duration,
      syllabus_data->syllabus_title as title,
      documents ( filename )
    `);

  if (error) return reply.code(500).send({ error: error.message });
  return data;
});

fastify.post("/generate-problem", async (req, reply) => {
  const { syllabus_id, week_number, concept } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;

  if (!syllabus_id || !week_number || !concept) {
    return reply.code(400).send({ error: "Missing parameters" });
  }

  const { data: syllabus, error: sylError } = await supabase
    .from("syllabi")
    .select("document_id, level, syllabus_data")
    .eq("id", syllabus_id)
    .eq("user_id", user.id)
    .single();

  if (sylError || !syllabus) return reply.code(404).send({ error: "Syllabus not found." });

  let context = [];
  if (syllabus.document_id) {
    const { data: sections } = await supabase
      .from("document_sections")
      .select("content")
      .eq("document_id", syllabus.document_id)
      .limit(10);
    if (sections) context = sections.map((s) => s.content);
  }

  const problem = await generateCodingProblem(context, syllabus.level || "Intermediate", week_number, concept);
  return { ...problem, syllabus_id, is_from_book: !!syllabus.document_id };
});

fastify.post("/generate-topic-syllabus", async (req, reply) => {
  const { topic, duration, level } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;

  if (!topic || !duration || !level) return reply.code(400).send({ error: "Missing parameters" });

  const syllabusJson = await generateTopicSyllabus(topic, duration, level);
  const { data: saved } = await supabase
    .from("syllabi")
    .insert({ user_id: user.id, document_id: null, syllabus_data: syllabusJson, duration, level })
    .select()
    .single();

  return { syllabus: syllabusJson, id: saved?.id, type: "topic-based" };
});

fastify.get("/get-syllabus/:id", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;

  const { data, error } = await supabase
    .from("syllabi")
    .select("id, level, duration, syllabus_data, created_at, document_id")
    .eq("id", req.params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return reply.code(404).send({ error: "Syllabus not found." });
  return data;
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
  if (!user) return;
  if (!problem_details) return reply.code(400).send({ error: "Missing problem details" });
  const solution = await generateSolution(problem_details, language || "javascript");
  return { solution };
});

fastify.post("/problem/guide", async (req, reply) => {
  const { problem_details, user_query } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;
  if (!problem_details) return reply.code(400).send({ error: "Missing problem details" });
  const hint = await provideGuidance(problem_details, user_query);
  return { hint };
});


const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
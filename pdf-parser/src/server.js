import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { extractTextFromPDF, chunkText } from "./controllers/textExtractor.js";
import { getEmbedding, getChatResponse } from "./controllers/aiController.js";
import pLimit from "p-limit"; 
import { listDocuments } from "./controllers/documentController.js";
import { generateSyllabus } from "./controllers/syllabusController.js";
import { signUp, signIn } from "./controllers/authController.js";

dotenv.config();

// Supabase Client Initialization
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const fastify = Fastify({
  logger: true, // Structured logging for observability
});

// Register Middleware
await fastify.register(cors, { origin: "*" });
await fastify.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Endpoint: Ingest PDF
 * 1. Uploads file
 * 2. Extracts text
 * 3. Chunks text
 * 4. Generates embeddings
 * 5. Stores in Supabase
 */

const authenticateUser = async (req, reply) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    reply.code(401).send({ error: "No token provided. Please login." });
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    reply.code(401).send({ error: "Invalid or expired token." });
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
    return { message: "Registration successful! Please check your email for verification.", data };
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
    
    // The 'session' object contains the access_token
    return { 
      message: "Login successful", 
      token: data.session.access_token, 
      user: data.user 
    };
  } catch (error) {
    return reply.code(401).send({ error: "Invalid login credentials" });
  }
});

fastify.post("/ingest", async (req, reply) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return reply.code(401).send({ error: "No token provided" });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return reply.code(401).send({ error: "Unauthorized" });

    const data = await req.file();
    const buffer = await data.toBuffer();

  const rawText = await extractTextFromPDF(buffer);
  const chunks = await chunkText(rawText);

  const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ 
        filename: data.filename, 
        user_id: user.id  // Link this PDF to the logged-in user
      })
      .select().single();

  if (docError) return reply.code(500).send({ error: docError.message });

  // 2. Initialize the limiter (5 parallel requests max)
  const limit = pLimit(5);

  // 3. Wrap your embedding calls with the limiter
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

  if (sectionError) return reply.code(500).send({ error: sectionError.message });

  return { success: true, pdf_id: doc.id };
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
});
/**
 * Endpoint: Chat with PDF
 * 1. Accepts pdf_id and question
 * 2. Embeds question
 * 3. Retrieves context via RPC
 * 4. Generates LLM response
 */
fastify.post("/chat", async (req, reply) => {
  const { pdf_id, question, level } = req.body;
  
  // 1. Authenticate the user
  const user = await authenticateUser(req, reply);
  if (!user) return;

  const numericPdfId = Number(pdf_id);
  const userLevel = level || "Beginner";

  // 2. Embed Query
  const queryVector = await getEmbedding(question);

  // 3. Retrieval via RPC (Now including p_user_id)
  const { data: matchedSections, error: rpcError } = await supabase.rpc(
    "match_document_sections",
    {
      p_query_embedding: queryVector,
      p_match_threshold: 0.1, 
      p_match_count: 5,
      p_filter_pdf_id: numericPdfId,
      p_user_id: user.id // ADD THIS LINE
    }
  );

  if (rpcError) return reply.code(500).send({ error: rpcError.message });

  // 2. FALLBACK: If no relevant context is found, fetch the first 3 chunks of the book
  // This allows the AI to answer "What is this book about?" or "Why read this?"
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

  const context = matchedSections.map(section => section.content);
  const answer = await getChatResponse(question, context, userLevel);

  return { answer, sources: matchedSections.map(s => s.id) };
});

fastify.post("/generate-syllabus", async (req, reply) => {
  const { pdf_id, duration, level } = req.body;

  if (!pdf_id || !duration || !level) {
    return reply.code(400).send({ error: "Missing parameters" });
  }

  // 1. Check if we already have this specific syllabus saved
  const { data: existingSyllabus } = await supabase
    .from("syllabi")
    .select("syllabus_data")
    .eq("document_id", pdf_id)
    .eq("duration", duration)
    .eq("level", level)
    .single();

  if (existingSyllabus) {
    return { ...existingSyllabus.syllabus_data, cached: true };
  }

  // 2. Fetch context if not cached
    const { data: sections } = await supabase
    .from("document_sections")
    .select(`content, documents!inner(filename, user_id)`) // Use !inner to filter by joined table
    .eq("document_id", pdf_id)
    .eq("documents.user_id", user.id) // Security check
    .limit(15);

  if (!sections || sections.length === 0) {
    return reply.code(404).send({ error: "PDF content not found" });
  }

  const filename = sections[0].documents.filename;
  const context = sections.map(s => s.content);

  // 3. Generate via AI
  const syllabusJson = await generateSyllabus(filename, context, duration, level);

  // 4. Store in Supabase for next time
  const { error: insertError } = await supabase
    .from("syllabi")
    .insert({
      document_id: pdf_id,
      syllabus_data: syllabusJson,
      duration: duration,
      level: level
    });

  if (insertError) {
    console.error("Failed to store syllabus:", insertError.message);
  }

  return { ...syllabusJson, cached: false };
});

fastify.get("/list-pdfs", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return; // Stop if not authenticated

  const { data, error } = await supabase
    .from("documents")
    .select("id, filename")
    .eq("user_id", user.id); // Filter only this user's books!

  return data;
});

fastify.get("/my-courses", async (req, reply) => {
  const { data, error } = await supabase
    .from("syllabi")
    .select(`
      id,
      level,
      duration,
      syllabus_data->syllabus_title as title,
      documents ( filename )
    `);

  if (error) return reply.code(500).send({ error: error.message });
  return data;
});

// Server Start
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log("Server running on port http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
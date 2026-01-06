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
import { generateCodingProblem, getProblemById } from "./controllers/problemController.js";
import { generateTopicSyllabus } from "./controllers/topicSyllabusController.js";
import { executeCode, wrapCodeWithTests } from "./controllers/compilerController.js";
import {
  generateSolution,
  provideGuidance,
} from "./controllers/tutorController.js";
import { generateAdaptiveTest, calculateWeightedLevel } from "./controllers/assessmentController.js";
import { upsertProfile, getProfile, getProfileSettings, updateProfileSettings } from "./controllers/profileController.js";
dotenv.config();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const fastify = Fastify({
  logger: true,
});
// await fastify.register(cors, { origin: "*" });
await fastify.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 },
});
await fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
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

fastify.get("/", async (req, reply) => {
  return { "Developer's message": "Vaa Arunachalaom.. Nee varuvanu enakku theriyum.." };
});


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
  const { syllabus_id, question, level } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;

  try {
    // 1. Map syllabus_id to document_id
    const { data: syllabus, error: syllError } = await supabase
      .from("syllabi")
      .select("document_id, syllabus_title")
      .eq("id", syllabus_id)
      .single();

    if (syllError || !syllabus) {
      return reply.code(404).send({ error: "Syllabus not found" });
    }

    const docId = syllabus.document_id;
    const userLevel = level || "Beginner";

    // 2. If it's a PDF-based syllabus, perform vector search
    let context = [];
    let sourceIds = [];

    if (docId) {
      const queryVector = await getEmbedding(question);

      // RPC call to match sections filtered by document_id
      const { data: matchedSections, error: rpcError } = await supabase.rpc(
        "match_document_sections",
        {
          p_query_embedding: queryVector,
          p_match_threshold: 0.1,
          p_match_count: 5,
          p_filter_pdf_id: docId, // Now correctly mapped
          p_user_id: user.id,
        }
      );

      if (rpcError) throw rpcError;

      if (matchedSections && matchedSections.length > 0) {
        context = matchedSections.map((s) => s.content);
        sourceIds = matchedSections.map((s) => s.id);
      } else {
        // Fallback: Just grab the first few sections of the doc if no vector match
        const { data: fallback } = await supabase
          .from("document_sections")
          .select("id, content")
          .eq("document_id", docId)
          .limit(3);
        
        context = fallback?.map(s => s.content) || [];
        sourceIds = fallback?.map(s => s.id) || [];
      }
    }

    // 3. Generate response grounded in the retrieved chunks
    // We pass isSyllabusMode = !!docId (true if we have document context)
    const answer = await getChatResponse(question, context, userLevel, !!docId);

    return { 
      answer, 
      sources: sourceIds,
      course_title: syllabus.syllabus_title 
    };

  } catch (error) {
    console.error("Chat Error:", error.message);
    return reply.code(500).send({ error: "Failed to process chat request" });
  }
});

fastify.post("/chat/syllabus", async (req, reply) => {
  const { syllabus_id, question, level } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;

  try {
    // 1. Fetch Syllabus Metadata
    const { data: syllabus } = await supabase
      .from("syllabi")
      .select("syllabus_title, syllabus_data, duration")
      .eq("id", syllabus_id)
      .single();

    if (!syllabus) return reply.code(404).send({ error: "Syllabus not found" });

    // 2. Fetch all generated Problems for this syllabus to act as "Course Content"
    const { data: problems } = await supabase
      .from("coding_problems")
      .select("title, description, concept")
      .eq("syllabus_id", syllabus_id);

    // 3. Construct the Virtual Context
    const syllabusContext = `
      Course Title: ${syllabus.syllabus_title}
      Syllabus Duration: ${syllabus.duration}
      Curriculum Structure: ${JSON.stringify(syllabus.syllabus_data)}
    `;

    const problemContext = problems?.map(p => 
      `Topic: ${p.concept}\nProblem: ${p.title}\nDescription: ${p.description}`
    ).join("\n\n") || "";

    const combinedContext = [syllabusContext, problemContext];

    // 4. Generate grounded response
    const answer = await getChatResponse(question, combinedContext, level || "Beginner", true);

    return { answer };
  } catch (error) {
    console.error("Syllabus Chat Error:", error.message);
    return reply.code(500).send({ error: "Failed to process chat" });
  }
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
    //   
    if (error) {
    return reply.code(500).send({ error: error.message });
  }
  return data;
});

fastify.post("/generate-problem", async (req, reply) => {
  const { syllabus_id, week_number, concept, level } = req.body;
  
  // 1. Authenticate User
  const user = await authenticateUser(req, reply);
  if (!user) return;
  try {
    // 2. Fetch User Preferences (Used for language/persona context)
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_language, persona")
      .eq("id", user.id)
      .single();
      // 3. Cache Check (Avoid re-generating if it exists)
    // const { data: existingProblem } = await supabase
    //   .from("coding_problems")
    //   .select("*")
    //   .eq("syllabus_id", syllabus_id)
    //   .eq("week_number", week_number)
    //   .eq("concept", concept)
    //   .single();
    //   if (existingProblem) return { ...existingProblem, cached: true };
    // 4. Get Syllabus & Document Context
    const { data: syllabus } = await supabase
      .from("syllabi")
      .select("document_id, level")
      .eq("id", syllabus_id)
      .single();
      if (!syllabus) return reply.code(404).send({ error: "Syllabus not found" });
    let context = [];
    if (syllabus.document_id) {
      const { data: sections } = await supabase
        .from("document_sections")
        .select("content")
        .eq("document_id", syllabus.document_id)
        .limit(8);
      if (sections) context = sections.map((s) => s.content);
    }
    // 5. Generate with User Prefs (Triggers the Repair Loop internally)
    const problemJson = await generateCodingProblem(
      context,
      level || syllabus.level,
      week_number,
      concept,
      profile
    );
    // 6. Handle Critical Failures (If even the Repair AI failed)
    if (problemJson.error) {
      console.error("AI Generation & Repair both failed:", problemJson.details);
      return reply.code(422).send({ 
        error: "Problem Generation Failed", 
        message: "The AI was unable to produce a valid structure after multiple attempts.",
        details: problemJson.details 
      });
    }
    // 7. Final Validation: Ensure required fields exist before saving
    if (!problemJson.title || !problemJson.description) {
      return reply.code(500).send({ error: "Incomplete data generated by AI" });
    }
    // 8. Save to Supabase
    const { data: savedProblem, error: saveError } = await supabase
      .from("coding_problems")
      .insert({
        user_id: user.id,
        syllabus_id,
        document_id: syllabus.document_id,
        week_number,
        concept,
        title: problemJson.title,
        description: problemJson.description,
        difficulty: problemJson.difficulty || level || syllabus.level,
        topics: problemJson.topics || [concept],
        constraints: problemJson.constraints || [],
        examples: problemJson.examples || [],
        hidden_test_cases: problemJson.hidden_test_cases || [],
        starter_code: problemJson.starter_code || ""
      })
      .select()
      .single();
      if (saveError) {
      console.error("Database Save Error:", saveError.message);
      return reply.code(500).send({ error: saveError.message });
    }
    return { ...savedProblem, cached: false };
  } catch (err) {
    console.error("Route Crash:", err.message);
    return reply.code(500).send({ error: "Internal Server Error during generation" });
  }
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

fastify.post("/compile/submit", async (req, reply) => {
  const { problem_id, language, source_code } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;
  // 1. Fetch the problem data
  const { data: problem, error: dbError } = await supabase
    .from("coding_problems")
    .select("hidden_test_cases, starter_code")
    .eq("id", problem_id)
    .single();
    if (dbError || !problem) {
    return reply.code(404).send({ error: "Problem not found in database." });
  }
  // 2. SAFE Function Name Detection
  // Using (problem.starter_code || "") ensures we never call .match on null
  const starter = problem.starter_code || "";
  const nameMatch = starter.match(/(?:def|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  
  // Fallback to 'solution' if the regex finds nothing
  const functionName = nameMatch ? nameMatch[1] : "solution";
  // 3. Ensure test cases exist and are an array
  const testCases = Array.isArray(problem.hidden_test_cases) 
    ? problem.hidden_test_cases 
    : [];
    if (testCases.length === 0) {
    return reply.code(400).send({ error: "No test cases found for this problem." });
  }
  // 4. Wrap and Execute
  const wrappedCode = wrapCodeWithTests(language, source_code, testCases, functionName);
  const result = await executeCode(language, "*", wrappedCode);
  if (!result.success) {
    return reply.code(500).send({ error: "Execution Error", details: result.error });
  }
  try {
    // 5. Parse the test runner's JSON output
    const testResults = JSON.parse(result.stdout.trim());
    const allPassed = testResults.every(r => r.passed);
    return {
      success: allPassed,
      passed_count: testResults.filter(r => r.passed).length,
      total_cases: testResults.length,
      results: testResults
    };
  } catch (e) {
    // If JSON.parse fails, it's likely a SyntaxError in the user's code 
    // that the Piston runner caught as stdout/stderr
    return reply.code(400).send({ 
      error: "Runtime Error", 
      details: result.stderr || result.stdout 
    });
  }
});

fastify.get("/problems", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { syllabus_id } = req.query;
  try {
    let query = supabase
      .from("coding_problems")
      .select("id, syllabus_id, week_number, concept, title, difficulty, created_at")
      .order("created_at", { ascending: false });
      // Optional filter if user provides ?syllabus_id=X
    if (syllabus_id) {
      query = query.eq("syllabus_id", syllabus_id);
    }
    const { data: problems, error } = await query;
    if (error) throw error;
    return problems;
  } catch (error) {
    console.error("Fetch Problems Error:", error.message);
    return reply.code(500).send({ error: "Failed to fetch problem list" });
  }
});

fastify.delete("/problems/:id", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { id } = req.params;
  try {
    const { error, count } = await supabase
      .from("coding_problems")
      .delete()
      .eq("id", id)
      // Safety: Only let the user delete their own problems if your logic requires it,
      // otherwise remove the .eq("user_id", user.id) line.
      .select(); 
      if (error) throw error;
    return { 
      message: "Problem deleted successfully", 
      deleted_id: id 
    };
  } catch (error) {
    console.error("Delete Problem Error:", error.message);
    return reply.code(500).send({ error: "Failed to delete problem" });
  }
});

fastify.post("/problem/solution", async (req, reply) => {
  const { problem_id } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user) return;
  try {
    // 1. Fetch Problem Details AND check for existing solution
    const { data: problem, error: probError } = await supabase
      .from("coding_problems")
      .select("title, description, solution_data")
      .eq("id", problem_id)
      .single();
      if (probError || !problem) return reply.code(404).send({ error: "Problem not found" });
    // 2. CACHE CHECK: If solution already exists in DB, return it!
    if (problem.solution_data) {
      return {
        problem_id,
        cached: true,
        ...problem.solution_data
      };
    }
    // 3. Fetch User's Preferred Language for the generation
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_language")
      .eq("id", user.id)
      .single();
      const language = profile?.default_language || "javascript";
    // 4. Generate Solution via AI
    const solution = await generateSolution(problem, language);
    // 5. SAVE TO DB: Update the problem record with the new solution
    const { error: updateError } = await supabase
      .from("coding_problems")
      .update({ solution_data: { language, ...solution } })
      .eq("id", problem_id);
      if (updateError) console.error("Failed to cache solution:", updateError.message);
    return {
      problem_id,
      language,
      cached: false,
      ...solution
    };
  } catch (error) {
    console.error("Solution Generation Error:", error.message);
    return reply.code(500).send({ error: "Failed to generate solution" });
  }
});

fastify.post("/problem/guide", async (req, reply) => {
  const { problem_details, user_query, user_code } = req.body;
  const user = await authenticateUser(req, reply);
  if (!user || !problem_details) return reply.code(400).send({ error: "Missing data" });
  try {
    // We pass user.id so the controller can fetch their specific Socratic level
    const hint = await provideGuidance(
      user.id, 
      problem_details,
      user_query,
      user_code || "none"
    );
    return hint;
  } catch (e) {
    return reply.code(500).send({ error: "Failed to generate guidance" });
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
  const { answers } = req.body; 
  const user = await authenticateUser(req, reply);
  if (!user) return;
  // 1. Calculate Weighted Assessment
  const assessment = calculateWeightedLevel(answers);
  
  // Clean up the precision for the response and database
  const finalScore = Number(assessment.score.toFixed(2));
  try {
    // 2. Update the Profile Table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        current_level: assessment.level,
        level_name: assessment.name,
        last_assessed_at: new Date().toISOString() // Ensure ISO string format
      })
      .eq("id", user.id);
      if (profileError) throw profileError;
    // 3. Log the historical test
    await supabase.from("proficiency_tests").insert({
      user_id: user.id,
      score: finalScore,
      assigned_level: assessment.level,
      answers_json: answers
    });
    // 4. Clean JSON response
    return { 
      message: `Assessment complete! You scored ${finalScore} and reached: ${assessment.name}`, 
      level: assessment.level,
      name: assessment.name,
      score: finalScore 
    };
  } catch (err) {
    console.error("Assessment Save Error:", err.message);
    return reply.code(500).send({ error: "Failed to update profile rank." });
  }
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
// server.js
// // GET current settings

fastify.get("/profile/settings", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  try {
    const settings = await getProfileSettings(user.id);
    return settings;
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
});
// POST update settings

fastify.post("/profile/settings", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { default_language, socratic_level, editor_config } = req.body;
  try {
    const updatedSettings = await updateProfileSettings(user.id, {
      default_language,
      socratic_level,
      editor_config
    });
    return { 
      message: "Settings updated successfully", 
      settings: updatedSettings 
    };
  } catch (error) {
    return reply.code(400).send({ error: error.message });
  }
});

fastify.get("/problems/:id", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { id } = req.params;
  try {
    const { data: problem, error: dbError } = await supabase
      .from("coding_problems")
      .select("*")
      .eq("id", id)
      .single();
      if (dbError) {
      // LOG THIS TO YOUR TERMINAL TO SEE THE ACTUAL ISSUE
      console.error("Supabase Error:", dbError);
      return reply.code(400).send({ error: dbError.message });
    }
    if (!problem) {
      return reply.code(404).send({ error: "Problem not found" });
    }
    return problem;
  } catch (error) {
    console.error("Server Crash:", error.message);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
});

fastify.delete("/syllabus/:id", async (req, reply) => {
  const user = await authenticateUser(req, reply);
  if (!user) return;
  const { id } = req.params;
  try {
    const { data: syllabus, error: fetchError } = await supabase
      .from("syllabi")
      .select("id")
      .eq("id", id)
      .single();
      if (fetchError || !syllabus) {
      return reply.code(404).send({ error: "Syllabus not found" });
    }
    const { error: deleteError } = await supabase
      .from("syllabi")
      .delete()
      .eq("id", id);
      if (deleteError) {
      throw deleteError;
    }
    return { 
      message: "Syllabus and associated data deleted successfully", 
      syllabus_id: id 
    };
  } catch (error) {
    console.error("Delete Syllabus Error:", error.message);
    if (error.code === '23503') {
      return reply.code(400).send({ 
        error: "Cannot delete syllabus: It has active coding problems. Delete them first or enable CASCADE delete." 
      });
    }
    return reply.code(500).send({ error: "Failed to delete syllabus" });
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

import { InferenceClient } from "@huggingface/inference";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


const robustSanitize = (raw) => {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/```json|```/g, "").trim();
  
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return cleaned;
  cleaned = cleaned.substring(start, end + 1);

  return cleaned.replace(/"([^"]*)"/g, (match) => {
    return match.replace(/\n/g, "\\n");
  });
};

export async function generateSolution(problem, language = "javascript") {
  const systemPrompt = `  
You are a Senior Software Engineer. 
Task: Provide a structured JSON solution.
STRICT RULE: Use \\n for all newlines in the "approach" and "code" fields. Do NOT use physical line breaks.

JSON SCHEMA:
{
  "approach": "Step-by-step logic",
  "code": "The full code implementation",
  "complexity": { "time": "O(?)", "space": "O(?)" }
}
`;

  try {
    const response = await hf.chatCompletion({
      model: "google/gemma-2-2b-it",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Problem: ${problem.title}\nDescription: ${problem.description}\nLanguage: ${language}` }
      ],
      max_tokens: 1200,
      temperature: 0.1, // Low temperature for structural stability
    });

    const rawContent = response.choices[0].message.content;
    const sanitized = robustSanitize(rawContent);

    return JSON.parse(sanitized);
  } catch (error) {
    console.error("Sanitization/Parse Failed:", error.message);
    throw new Error("MALFORMED_JSON_RESPONSE");
  }
}

/**
 * Controller 2: Provides JSON guidance based on problem, user code, and Socratic Level.
 */
export async function provideGuidance(userId, problemDetails, userQuery, userCode = "none") {
  // 1. Fetch user's Socratic preference from the database
  const { data: profile } = await supabase
    .from("profiles")
    .select("socratic_level")
    .eq("id", userId)
    .single();

  const level = profile?.socratic_level || 3;

  // 2. Define strictness based on the 1-5 scale
  const strictnessMap = {
    1: "Be very direct. You can provide code snippets and clear answers.",
    2: "Provide explanations and small code hints, but encourage them to write the core logic.",
    3: "Balanced. Explain concepts and give pseudo-code. Do not give the full solution.",
    4: "Strict Socratic. Only provide conceptual guidance and point out logical flaws. No code snippets.",
    5: "Extreme Socratic. Only ask questions that lead the student to the answer. Never provide direct hints or code."
  };

  const systemPrompt = `
You are an AI Socratic Tutor. 
STRICTNESS LEVEL: ${level} of 5.
INSTRUCTION: ${strictnessMap[level]}
Task: Guide the student through the coding problem. 
If user_code is provided, analyze it for logical errors without fixing them directly.
OUTPUT: Return ONLY a raw JSON object.

JSON SCHEMA:
{
  "hint_title": "Short title for the hint",
  "conceptual_guidance": "Concept explanation based on strictness level",
  "code_feedback": "Analysis of their attempt",
  "leading_question": "A question to help them reach the solution themselves"
}
`;

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `Problem: ${problemDetails.title}\nUser Query: ${userQuery}\nUser Code: ${userCode}` 
      }
    ],
    max_tokens: 800,
    temperature: 0.4,
  });

  return JSON.parse(response.choices[0].message.content.trim().replace(/```json|```/g, ""));
}
import { InferenceClient } from "@huggingface/inference";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

/**
 * Sanitizes physical newlines inside quoted strings.
 */
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

/**
 * REPAIR CONTROLLER: Asks the AI to fix malformed JSON based on the error message.
 */
async function repairJson(malformedString, errorMessage) {
  const repairPrompt = `
You are a JSON Repair Assistant. 
The following string failed to parse:
ERROR: ${errorMessage}

TASK: Fix syntax errors (unescaped quotes, missing commas, raw newlines). 
Return ONLY the corrected raw JSON object.

MALFORMED STRING:
${malformedString}
`;

  try {
    const response = await hf.chatCompletion({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [{ role: "system", content: repairPrompt }],
      max_tokens: 1500,
      temperature: 0.1,
    });
    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error("Repair AI pass failed:", e.message);
    return malformedString;
  }
}

/**
 * MAIN CONTROLLER: Generates problem with built-in self-correction.
 */
export async function generateCodingProblem(contextChunks, level, week, concept, userPrefs) {
  const preferredLang = userPrefs?.default_language || "javascript";
  
  const systemPrompt = `
You are a Senior Technical Interview Engineer.
Task: Create ONE LeetCode-style coding problem in valid JSON.

JSON TEMPLATE:
{
  "title": "Problem Title",
  "description": "Clear story-like problem statement",
  "difficulty": "${level}",
  "topics": ["${concept}"],
  "constraints": ["Constraint 1"],
  "examples": [{ "input": "in", "output": "out", "explanation": "why" }],
  "hidden_test_cases": [{ "input": "hin", "output": "hout" }],
  "starter_code": "function solution(n) {\\n  // code here\\n}"
}

CRITICAL: Return ONLY JSON. Use \\n for newlines in strings.
`;

  try {
    // --- ATTEMPT 1: Initial Generation ---
    const response = await hf.chatCompletion({
      model: "google/gemma-2-2b-it",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a ${level} problem for ${concept} in ${preferredLang}.` }
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    let rawContent = response.choices[0].message.content;
    let sanitized = robustSanitize(rawContent);

    try {
      const problem = JSON.parse(sanitized);
      return finalizeProblem(problem, concept, level);
    } catch (parseError) {
      console.warn("Attempt 1 Parse Failed. Triggering Repair AI...");

      // --- ATTEMPT 2: Repair Pass ---
      const repairedRaw = await repairJson(sanitized, parseError.message);
      const reSanitized = robustSanitize(repairedRaw);

      try {
        const repairedProblem = JSON.parse(reSanitized);
        console.log("Repair successful!");
        return finalizeProblem(repairedProblem, concept, level);
      } catch (secondError) {
        console.error("Repair pass also failed.");
        return { error: "JSON_PARSE_ERROR", message: secondError.message, details: reSanitized };
      }
    }
  } catch (hfError) {
    return { error: "HF_API_ERROR", message: hfError.message };
  }
}

/**
 * Helper to ensure the object has all required fields before returning.
 */
function finalizeProblem(problem, concept, level) {
  return {
    id: uuidv4(),
    title: problem.title || "Untitled Problem",
    description: problem.description || "No description provided.",
    difficulty: problem.difficulty || level,
    topics: problem.topics || [concept],
    constraints: problem.constraints || [],
    examples: problem.examples || [],
    hidden_test_cases: problem.hidden_test_cases || [],
    starter_code: problem.starter_code || ""
  };
}
export async function getProblemById(problemId) {
  const { data, error } = await supabase
    .from("coding_problems")
    .select("*")
    .eq("id", problemId)
    .single();

  if (error) throw error;
  return data;
}
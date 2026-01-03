import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

// Helper for waiting between retries
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * AI Inference with Exponential Backoff to handle 504 Timeouts
 */
async function callAiWithRetry(payload, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await hf.chatCompletion(payload);
    } catch (error) {
      const isTimeout = error.message.includes("504") || error.message.includes("timeout");
      if (isTimeout && i < retries - 1) {
        console.warn(`HF Provider Timeout. Retrying attempt ${i + 2}...`);
        await sleep(3000 * (i + 1)); 
        continue;
      }
      throw error;
    }
  }
}

/**
 * REPAIR CONTROLLER: Specifically handles syllabus JSON syntax issues
 */
async function repairSyllabusJson(malformedString, errorMessage) {
  const repairPrompt = `
You are a JSON Repair Assistant. 
The following syllabus JSON failed to parse:
ERROR: ${errorMessage}

TASK: Fix syntax errors (unescaped quotes, missing commas, raw newlines). 
Return ONLY the corrected raw JSON object.

MALFORMED STRING:
${malformedString}
`;

  try {
    const response = await callAiWithRetry({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [{ role: "system", content: repairPrompt }],
      max_tokens: 2000,
      temperature: 0.1,
    });
    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error("Syllabus Repair AI pass failed:", e.message);
    return malformedString;
  }
}

/**
 * MAIN CONTROLLER: Generates a topic-based syllabus with self-correction
 */
export async function generateTopicSyllabus(topic, duration, level) {
  const systemPrompt = `
You are a Professional Academic Architect.
Task: Design a complete study syllabus.
STRICT RULE: Return ONLY a raw JSON object. Use \\n for newlines.

JSON SCHEMA:
{
  "syllabus_title": "Course on ${topic}",
  "target_audience": "${level}",
  "prerequisites": ["Skill 1"],
  "weeks": [
    {
      "week_number": 1,
      "theme": "Introduction",
      "learning_objectives": ["obj1"],
      "key_concepts": ["concept1"],
      "activities": ["Activity 1"]
    }
  ]
}
`;

  try {
    // --- ATTEMPT 1: Initial Generation ---
    const response = await callAiWithRetry({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a ${duration} syllabus for ${topic} at ${level} level.` }
      ],
      max_tokens: 2000,
      temperature: 0.2,
    });

    let rawContent = response.choices[0].message.content.trim();
    let sanitized = robustSanitize(rawContent);

    try {
      const syllabus = JSON.parse(sanitized);
      return finalizeSyllabus(syllabus, topic, level);
    } catch (parseErr) {
      console.warn("Syllabus Attempt 1 Failed. Triggering Repair...");

      // --- ATTEMPT 2: Repair Pass ---
      const repairedRaw = await repairSyllabusJson(sanitized, parseErr.message);
      const reSanitized = robustSanitize(repairedRaw);

      try {
        const repairedSyllabus = JSON.parse(reSanitized);
        console.log("Syllabus Repair successful!");
        return finalizeSyllabus(repairedSyllabus, topic, level);
      } catch (secondError) {
        console.error("Critical Syllabus Failure: Repair pass also failed.");
        return { 
          error: "JSON_PARSE_ERROR", 
          message: secondError.message, 
          raw: reSanitized 
        };
      }
    }
  } catch (error) {
    console.error("Critical AI Failure in Syllabus Generation:", error.message);
    return { error: "AI_PROVIDER_ERROR", message: error.message };
  }
}

/**
 * Helper to ensure the syllabus has a valid structure even if AI misses a field
 */
function finalizeSyllabus(syllabus, topic, level) {
  return {
    syllabus_title: syllabus.syllabus_title || `Course on ${topic}`,
    target_audience: syllabus.target_audience || level,
    prerequisites: syllabus.prerequisites || [],
    weeks: syllabus.weeks || []
  };
}
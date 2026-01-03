import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

/**
 * Sanitizes physical newlines inside quoted strings and extracts JSON.
 */
const robustSanitize = (raw) => {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/```json|```/g, "").trim();
  
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return cleaned;
  cleaned = cleaned.substring(start, end + 1);

  // Replaces actual Enters inside quotes with \n
  return cleaned.replace(/"([^"]*)"/g, (match) => {
    return match.replace(/\n/g, "\\n");
  });
};

/**
 * REPAIR CONTROLLER: Specifically for Syllabus structure.
 */
async function repairSyllabusJson(malformedString, errorMessage) {
  const repairPrompt = `
You are a JSON Repair Assistant. 
The following syllabus JSON string failed to parse.
ERROR: ${errorMessage}

TASK: Fix the syntax errors while maintaining the week-by-week structure.
Return ONLY the corrected raw JSON object.

MALFORMED STRING:
${malformedString}
`;

  try {
    const response = await hf.chatCompletion({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [{ role: "system", content: repairPrompt }],
      max_tokens: 2000, // Syllabus is larger, needs more tokens
      temperature: 0.1,
    });
    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error("Syllabus Repair AI pass failed:", e.message);
    return malformedString;
  }
}

/**
 * MAIN CONTROLLER: Generates syllabus with built-in self-correction.
 */
export async function generateSyllabus(filename, contextChunks, duration, level) {
  const systemPrompt = `
You are an expert Academic Curriculum Designer. 
Task: Create a structured study syllabus in valid JSON.

SCHEMA:
{
  "syllabus_title": "Course Name",
  "target_audience": "${level}",
  "prerequisites": ["Knowledge"],
  "weeks": [
    {
      "week_number": 1,
      "theme": "Title",
      "learning_objectives": ["obj1"],
      "key_concepts": ["concept1"],
      "activities": ["Task 1"]
    }
  ]
}

CRITICAL: Return ONLY JSON. Use \\n for newlines in strings. No prose.
`;

  const contextBlock = contextChunks.join("\n\n---\n\n");

  try {
    // --- ATTEMPT 1: Initial Generation ---
    const response = await hf.chatCompletion({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Context:\n${contextBlock}\n\nGenerate a ${duration} syllabus for a ${level} level.` }
      ],
      max_tokens: 2000,
      temperature: 0.2,
    });

    let rawContent = response.choices[0].message.content.trim();
    let sanitized = robustSanitize(rawContent);

    try {
      return JSON.parse(sanitized);
    } catch (parseError) {
      console.warn("Syllabus Attempt 1 Parse Failed. Triggering Repair AI...");

      // --- ATTEMPT 2: Repair Pass ---
      const repairedRaw = await repairSyllabusJson(sanitized, parseError.message);
      const reSanitized = robustSanitize(repairedRaw);

      try {
        const repairedSyllabus = JSON.parse(reSanitized);
        console.log("Syllabus Repair successful!");
        return repairedSyllabus;
      } catch (secondError) {
        console.error("Syllabus Repair pass also failed.");
        return { 
          error: "JSON_PARSE_ERROR", 
          message: secondError.message, 
          raw: reSanitized 
        };
      }
    }
  } catch (hfError) {
    console.error("HF_API_ERROR during Syllabus generation:", hfError.message);
    return { error: "HF_API_ERROR", message: hfError.message };
  }
}
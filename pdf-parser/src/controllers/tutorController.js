import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

/**
 * Controller 1: Generates a structured JSON solution.
 */
export async function generateSolution(problemDetails, language = "javascript") {
  const systemPrompt = `
You are a Senior Software Engineer. 
Task: Provide a structured JSON solution for the given problem.
OUTPUT: Return ONLY a raw JSON object. No prose.

JSON SCHEMA:
{
  "approach": "Step-by-step logic explanation",
  "code": "The full code implementation",
  "complexity": {
    "time": "O(?)",
    "space": "O(?)"
  }
}
`;

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Problem: ${problemDetails.title}\nDescription: ${problemDetails.description}\nLanguage: ${language}` }
    ],
    max_tokens: 1200,
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content.trim().replace(/```json|```/g, ""));
}

/**
 * Controller 2: Provides JSON guidance based on problem and user code.
 */
export async function provideGuidance(problemDetails, userQuery, userCode = "none") {
  const systemPrompt = `
You are an AI Socratic Tutor. 
Task: Guide the student without giving the code. 
If user_code is provided, analyze it for logical errors.
OUTPUT: Return ONLY a raw JSON object.

JSON SCHEMA:
{
  "hint_title": "Short title for the hint",
  "conceptual_guidance": "Explain the concept they are missing",
  "code_feedback": "Specific feedback on their code attempt (if provided), otherwise 'Start by defining the function'",
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
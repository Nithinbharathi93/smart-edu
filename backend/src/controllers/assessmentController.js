import { InferenceClient } from "@huggingface/inference";
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);
// src/controllers/assessmentController.js

export async function generateAdaptiveTest(topic = "General Programming & Computer Science") {
  const systemPrompt = `
    You are a Technical Assessment Architect.
Task: Generate exactly 15 Multiple Choice Questions on "${topic}".

STRICT PROGRESSION:
- Questions 1-5: Beginner (Basic syntax, definitions)
- Questions 6-10: Intermediate (Logic, debugging, loops)
- Questions 11-15: Advanced (Architecture, optimization, "Final Boss" logic)

JSON SCHEMA:
[
  { 
    "q": "Question text", 
    "options": ["Op1", "Op2", "Op3", "Op4"], 
    "correct": 0, 
    "difficulty": 1 
  }
]

RULES:
1. Return ONLY the JSON array.
2. Ensure "correct" is the index (0-3) of the right option.
3. Scale difficulty from 1 (Baby) to 10 (Boss).
  `;
  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [{ role: "system", content: systemPrompt }],
    max_tokens: 2500,
    temperature: 0.4
  });
  return JSON.parse(response.choices[0].message.content.trim().replace(/```json|```/g, ""));
}

/**
 * Weighted Scoring Logic:
 * Confidence is a decimal from 0.25 to 1.0
 */
export function calculateWeightedLevel(answers) {
  let totalScore = 0;

  answers.forEach(ans => {
    const { isCorrect, confidence, isDontKnow } = ans;
    
    if (isDontKnow) {
      totalScore += 0; // No penalty for admitting ignorance
    } else if (isCorrect) {
      // Reward correct answers scaled by how sure they were
      totalScore += 1 * confidence; 
    } else {
      // Penalize wrong answers scaled by confidence (Confidently wrong = heavy penalty)
      totalScore -= 0.75 * confidence;
    }
  });

  // Clamp score to positive only for level calculation
  const finalScore = Math.max(0, totalScore);

  if (finalScore <= 2) return { level: 1, name: "Novice", score: finalScore };
  if (finalScore <= 5) return { level: 2, name: "Advanced Beginner", score: finalScore };
  if (finalScore <= 8) return { level: 3, name: "Competent", score: finalScore };
  if (finalScore <= 11) return { level: 4, name: "Proficient", score: finalScore };
  if (finalScore <= 13) return { level: 5, name: "Expert", score: finalScore };
  return { level: 6, name: "Master", score: finalScore };
}
import { InferenceClient } from "@huggingface/inference";
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

export async function generateAdaptiveTest(topic = "General Programming & Computer Science") {
  const systemPrompt = `
    Generate 15 Multiple Choice Questions for a proficiency test.
    The questions must scale linearly from "Baby Level" (Basic syntax) to "Final Boss Level" (Architecture/Optimization).
    
    JSON FORMAT ONLY:
    [
      { "q": "Question text", "options": ["A", "B", "C", "D"], "correct": 0, "difficulty": 1 }
    ]
  `;
  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [{ role: "system", content: systemPrompt }],
    max_tokens: 2500,
    temperature: 0.4
  });
  return JSON.parse(response.choices[0].message.content.trim().replace(/```json|```/g, ""));
}

export function calculateLevel(score) {
  if (score <= 2) return { level: 1, name: "Novice" };
  if (score <= 5) return { level: 2, name: "Advanced Beginner" };
  if (score <= 8) return { level: 3, name: "Competent" };
  if (score <= 11) return { level: 4, name: "Proficient" };
  if (score <= 13) return { level: 5, name: "Expert" };
  return { level: 6, name: "Master" };
}
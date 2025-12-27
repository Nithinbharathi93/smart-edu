import { hf, geminiModel } from "../config/aiConfig.js";

// Helper for HF Errors
const handleHfRequest = async (apiCall, res) => {
  try {
    const result = await apiCall();
    res.json(result);
  } catch (error) {
    console.error("AI Service Error:", error.message);
    res.status(500).json({ error: "Service Error", details: error.message });
  }
};


export const getCodeComments = async (req, res) => {
  const { code, questionTitle, sampleTestCase } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: "Field 'code' is required." });
  }

  const apiCall = async () => {
    let systemPrompt = `You are a coding mentor. Analyze the provided code and return a JSON response with this exact structure:
{
  "overallFeedback": "One sentence overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "hints": ["hint 1", "hint 2", "hint 3"],
  "edgeCases": ["edge case 1", "edge case 2"]
}

Provide constructive feedback without rewriting code. Be specific and educational.`;
    let userContent = code;

    if (questionTitle) {
      systemPrompt += `\n\nProblem: ${questionTitle}`;
    }

    if (sampleTestCase) {
      userContent += `\n\nSample Test Case:\n${sampleTestCase}`;
    }

    const response = await hf.chatCompletion({
      model: "google/gemma-2-2b-it",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      max_tokens: 1500
    });

    let feedbackData;
    try {
      const responseText = response.choices[0].message.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedbackData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      feedbackData = {
        overallFeedback: "Analysis completed",
        strengths: [],
        improvements: [response.choices[0].message.content],
        hints: [],
        edgeCases: []
      };
    }

    return {
      success: true,
      data: {
        questionTitle: questionTitle || "Coding Problem",
        overallFeedback: feedbackData.overallFeedback || "Code analysis completed",
        strengths: feedbackData.strengths || [],
        improvements: feedbackData.improvements || [],
        hints: feedbackData.hints || [],
        edgeCases: feedbackData.edgeCases || []
      }
    };
  };
  handleHfRequest(apiCall, res);
};

export const getBigOAnalysis = async (req, res) => {
  const { code } = req.body;
  const apiCall = async () => {
    const response = await hf.chatCompletion({
      model: "google/gemma-2-2b-it",
      messages: [
        { role: "system", content: "Output ONLY a raw JSON object with key 'big-o'. Example: {\"big-o\": \"O(n)\"}" },
        { role: "user", content: code }
      ],
      max_tokens: 100
    });
    let raw = response.choices[0].message.content.trim().replace(/```json|```/g, "").trim();
    try { return JSON.parse(raw); } catch (e) { return { "big-o": raw }; }
  };
  handleHfRequest(apiCall, res);
};

export const checkSafety = async (req, res) => {
  const { message } = req.body;
  const apiCall = async () => {
    const prompt = `You are a moderator. Is this text SAFE or UNSAFE? Text: "${message}"\nAnswer:`;
    const response = await hf.textGeneration({
      model: "google/shieldgemma-2b",
      inputs: prompt,
      parameters: { max_new_tokens: 5, return_full_text: false }
    });
    return { safetyStatus: response.generated_text.trim() };
  };
  handleHfRequest(apiCall, res);
};

export const generateSyllabus = async (req, res) => {
  const { topics, level, duration } = req.body;
  try {
    const prompt = `Create a structured ${duration} syllabus for ${topics} for a ${level} level coder. Output JSON only.`;
    const result = await geminiModel.generateContent(prompt);
    const cleanJson = result.response.text().replace(/```json|```/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    res.status(500).json({ error: "Failed to generate syllabus" });
  }
};

export const generateQuestions = async (req, res) => {
    const { topic, difficulty, count } = req.body;
    try {
        const prompt = `Generate ${count} LeetCode-style problems for ${topic} (${difficulty}). Output JSON Array only.`;
        const result = await geminiModel.generateContent(prompt);
        const cleanJson = result.response.text().replace(/```json|```/g, "").trim();
        res.json({ problems: JSON.parse(cleanJson) });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate questions" });
    }
};
export const assessUserLevel = async (req, res) => {
  const { topic, quizAnswers } = req.body; 

  try {
    const prompt = `
      Act as a senior technical interviewer.
      The user took a quiz on ${topic}.
      Their answers: ${JSON.stringify(quizAnswers)}.
      Determine their skill level (Beginner, Intermediate, Advanced) and give a 1-sentence reason.
      Return JSON ONLY: { "level": "Intermediate", "reasoning": "Good grasp of closures but missed event loop." }
    `;
    
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    res.json(JSON.parse(text)); 
  } catch (error) {
    console.error("Assessment Error:", error);
    res.status(500).json({ error: "Assessment failed" });
  }
};
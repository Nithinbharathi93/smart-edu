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
    let systemPrompt = `You are a coding mentor. Analyze the provided code and return ONLY a valid JSON response with this EXACT structure:
{
  "overallFeedback": "One sentence overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "hints": ["hint 1", "hint 2"],
  "edgeCases": ["edge case 1", "edge case 2"]
}

CRITICAL RULES:
1. Output ONLY valid JSON, no markdown formatting (no \`\`\`).
2. All arrays must have at least 1 item.
3. All strings must be clear and constructive.
4. Do NOT include code rewrites in the feedback.`;

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

    // Parse AI response
    let rawText = response.choices[0].message.content;
    const clean = rawText.replace(/```json|```/g, "").trim();
    
    let feedbackData;
    try {
      // Try direct parse first
      feedbackData = JSON.parse(clean);
    } catch (parseErr) {
      // Try regex extraction
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          feedbackData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error("Failed to parse feedback JSON");
        }
      } else {
        throw new Error("No JSON found in response");
      }
    }

    // Validate and normalize the response
    const normalizedFeedback = {
      overallFeedback: feedbackData.overallFeedback?.trim() || "Code analysis completed.",
      strengths: Array.isArray(feedbackData.strengths) 
        ? feedbackData.strengths.filter(s => s && typeof s === 'string').map(s => s.trim())
        : ["Code structure is functional"],
      improvements: Array.isArray(feedbackData.improvements) 
        ? feedbackData.improvements.filter(i => i && typeof i === 'string').map(i => i.trim())
        : ["Consider optimizing for edge cases"],
      hints: Array.isArray(feedbackData.hints) 
        ? feedbackData.hints.filter(h => h && typeof h === 'string').map(h => h.trim())
        : ["Review your algorithm logic"],
      edgeCases: Array.isArray(feedbackData.edgeCases) 
        ? feedbackData.edgeCases.filter(e => e && typeof e === 'string').map(e => e.trim())
        : ["Consider boundary conditions"]
    };

    // Ensure all arrays have at least one element
    if (normalizedFeedback.strengths.length === 0) {
      normalizedFeedback.strengths = ["Code demonstrates understanding"];
    }
    if (normalizedFeedback.improvements.length === 0) {
      normalizedFeedback.improvements = ["Consider refactoring for clarity"];
    }
    if (normalizedFeedback.hints.length === 0) {
      normalizedFeedback.hints = ["Review the problem constraints"];
    }
    if (normalizedFeedback.edgeCases.length === 0) {
      normalizedFeedback.edgeCases = ["Test with empty or null inputs"];
    }

    return normalizedFeedback;
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
// Ensure you have these imported in your file
// import { hf, handleHfRequest } from './your-config-file.js'; 

export const generateSyllabus = async (req, res) => {
  const { topics, level, duration } = req.body;

  const apiCall = async () => {
    // 1. Define the schema clearly for the smaller model
    const jsonSchema = `
    {
      "syllabus_title": "Course Name",
      "target_audience": "Beginner/Intermediate/Advanced",
      "prerequisites": ["item1", "item2"],
      "weeks": [
        {
          "week_number": 1,
          "theme": "Week Title",
          "learning_objectives": ["obj1", "obj2"],
          "key_concepts": ["concept1", "concept2"],
          "activities": ["lab1", "quiz1"]
        }
      ]
    }`;

    // 2. Call Hugging Face
    const response = await hf.chatCompletion({
      model: "google/gemma-2-2b-it",
      messages: [
        { 
          role: "system", 
          content: `Act as a Technical Curriculum Developer. 
          Create a detailed ${duration} syllabus for learning "${topics}" at a "${level}" level.
          
          CRITICAL RULES:
          1. Output ONLY valid JSON.
          2. Do not use Markdown formatting (no \`\`\`).
          3. Follow this exact JSON structure: ${jsonSchema}`
        },
        { 
          role: "user", 
          content: `Generate the JSON syllabus for ${topics}.` 
        }
      ],
      max_tokens: 2000, // Syllabi are long, we need space!
      temperature: 0.5 // Keep it structured, less random
    });

    // 3. Clean and Parse (Robust Logic)
    let rawText = response.choices[0].message.content;
    
    // Cleanup: Remove markdown backticks if the model adds them
    const clean = rawText.replace(/```json|```/g, "").trim();

    try {
      // First try: Direct parse
      return JSON.parse(clean);
    } catch (parseErr) {
      // Second try: Regex to extract just the JSON object (in case of intro text)
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
         try {
           return JSON.parse(match[0]);
         } catch (e) {
           throw new Error("Model generated invalid JSON structure.");
         }
      }
      throw new Error(`JSON Parsing failed: ${parseErr.message}`);
    }
  };

  // 4. Use your standard error handler
  handleHfRequest(apiCall, res);
};

// Ensure you have these imported
// import { hf, handleHfRequest } from './your-config-file.js'; 

export const generateQuestions = async (req, res) => {
  const { topic, difficulty, count } = req.body;

  const apiCall = async () => {
    // 1. Define the exact structure we want for Practice.jsx
    const jsonSchema = `
    [
      {
        "id": "unique_string",
        "title": "Problem Name",
        "description": "Full problem statement...",
        "difficulty": "Easy/Medium/Hard",
        "topics": ["topic1", "topic2"],
        "constraints": ["1 <= N <= 100", "Time Limit: 1s"],
        "examples": [
           { "input": "...", "output": "...", "explanation": "..." }
        ]
      }
    ]`;

    // 2. Call Hugging Face
    const response = await hf.chatCompletion({
      model: "google/gemma-2-2b-it",
      messages: [
        { 
          role: "system", 
          content: `You are a Senior Technical Interviewer.
          Generate ${count} unique "${difficulty}" level coding problem(s) about "${topic}".
          
          CRITICAL RULES:
          1. Output ONLY a valid JSON Array.
          2. No Markdown formatting (no \`\`\`).
          3. Follow this EXACT JSON structure: ${jsonSchema}
          4. difficulty must be exactly "Easy", "Medium", or "Hard"
          5. topics array must include the requested topic
          6. examples array must have at least 1 example with input, output, and explanation fields
          7. constraints must be an array of strings describing problem constraints` 
        },
        { 
          role: "user", 
          content: `Generate ${count} ${difficulty} problem(s) about ${topic}.` 
        }
      ],
      max_tokens: 2500, 
      temperature: 0.6
    });

    // 3. Clean and Parse
    const rawText = response.choices[0].message.content;
    const clean = rawText.replace(/```json|```/g, "").trim();

    let problems;
    try {
      // First try: Direct parse
      problems = JSON.parse(clean);
    } catch (parseErr) {
      // Second try: Regex to extract the Array [...]
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          problems = JSON.parse(match[0]);
        } catch (e) {
          throw new Error("Model generated invalid JSON array.");
        }
      } else {
        throw new Error("Failed to parse questions from AI response.");
      }
    }

    // 4. Validate and normalize each problem
    const normalizedProblems = problems.map((problem) => ({
      id: problem.id || `problem_${Date.now()}_${Math.random()}`,
      title: problem.title || "Untitled Problem",
      description: problem.description || "",
      difficulty: problem.difficulty || difficulty,
      topics: Array.isArray(problem.topics) ? problem.topics : [topic],
      constraints: Array.isArray(problem.constraints) ? problem.constraints : [],
      examples: Array.isArray(problem.examples) ? problem.examples.map(ex => ({
        input: ex.input || "",
        output: ex.output || "",
        explanation: ex.explanation || ""
      })) : []
    }));

    return { problems: normalizedProblems };
  };

  handleHfRequest(apiCall, res);
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

// Smart response generator for document-based Q&A
export const generateSmartResponse = async (req, res) => {
  const { question, context, documentTitle } = req.body;

  if (!question || !context) {
    return res.status(400).json({ error: "Question and context are required" });
  }

  try {
    const systemPrompt = `You are an expert educator and knowledge synthesis specialist. 
Your task is to provide insightful, well-structured answers that:
- Directly address the student's question
- Use evidence from the provided context
- Break complex ideas into digestible explanations
- Highlight key takeaways
- Connect related concepts
- Acknowledge limitations when context is insufficient
- Use clear, engaging language appropriate for students`;

    const detailedPrompt = `
DOCUMENT: ${documentTitle || "Study Material"}
STUDENT QUESTION: ${question}

AVAILABLE CONTEXT:
${context}

Please provide a comprehensive answer that:
1. Directly answers the question using the context
2. Explains the reasoning behind your answer
3. Provides relevant examples from the material
4. Identifies any assumptions or limitations
5. Suggests related concepts to explore further

Format your response clearly with proper paragraphing.`;

    const result = await geminiModel.generateContent(detailedPrompt, {
      systemInstruction: systemPrompt
    });

    const answer = result.response.text();
    
    res.json({
      success: true,
      answer: answer,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Smart Response Error:", error);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
};
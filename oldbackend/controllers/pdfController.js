import { hf, geminiModel } from "../config/aiConfig.js";
import { PDFParse } from 'pdf-parse';
import { DocumentModel } from "../models/DocumentModel.js";
import supabase from "../config/supabaseClient.js";

// Helper: Get Embeddings (Same as before)
async function getEmbeddings(texts) {
    // Ensure we send an array, even if it's a single string
    const inputs = Array.isArray(texts) ? texts : [texts];
    
    const response = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: inputs
    });
    return response;
}

export const uploadPDF = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
        
        // 1. Get the User ID (from authMiddleware)
        const userId = req.user.id;

        console.log(`Processing PDF for User: ${userId}`);

        // 2. Parse PDF
        const parser = new PDFParse({ data: req.file.buffer });
        const pdfText = (await parser.getText()).text;

        if (!pdfText || pdfText.length < 10) {
            return res.status(400).json({ error: "PDF seems empty or unreadable." });
        }

        // 3. Chunking (Split by paragraphs, roughly 500 chars)
        let chunks = pdfText.split(/\n\n+/).filter(c => c.length > 50).slice(0, 50);

        // 4. Generate Vectors
        console.log("Generating Embeddings...");
        const embeddings = await getEmbeddings(chunks);

        // 5. Save to Database
        const docRecord = await DocumentModel.createDocument(req.file.originalname, userId);
        await DocumentModel.saveChunks(docRecord.id, chunks, embeddings);

        console.log("PDF Saved to Supabase!");
        res.json({ message: "PDF Uploaded and Memorized successfully!" });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Failed to process PDF", details: error.message });
    }
};

export const chatWithPDF = async (req, res) => {
    try {
        const { question } = req.body;
        const userId = req.user.id; // Get the logged-in user

        if (!question || question.trim().length === 0) {
            return res.status(400).json({ error: "Question cannot be empty" });
        }

        // 1. Vectorize the Question
        const qEmbeddingResponse = await getEmbeddings([question]);
        const qVector = qEmbeddingResponse[0]; // Extract the vector array

        // 2. Search DB for relevant chunks (get more for better context)
        const similarChunks = await DocumentModel.searchSimilarContent(qVector, userId);

        if (!similarChunks || similarChunks.length === 0) {
            return res.json({ 
                answer: "I couldn't find relevant information in your uploaded documents about that topic. Try uploading more materials or ask about different content.",
                source_snippet: ""
            });
        }

        // 3. Prepare Context with clear passage markers
        const contextText = similarChunks
            .map((c, idx) => `[Passage ${idx + 1}]\n${c.content}`)
            .join("\n\n---\n\n");

        // 4. Ask Gemini with sophisticated, context-aware prompt
        const systemPrompt = `You are a warm, encouraging, and knowledgeable study companion AI. Your personality:
- Greet students warmly and make them feel supported
- Use a friendly, conversational tone while remaining professional
- Include encouraging phrases when they ask good questions
- Be personable but always stay focused on the educational content
- Use natural language with occasional casual expressions (e.g., "Great question!", "I love how you're thinking about this!")
- Never be dry or robotic - be someone they'd want to study with

Your educational role:
1. Answer questions thoroughly and accurately using ONLY the provided document context
2. Break down complex concepts into understandable explanations
3. Provide specific examples from the context when relevant
4. If the context is insufficient to fully answer, acknowledge the limitation and explain what information is missing
5. Always cite which passage you're referencing (e.g., "According to Passage 2...")
6. Be precise and avoid speculating beyond what the documents say
7. If asked about something not in the documents, clearly state: "This information is not covered in the uploaded documents"
8. Use conversational language and explain technical terms when necessary
9. Add a personal touch - congratulate them for asking thoughtful questions or connecting ideas`;
        const userPrompt = `STUDENT QUESTION: ${question}\n\nRELEVANT DOCUMENT PASSAGES:\n${contextText}\n\nProvide a clear, detailed answer that directly addresses the question using only the passages above. Cite the specific passage(s) you reference.`;
        const result = await geminiModel.generateContent(userPrompt, {
            systemInstruction: systemPrompt
        });

        const answer = result.response.text();

        // Return the best source passage (longest/most relevant)
        const bestSource = similarChunks.reduce((best, current) => 
            current.content.length > best.content.length ? current : best
        );

        res.json({ 
            answer: answer,
            source_snippet: bestSource.content.substring(0, 200) + (bestSource.content.length > 200 ? "..." : "")
        });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to process your question. Please try again.", details: error.message });
    }
};

// NEW METHOD: Upload PDF and Generate Syllabus
export const uploadPDFAndGenerateSyllabus = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
        
        const userId = req.user.id;
        const pdfFileName = req.file.originalname;

        console.log(`Processing PDF and generating syllabus for User: ${userId}`);

        // ===== PART 1: UPLOAD PDF (Like uploadPDF) =====
        // 1. Parse PDF
        const parser = new PDFParse({ data: req.file.buffer });
        const pdfText = (await parser.getText()).text;

        if (!pdfText || pdfText.length < 10) {
            return res.status(400).json({ error: "PDF seems empty or unreadable." });
        }

        // 2. Chunking (Split by paragraphs)
        let chunks = pdfText.split(/\n\n+/).filter(c => c.length > 50).slice(0, 50);

        // 3. Generate Embeddings
        console.log("Generating Embeddings...");
        const embeddings = await getEmbeddings(chunks);

        // 4. Save PDF to Database
        const docRecord = await DocumentModel.createDocument(pdfFileName, userId);
        await DocumentModel.saveChunks(docRecord.id, chunks, embeddings);

        console.log("PDF Saved to Supabase!");

        // ===== PART 2: GENERATE SYLLABUS FROM PDF CONTENT =====
        console.log("Generating Syllabus from PDF content...");

        // Extract topics from the PDF text (first 500 chars as a hint of content)
        const contentPreview = pdfText.substring(0, 500);
        
        // Call HF to generate a syllabus based on PDF content
        const response = await hf.chatCompletion({
            model: "google/gemma-2-2b-it",
            messages: [
                { 
                    role: "system", 
                    content: `Act as a Technical Curriculum Developer. 
                    Based on the provided document content, create a detailed syllabus that structures this knowledge into a learning path.
                    
                    CRITICAL RULES:
                    1. Output ONLY valid JSON.
                    2. Do not use Markdown formatting (no \`\`\`).
                    3. Follow this exact JSON structure:
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
                    }`
                },
                { 
                    role: "user", 
                    content: `Create a structured learning syllabus from this document content:\n\n${contentPreview}` 
                }
            ],
            max_tokens: 2000,
            temperature: 0.5
        });

        // Parse the syllabus response
        let rawText = response.choices[0].message.content;
        const clean = rawText.replace(/```json|```/g, "").trim();

        let syllabusData;
        try {
            syllabusData = JSON.parse(clean);
        } catch (parseErr) {
            const match = clean.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    syllabusData = JSON.parse(match[0]);
                } catch (e) {
                    throw new Error("Model generated invalid JSON structure for syllabus.");
                }
            } else {
                throw new Error("Failed to generate valid syllabus from PDF.");
            }
        }

        // Save syllabus to 'user_courses' table
        const { data: courseSaved, error: courseError } = await supabase
            .from('user_courses')
            .insert({
                user_id: userId,
                course_title: syllabusData.syllabus_title || "Generated from " + pdfFileName,
                syllabus_data: syllabusData,
                document_id: docRecord.id, // Link to the PDF document
                source_type: 'pdf',        // Specify the source
                progress_percentage: 0,
                status: 'in_progress'
            })
            .select()
            .single();

        if (courseError) {
            console.error("Error saving course to user_courses:", courseError);
            throw new Error("Failed to save the generated course.");
        }

        console.log("Syllabus generated and saved to user_courses table!");

        // Return both the document info and syllabus with course ID
        res.json({ 
            message: "PDF Uploaded and Syllabus Generated successfully!",
            document: {
                id: docRecord.id,
                filename: pdfFileName,
                chunks: chunks.length
            },
            syllabus: syllabusData,
            courseId: courseSaved.id
        });

    } catch (error) {
        console.error("Upload & Generate Error:", error);
        res.status(500).json({ 
            error: "Failed to process PDF and generate syllabus", 
            details: error.message 
        });
    }
};
import { hf, geminiModel } from "../config/aiConfig.js";
import { PDFParse } from 'pdf-parse';
import { DocumentModel } from "../models/DocumentModel.js";

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

        // 1. Vectorize the Question
        const qEmbeddingResponse = await getEmbeddings([question]);
        const qVector = qEmbeddingResponse[0]; // Extract the vector array

        // 2. Search DB (Pass userId now!)
        // Note: You need to update your DocumentModel.js to accept userId too (see below)
        const similarChunks = await DocumentModel.searchSimilarContent(qVector, userId);

        if (!similarChunks || similarChunks.length === 0) {
            return res.json({ 
                answer: "I couldn't find any info in your uploaded documents. Try uploading a PDF first!",
                source_snippet: ""
            });
        }

        // 3. Prepare Context
        const contextText = similarChunks.map(c => c.content).join("\n\n");

        // 4. Ask Gemini
        const prompt = `You are a tutor. Answer the question using ONLY the context below.\n\nCONTEXT:\n${contextText}\n\nQUESTION: ${question}`;
        
        const result = await geminiModel.generateContent(prompt);
        const answer = result.response.text();

        res.json({ 
            answer: answer,
            source_snippet: similarChunks[0].content.substring(0, 150) + "..."
        });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Chat failed" });
    }
};
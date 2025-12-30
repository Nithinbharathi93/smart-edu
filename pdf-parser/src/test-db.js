import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verifyRAGData() {
  console.log("--- Fetching Documents and Sections ---");

  // Perform a joined select to get documents and their related sections
  // This automatically detects the foreign key relationship
  const { data, error } = await supabase
    .from("documents")
    .select(`
      id,
      filename,
      created_at,
      document_sections (
        id,
        content,
        embedding
      )
    `)
    .limit(1); // Just check the first one for verification

  if (error) {
    console.error("Error fetching data:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No documents found. Try running /ingest first!");
    return;
  }

  data.forEach((doc) => {
    console.log(`\nDocument Found: ${doc.filename} (ID: ${doc.id})`);
    console.log(`Total Chunks: ${doc.document_sections.length}`);
    
    if (doc.document_sections.length > 0) {
      const firstSection = doc.document_sections[0];
      console.log("--- Sample Chunk ---");
      console.log(`ID: ${firstSection.id}`);
      console.log(`Content Preview: ${firstSection.content.substring(0, 100)}...`);
      
      // Verify the vector is an array and has the correct dimensions (384)
      const vector = firstSection.embedding;
      const isVectorValid = Array.isArray(vector) && vector.length === 384;
      console.log(`Vector Dimension Valid (384): ${isVectorValid ? "✅" : "❌ (" + vector?.length + ")"}`);
    }
  });
}

verifyRAGData();
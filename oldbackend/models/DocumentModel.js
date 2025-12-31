import supabase from '../config/supabaseClient.js';

export const DocumentModel = {
  // 1. UPDATED: Now accepts userId as the second argument
  async createDocument(filename, userId) {
    const { data, error } = await supabase
      .from('documents')
      .insert({ 
        filename: filename,
        user_id: userId // <--- THIS WAS MISSING!
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async saveChunks(documentId, chunks, embeddings) {
    const rows = chunks.map((text, index) => ({
      document_id: documentId,
      content: text,
      embedding: embeddings[index]
    }));

    const { error } = await supabase.from('document_chunks').insert(rows);
    if (error) throw error;
  },

async searchSimilarContent(queryVector, userId) {
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_threshold: 0.1, // <--- CHANGE THIS from 0.3 or 0.5 to 0.1 (Very lenient)
      match_count: 5,
      filter_user_id: userId
    });
    
    // Debugging: Print what the DB returned
    console.log("DB Search Results:", data?.length || 0, "matches found."); 
    
    if (error) throw error;
    return data;
}
};
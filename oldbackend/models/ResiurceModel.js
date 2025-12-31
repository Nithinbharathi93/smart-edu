import supabase from '../config/supabaseClient.js';

export const ResourceModel = {
  async saveGeneratedContent(type, contentJson) {
    const { data, error } = await supabase
      .from('generated_resources')
      .insert({
        type: type, // 'syllabus' or 'question'
        content: contentJson
      })
      .select();
    
    if (error) throw error;
    return data;
  },

  async getRecentResources(type) {
    const { data, error } = await supabase
      .from('generated_resources')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    return data;
  }
};
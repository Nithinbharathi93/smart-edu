import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export const upsertProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      ...profileData,
      updated_at: new Date()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error for new users
  return data;
};

export const getProfileSettings = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("default_language, socratic_level, editor_config")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateProfileSettings = async (userId, settings) => {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      default_language: settings.default_language,
      socratic_level: settings.socratic_level,
      editor_config: settings.editor_config,
      updated_at: new Date()
    })
    .eq("id", userId)
    .select("default_language, socratic_level, editor_config")
    .single();

  if (error) throw error;
  return data;
};
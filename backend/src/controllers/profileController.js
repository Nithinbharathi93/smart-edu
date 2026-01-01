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
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Fetches all ingested PDFs
 */
export async function listDocuments() {
  const { data, error } = await supabase
    .from("documents")
    .select("id, filename, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
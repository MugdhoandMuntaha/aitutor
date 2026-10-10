/**
 * Supabase Client Initialization & Configuration Helper
 * Configured with user's project credentials:
 * URL: https://gipgockozsbresekldia.supabase.co
 */

import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://gipgockozsbresekldia.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpcGdvY2tvenNicmVzZWtsZGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTYwODEsImV4cCI6MjEwNzE5MjA4MX0.RMMIBgvEad8x8jVbKPK3Ps3T5p70TS3F8Y3XlpUMM5s";

const STORAGE_KEY_SUPABASE_URL = "harvard_cse_supabase_url";
const STORAGE_KEY_SUPABASE_KEY = "harvard_cse_supabase_anon_key";

export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const storedUrl = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY_SUPABASE_URL) : null;
  const storedKey = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) : null;

  const url = storedUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = storedKey || envKey || DEFAULT_SUPABASE_KEY;

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith("https://") && anonKey.length > 20);
}

export function saveSupabaseCredentials(url, anonKey) {
  if (typeof localStorage !== "undefined") {
    if (url) localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);

    if (anonKey) localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
  }
}

const { url: activeUrl, anonKey: activeKey } = getSupabaseCredentials();

export const supabase = createClient(
  activeUrl || DEFAULT_SUPABASE_URL,
  activeKey || DEFAULT_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

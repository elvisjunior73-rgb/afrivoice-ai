// Supabase project constants — fallback values ensure the app works even
// when VITE_* env vars are not injected at build time (e.g. Lovable production builds).
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://ihsylxxuakpqciyweied.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc3lseHh1YWtwcWNpeXdlaWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzU0NDYsImV4cCI6MjA5MTQxMTQ0Nn0.2zdGhYVN05Qj6n86cB8W1JxS_diOzM5AmDt1anLjjIo";

// ============================================================================
// js/supabase-config.js
// Cliente Supabase único, compartilhado entre o site público (js/tracking.js)
// e o painel administrativo (js/auth.js). Carregar sempre antes dos dois.
// ============================================================================

const SUPABASE_URL = "https://yyxwcbioceutosumfdbc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eHdjYmlvY2V1dG9zdW1mZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mjk5NzcsImV4cCI6MjA5OTQwNTk3N30.PhD4cSa-WeKPFLSFJoEjLuBaScZ7nw5CiTTqSb-LvZU";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

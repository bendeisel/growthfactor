// Copy to config.js and fill in. config.js is git-ignored.
//
// Both values below are safe in the browser: the anon key only grants what row
// level security allows, which is "your own rows and nothing else". The
// Anthropic key is NOT here and must never be. It lives in Supabase function
// secrets, where the browser cannot reach it.
window.ALIEN_KIND = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-PUBLISHABLE-ANON-KEY",
};

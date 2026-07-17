const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://gjyrdnhdtoczvmpjshpf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeXJkbmhkdG9jenZtcGpzaHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNDE0MjksImV4cCI6MjA5OTgxNzQyOX0.itOUrZYVEUOuYjo3LK1JQ9Waqv3N33yCe3_5zg_FFW8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('campaigns').select('*');
  console.log("CAMPAIGNS:", data, "ERROR:", error);

  const { data: artists, error: err2 } = await supabase.from('artists').select('*');
  console.log("ARTISTS:", artists, "ERROR:", err2);
}

run();

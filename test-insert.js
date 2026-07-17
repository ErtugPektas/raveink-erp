const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://gjyrdnhdtoczvmpjshpf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeXJkbmhkdG9jenZtcGpzaHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNDE0MjksImV4cCI6MjA5OTgxNzQyOX0.itOUrZYVEUOuYjo3LK1JQ9Waqv3N33yCe3_5zg_FFW8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Test insert artist
  const { data, error } = await supabase.from('artists').insert({
    name: "Test Sanatçı",
    specialty: "Test",
    working_hours: "10:00 - 20:00",
    color: "#ffffff"
  }).select();

  console.log("INSERT RESULT:", data, "ERROR:", error);
}

run();

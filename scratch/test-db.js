const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Parse .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf8");
} catch (e) {
  console.error("Error reading .env.local", e);
  process.exit(1);
}

const env = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim().replace(/^"|"$/g, "");
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env.local", { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from("bookings").select("*").limit(1);
  if (error) {
    console.error("Error fetching booking:", error);
    return;
  }
  if (data && data.length > 0) {
    console.log("Columns in bookings table:", Object.keys(data[0]));
    console.log("Full sample row:", data[0]);
  } else {
    console.log("No bookings found in database.");
  }
}

test();

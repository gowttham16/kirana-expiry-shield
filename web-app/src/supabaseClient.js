import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iacjecgjlctlyxtvyhqb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2plY2dqbGN0bHl4dHZ5aHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMDQ2NTMsImV4cCI6MjEwNzc4MDY1M30.J21RbFPvuZ4a0Rme5QklKRDcmQZGuRSlKwhuNcLUCOU";

export const supabase = createClient(supabaseUrl, supabaseKey);
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://fdjtsehoebichpimansk.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkanRzZWhvZWJpY2hwaW1hbnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzM0NDYsImV4cCI6MjA4OTkwOTQ0Nn0.4VJ9HO9CsNR8VDNjyKcZ29gRuxi1d7TDMwuVKxJ4Yok"

export const supabase = createClient(supabaseUrl, supabaseKey)

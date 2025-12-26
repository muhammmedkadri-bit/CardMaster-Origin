import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lsmortirpkcqixcafumc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbW9ydGlycGtjcWl4Y2FmdW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjUxOTAsImV4cCI6MjA4MjI0MTE5MH0.prgCEDeA3O8hUAzA7V6MM5dJ9qw1gvyEY868qiwhFoo'

export const supabase = createClient(supabaseUrl, supabaseKey)
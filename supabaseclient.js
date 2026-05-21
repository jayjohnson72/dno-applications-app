import { createClient } from '@supabase/supabase-js'

const supabaseUrl = https://wutqbleywmhihuedodny.supabase.co/rest/v1/
const supabaseKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dHFibGV5d21oaWh1ZWRvZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDczNjksImV4cCI6MjA5NDkyMzM2OX0.yJ4bFWQ6n5zF-XbsOHIow53DOIpXwrgYVdfOcdNlWPY

export const supabase = createClient(supabaseUrl, supabaseKey)
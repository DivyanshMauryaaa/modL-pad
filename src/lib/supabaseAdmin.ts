import { createClient } from '@supabase/supabase-js'

// Service role key must only be used on the server
export const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default supabaseAdmin




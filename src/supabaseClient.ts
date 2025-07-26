import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_ROLE_KEY!
);

export const supabase2 = createClient(
  process.env.SUPABASE_URL_2!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_2!
);

export const supabaseAnon2 = createClient(
  process.env.SUPABASE_URL_2!,
  process.env.SUPABASE_ANON_ROLE_KEY_2!
);

export default supabase;


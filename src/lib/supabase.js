import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xtlyehkixjbwmscqlzxh.supabase.co";
const supabasePublishableKey = "sb_publishable_GMys_C7NPg_9QeP7zRZMbg_j4V_ycIE";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

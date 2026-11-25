// Supabase 클라이언트 (앱 전체에서 이것 하나만 사용)
// 값은 .env.local 의 VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(".env.local 에 VITE_SUPABASE_URL 과 VITE_SUPABASE_PUBLISHABLE_KEY 를 넣어주세요");
}

export const supabase = createClient(url, key);

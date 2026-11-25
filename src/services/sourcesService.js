// 공식 공고 바로가기 링크 (Supabase official_sources 테이블)
// src/constants/sources.js 는 처음 데이터를 넣을 때 쓴 원본 (scripts/build-seed.mjs)
import { supabase } from "./supabase";

/** 바로가기 링크 [주소, 이름] 배열 (기본 순서대로) */
export async function getOfficialSources() {
  const { data, error } = await supabase.from("official_sources").select("url, label").order("sort_order");
  if (error) throw error;
  return data.map(r => [r.url, r.label]);
}

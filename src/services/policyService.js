// 정책 데이터 (Supabase policies 테이블)
// src/constants/policies.json 은 처음 데이터를 넣을 때 쓴 원본 (scripts/build-seed.mjs)
import { supabase } from "./supabase";
import { rowToPolicy } from "./policyMapping";

/** 전체 정책 목록 (기본 순서대로) */
export async function getPolicies() {
  const { data, error } = await supabase.from("policies").select("*").order("sort_order");
  if (error) throw error;
  return data.map(rowToPolicy);
}

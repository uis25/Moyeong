// 의견 남기기 (Supabase feedback 테이블, 보내기만 가능)
import { supabase } from "./supabase";

/**
 * 의견 보내기. 실패하면 오류를 던짐
 * 저장된 행을 돌려받지 않음 (돌려받으려면 읽기 권한이 필요한데, 방문자에게는 주지 않음)
 */
export async function sendFeedback({ rating, type, content, view, policyId, device, authorId }) {
  const { error } = await supabase.from("feedback").insert({
    rating, type, content, view, policy_id: policyId, device, author_id: authorId,
  });
  if (error) throw error;
}

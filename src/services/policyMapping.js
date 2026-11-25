// Supabase policies 테이블 행 ↔ 앱의 정책 객체 변환 (순수 함수, 비교·시드 스크립트에서도 사용)
// DB는 snake_case 컬럼, 앱은 원래 policies.json 의 camelCase 키를 그대로 씀

/** [앱 키, DB 컬럼, 선택 항목 여부] — 선택 항목은 DB 값이 null이면 키 자체를 빼서 원래 JSON과 같게 */
export const POLICY_FIELDS = [
  ["id", "id"],
  ["title", "title"],
  ["organization", "organization"],
  ["category", "category"],
  ["supportType", "support_type"],
  ["minAge", "min_age"],
  ["maxAge", "max_age"],
  ["ageText", "age_text", true],
  ["eligibleRegions", "eligible_regions"],
  ["minFarmingYears", "min_farming_years"],
  ["maxFarmingYears", "max_farming_years"],
  ["eligibleFarmerTypes", "eligible_farmer_types"],
  ["requiresBusinessRegistration", "requires_business_registration"],
  ["applicationStart", "application_start"],
  ["applicationEnd", "application_end"],
  ["reg", "reg"],
  ["description", "description"],
  ["details", "details", true],
  ["detailsMore", "details_more", true],
  ["eligibilityDetails", "eligibility_details"],
  ["requiredDocuments", "required_documents"],
  ["officialNoticeUrl", "official_notice_url"],
  ["applicationUrl", "application_url"],
  ["sourceName", "source_name"],
  ["lastVerifiedAt", "last_verified_at"],
  ["references", "reference_links"],
];

/** DB 행 → 정책 객체 */
export function rowToPolicy(row) {
  const p = {};
  for (const [key, col, optional] of POLICY_FIELDS) {
    if (optional && row[col] == null) continue;
    p[key] = row[col];
  }
  return p;
}

/** 정책 객체 → DB 행 (sortOrder: 목록 순서) */
export function policyToRow(p, sortOrder) {
  const row = { sort_order: sortOrder };
  for (const [key, col] of POLICY_FIELDS) row[col] = p[key] ?? null;
  return row;
}

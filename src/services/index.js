// 앱 시작 시 필요한 데이터를 한꺼번에 불러옴
import { getPolicies } from "./policyService";
import { getOfficialSources } from "./sourcesService";
import { getConditions } from "./conditionsService";
import { getFavorites } from "./favoritesService";
import { getDocumentChecks } from "./documentsService";
import { getRecords } from "./recordsService";
import { getReviews } from "./reviewsService";
import { getUserId } from "./userService";
import { DEMO_DATE } from "../utils/date";

export async function loadAppData() {
  const [policies, sources, conditions, favorites, documents, records, reviews, userId] = await Promise.all([
    getPolicies(), getOfficialSources(), getConditions(), getFavorites(), getDocumentChecks(), getRecords(), getReviews(), getUserId(),
  ]);
  // 시연용 날짜(?date)로 볼 때는 그날까지 등록된 정책만 (등록일이 비어 있으면 그대로 둠, docs/differences.md 30번)
  const visible = DEMO_DATE ? policies.filter(p => !p.reg || p.reg <= DEMO_DATE) : policies;
  return { policies: visible, sources, conditions, favorites, documents, records, reviews, userId };
}

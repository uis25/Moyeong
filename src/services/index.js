// 앱 시작 시 필요한 데이터를 한꺼번에 불러옴
import { getPolicies } from "./policyService";
import { getOfficialSources } from "./sourcesService";
import { getConditions } from "./conditionsService";
import { getFavorites } from "./favoritesService";
import { getDocumentChecks } from "./documentsService";
import { getRecords } from "./recordsService";
import { getReviews } from "./reviewsService";
import { getUserId } from "./userService";

export async function loadAppData() {
  const [policies, sources, conditions, favorites, documents, records, reviews, userId] = await Promise.all([
    getPolicies(), getOfficialSources(), getConditions(), getFavorites(), getDocumentChecks(), getRecords(), getReviews(), getUserId(),
  ]);
  return { policies, sources, conditions, favorites, documents, records, reviews, userId };
}

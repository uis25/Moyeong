// 앱 시작 시 필요한 데이터를 한꺼번에 불러옴
import { getPolicies } from "./policyService";
import { getConditions } from "./conditionsService";
import { getFavorites } from "./favoritesService";
import { getDocumentChecks } from "./documentsService";
import { getRecords } from "./recordsService";
import { getReviews } from "./reviewsService";
import { getUserId } from "./userService";

export async function loadAppData() {
  const [policies, conditions, favorites, documents, records, reviews, userId] = await Promise.all([
    getPolicies(), getConditions(), getFavorites(), getDocumentChecks(), getRecords(), getReviews(), getUserId(),
  ]);
  return { policies, conditions, favorites, documents, records, reviews, userId };
}

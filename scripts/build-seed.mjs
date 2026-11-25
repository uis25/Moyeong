// policies.json · sources.js → supabase/seed.sql (Supabase에 처음 데이터를 넣을 때 사용)
// 사용법: node scripts/build-seed.mjs  → 만들어진 seed.sql 을 SQL Editor 에서 실행
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { policyToRow } from "../src/services/policyMapping.js";
import { OFFICIAL_SOURCES } from "../src/constants/sources.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POLICIES = JSON.parse(fs.readFileSync(path.join(ROOT, "src/constants/policies.json"), "utf8"));

const q = s => "'" + String(s).replace(/'/g, "''") + "'";
const JSONB = new Set(["reference_links"]);
function lit(col, v) {
  if (v == null) return "null";
  if (JSONB.has(col)) return q(JSON.stringify(v)) + "::jsonb";
  if (Array.isArray(v)) return v.length ? "array[" + v.map(q).join(", ") + "]::text[]" : "'{}'::text[]";
  if (typeof v == "boolean" || typeof v == "number") return String(v);
  return q(v);
}
function insert(table, rows) {
  const cols = Object.keys(rows[0]);
  const values = rows.map(r => "  (" + cols.map(c => lit(c, r[c])).join(", ") + ")").join(",\n");
  return `insert into public.${table} (${cols.join(", ")}) values\n${values};\n`;
}

const sql = `-- 자동 생성 파일 (scripts/build-seed.mjs). 직접 고치지 마세요.
-- ⚠️ 실행하면 policies · official_sources 테이블의 기존 내용을 모두 지우고 다시 넣습니다.
begin;
truncate public.policies, public.official_sources;
${insert("policies", POLICIES.map((p, i) => policyToRow(p, i)))}
${insert("official_sources", OFFICIAL_SOURCES.map(([url, label], i) => ({ sort_order: i, url, label })))}
commit;
`;
fs.writeFileSync(path.join(ROOT, "supabase/seed.sql"), sql);
console.log(`supabase/seed.sql: 정책 ${POLICIES.length}개, 바로가기 ${OFFICIAL_SOURCES.length}개`);

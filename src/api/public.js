// =============================================================================
// src/api/public.js  (REWRITTEN to delegate to client.js)
// -----------------------------------------------------------------------------
// ExploreCatalog.jsx does NOT need to change.
// =============================================================================

import { getUniversities, getUniversityPrograms as getUniversityProgramsRaw } from './client';
import { normalizeList } from './utils';

export async function getPublicUniversities(params) {
  const response = await getUniversities(params);
  const { results, count } = normalizeList(response.data);
  return { data: { results, count } };
}

export function getUniversityPrograms(universityId) {
  return getUniversityProgramsRaw(universityId);
}
// =============================================================================
// src/api/public.js
// -----------------------------------------------------------------------------
// Public API calls for ExploreCatalog and UniversityDetail.
// =============================================================================

import { getUniversities, getUniversityPrograms as getUniversityProgramsRaw, getUniversity } from './client';
import { normalizeList } from './utils';

export async function getPublicUniversities(params) {
  try {
    const response = await getUniversities(params);
    const { results, count } = normalizeList(response.data);
    return { data: { results, count } };
  } catch (error) {
    console.error('Failed to fetch universities:', error);
    throw error;
  }
}

export async function getUniversityPrograms(universityId) {
  try {
    const response = await getUniversityProgramsRaw(universityId);
    // Handle both array and paginated responses
    const data = Array.isArray(response.data) ? response.data : response.data.results || [];
    return { data: data };
  } catch (error) {
    console.error(`Failed to fetch programs for university ${universityId}:`, error);
    // Return empty array instead of throwing to prevent UI crash
    return { data: [] };
  }
}

export async function getUniversityDetail(id) {
  try {
    const response = await getUniversity(id);
    return response;
  } catch (error) {
    console.error(`Failed to fetch university ${id}:`, error);
    throw error;
  }
}
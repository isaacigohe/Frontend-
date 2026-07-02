// =============================================================================
// src/api/public.js
// -----------------------------------------------------------------------------
// Named Axios wrappers for GlobalScholar's PUBLIC endpoints only — no JWT is
// required for any call in this file. Deliberately kept separate from
// students.js: those endpoints need an authenticated Axios instance (JWT
// interceptor), and mixing "public" and "auth-required" calls
// in one file makes it too easy to accidentally gate the landing page
// behind a login redirect if the interceptor ever changes.
//
// IMPORTANT: This reads directly from the raw apiClient instance. If your
// interceptor redirects to /login on standard unauthenticated requests, ensure
// these public routes bypass that logic. No tokens are attached here.
// =============================================================================

import apiClient from './client';

/**
 * GET a paginated, filterable slice of the PUBLIC university catalog.
 * @param {Object} params - { page, country, language, search }
 * @returns {Promise} Axios response containing DRF shape:
 * { 
 * data: { count, next, previous, results: [...] } 
 * }
 */
export function getPublicUniversities(params) {
  // Ensure we match trailing slash rules for Django's common routing structure
  return apiClient.get('/public/universities/', { 
    params: {
      page: params?.page || 1,
      ...(params?.country && params.country !== 'All Countries' && { country: params.country }),
      ...(params?.language && params.language !== 'All Languages' && { language: params.language }),
      ...(params?.search && { search: params.search.trim() })
    }
  });
}

/**
 * GET the nested academic programs for one university, fetched lazily only
 * when a prospective student actually expands that row.
 * @param {string|number} universityId - The unique ID of the selected target university
 * @returns {Promise} Axios response containing an array of active programs:
 * [ { id, name, degree_level, application_deadline, portal_url }, ... ]
 */
export function getUniversityPrograms(universityId) {
  if (!universityId) {
    return Promise.reject(new Error('University ID is required to fetch nested programs.'));
  }
  return apiClient.get(`/public/universities/${universityId}/programs/`);
}
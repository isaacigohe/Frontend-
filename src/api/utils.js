// src/api/utils.js
//
// normalizeList() exists because we haven't confirmed in Postman whether
// every list endpoint on the real backend (UniversityListCreateView,
// ApplicationListCreateView, etc.) actually has DRF pagination turned on.
// If it does, the raw response looks like { count, next, previous, results }.
// If it doesn't, it's just a plain array.
//
// Every list-fetching function in students.js/admin.js/public.js runs its
// response through this so the rest of the frontend can keep reading
// `response.data.results` and `response.data.count` unconditionally,
// regardless of which shape the backend actually sends.

export function normalizeList(rawData) {
  if (Array.isArray(rawData)) {
    // Backend returned a flat, unpaginated array.
    return { results: rawData, count: rawData.length };
  }
  // Backend returned DRF's standard paginated shape.
  return { results: rawData.results ?? [], count: rawData.count ?? (rawData.results ?? []).length };
}
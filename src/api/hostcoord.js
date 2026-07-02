// =============================================================================
// src/api/hostcoord.js
// -----------------------------------------------------------------------------
// Named Axios wrappers consumed by HostCoordinatorDashboard.jsx.
// =============================================================================

import apiClient from './client';

// GET every inbound placement this Host Coordinator is responsible for.
// Expected response: an array of placements, each shaped like:
//   {
//     id, student_name, home_university, program_term,
//     arrival_state: 'AWAITING_ARRIVAL' | 'ARRIVED' | 'HOUSING_CONFIRMED' | 'ORIENTATION_COMPLETE',
//     expected_arrival_date,
//     logistics_checklist: [{ id, task_name, is_complete }]
//   }
function getInboundPlacements() {
  return apiClient.get('/host/placements/');
}

// PATCH a placement's arrival_state forward to the next stage.
function updateArrivalState(placementId, nextState) {
  return apiClient.patch(`/host/placements/${placementId}/`, { arrival_state: nextState });
}

// PATCH a single logistics checklist task's completion flag.
function toggleLogisticsTask(placementId, taskId, isComplete) {
  return apiClient.patch(`/host/placements/${placementId}/logistics/${taskId}/`, { is_complete: isComplete });
}

export { getInboundPlacements, updateArrivalState, toggleLogisticsTask };
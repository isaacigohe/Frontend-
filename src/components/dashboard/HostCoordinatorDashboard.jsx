// =============================================================================
// HostCoordinatorDashboard.jsx  (MOCK-DATA VERSION)
// -----------------------------------------------------------------------------
// PHASE 4b — GlobalScholar Host Coordinator (HOST_COORD) Dashboard
//
// STATUS: intentionally NOT wired to the backend. There are no placement,
// arrival-state, or logistics-checklist models/endpoints yet — that's a
// deliberate, agreed decision (see chat history), not an oversight. Every
// data point on this screen comes from the MOCK_PLACEMENTS array below,
// so the full four-role product story (Student -> Admin -> Host Coordinator)
// is visually complete for review even though this one role's backend is
// still being built.
//
// SWAPPING IN REAL DATA LATER: once placement endpoints exist, the only
// change needed is replacing the `useState(MOCK_PLACEMENTS)` initializer
// with a useEffect + API call (identical pattern to every other dashboard
// in this app) — every component below (ArrivalStepper, LogisticsChecklist,
// the stat cards) already reads from plain state and doesn't care whether
// that state came from a mock array or a real fetch.
// =============================================================================

import { useState, Fragment } from 'react';
import {
  Users,
  Plane,
  Home,
  ClipboardCheck,
  CheckSquare,
  Square,
  ChevronRight,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  UserCheck,
} from 'lucide-react';
import { CustomDropdown, Badge, EmptyState } from './shared/DashboardUI';

// The arrival pipeline is its own small state machine, separate from the
// six-stage application pipeline — a placement only starts existing once an
// application has already been APPROVED, so it tracks physical logistics,
// not paperwork review.
const ARRIVAL_STAGES = [
  { key: 'AWAITING_ARRIVAL', label: 'Awaiting Arrival', icon: CalendarClock },
  { key: 'ARRIVED', label: 'Arrived', icon: Plane },
  { key: 'HOUSING_CONFIRMED', label: 'Housing Confirmed', icon: Home },
  { key: 'ORIENTATION_COMPLETE', label: 'Orientation Complete', icon: ClipboardCheck },
];

const ARRIVAL_FILTER_OPTIONS = ['All Placements', ...ARRIVAL_STAGES.map((s) => s.key)];

function toneForArrivalState(state) {
  if (state === 'ORIENTATION_COMPLETE') return 'emerald';
  if (state === 'HOUSING_CONFIRMED') return 'navy';
  if (state === 'ARRIVED') return 'amber';
  return 'slate';
}

// -----------------------------------------------------------------------------
// MOCK DATA — realistic enough to demo the whole flow, clearly labeled as
// mock in the code so nobody mistakes it for a real fetch later.
// -----------------------------------------------------------------------------
const MOCK_PLACEMENTS = [
  {
    id: 'mock-1',
    student_name: 'Amara Chen',
    home_university: 'University of Toronto',
    program_term: 'Fall 2026',
    arrival_state: 'AWAITING_ARRIVAL',
    expected_arrival_date: '2026-08-14',
    logistics_checklist: [
      { id: 'l1', task_name: 'Housing Assigned', is_complete: true },
      { id: 'l2', task_name: 'Airport Pickup Scheduled', is_complete: false },
      { id: 'l3', task_name: 'Orientation Booked', is_complete: false },
      { id: 'l4', task_name: 'Insurance Verified', is_complete: true },
    ],
  },
  {
    id: 'mock-2',
    student_name: 'Diego Ferreira',
    home_university: 'Universidade de São Paulo',
    program_term: 'Fall 2026',
    arrival_state: 'ARRIVED',
    expected_arrival_date: '2026-08-02',
    logistics_checklist: [
      { id: 'l5', task_name: 'Housing Assigned', is_complete: true },
      { id: 'l6', task_name: 'Airport Pickup Scheduled', is_complete: true },
      { id: 'l7', task_name: 'Orientation Booked', is_complete: true },
      { id: 'l8', task_name: 'Insurance Verified', is_complete: false },
    ],
  },
  {
    id: 'mock-3',
    student_name: 'Priya Nair',
    home_university: 'University of Mumbai',
    program_term: 'Fall 2026',
    arrival_state: 'HOUSING_CONFIRMED',
    expected_arrival_date: '2026-07-28',
    logistics_checklist: [
      { id: 'l9', task_name: 'Housing Assigned', is_complete: true },
      { id: 'l10', task_name: 'Airport Pickup Scheduled', is_complete: true },
      { id: 'l11', task_name: 'Orientation Booked', is_complete: true },
      { id: 'l12', task_name: 'Insurance Verified', is_complete: true },
    ],
  },
  {
    id: 'mock-4',
    student_name: 'Lukas Weber',
    home_university: 'Ludwig Maximilian University',
    program_term: 'Fall 2026',
    arrival_state: 'ORIENTATION_COMPLETE',
    expected_arrival_date: '2026-07-15',
    logistics_checklist: [
      { id: 'l13', task_name: 'Housing Assigned', is_complete: true },
      { id: 'l14', task_name: 'Airport Pickup Scheduled', is_complete: true },
      { id: 'l15', task_name: 'Orientation Booked', is_complete: true },
      { id: 'l16', task_name: 'Insurance Verified', is_complete: true },
    ],
  },
  {
    id: 'mock-5',
    student_name: 'Fatima Al-Sayed',
    home_university: 'American University of Beirut',
    program_term: 'Fall 2026',
    arrival_state: 'AWAITING_ARRIVAL',
    expected_arrival_date: '2026-08-20',
    logistics_checklist: [
      { id: 'l17', task_name: 'Housing Assigned', is_complete: false },
      { id: 'l18', task_name: 'Airport Pickup Scheduled', is_complete: false },
      { id: 'l19', task_name: 'Orientation Booked', is_complete: false },
      { id: 'l20', task_name: 'Insurance Verified', is_complete: false },
    ],
  },
];

// -----------------------------------------------------------------------------
// StatCard — compact summary metric card for the top strip.
// -----------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, tone = 'slate' }) {
  const toneText = { slate: 'text-slate-800', amber: 'text-amber-700', navy: 'text-navy-800', emerald: 'text-emerald-700' }[tone];
  return (
    <div className="flex items-center gap-4 border border-slate-200 bg-white p-5 shadow-sm rounded-none">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-slate-200 bg-slate-50">
        <Icon className={`h-5 w-5 ${toneText}`} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${toneText}`}>{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// ArrivalStepper — compact horizontal stage tracker.
// -----------------------------------------------------------------------------
function ArrivalStepper({ currentStateKey, placementId, onAdvance }) {
  const currentIndex = ARRIVAL_STAGES.findIndex((s) => s.key === currentStateKey);
  const isFinalStage = currentIndex === ARRIVAL_STAGES.length - 1;
  const nextStage = ARRIVAL_STAGES[currentIndex + 1];

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center">
        {ARRIVAL_STAGES.map((stage, index) => {
          const StageIcon = stage.icon;
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;
          const isLast = index === ARRIVAL_STAGES.length - 1;
          return (
            <div key={stage.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center border-2 rounded-none ${
                    isComplete || isActive ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-300'
                  }`}
                >
                  <StageIcon className="h-4 w-4" />
                </div>
                <span className={`text-center text-[10px] font-semibold uppercase tracking-wide ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                  {stage.label}
                </span>
              </div>
              {!isLast && <div className={`mx-1.5 h-0.5 flex-1 ${isComplete ? 'bg-slate-800' : 'bg-slate-300'}`} />}
            </div>
          );
        })}
      </div>

      {!isFinalStage && (
        <button
          type="button"
          onClick={() => onAdvance(placementId, nextStage.key)}
          className="flex shrink-0 items-center gap-1.5 border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Mark {nextStage.label}
        </button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// LogisticsChecklist
// -----------------------------------------------------------------------------
function LogisticsChecklist({ placementId, tasks, onToggle }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={() => onToggle(placementId, task.id, !task.is_complete)}
          className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 rounded-none hover:border-slate-400"
        >
          {task.is_complete ? (
            <CheckSquare className="h-4 w-4 shrink-0 text-slate-800" />
          ) : (
            <Square className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <span className={task.is_complete ? 'text-slate-400 line-through' : ''}>{task.task_name}</span>
        </button>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// TOP-LEVEL: HostCoordinatorDashboard
// -----------------------------------------------------------------------------
export default function HostCoordinatorDashboard() {
  const [placements, setPlacements] = useState(MOCK_PLACEMENTS);
  const [arrivalFilter, setArrivalFilter] = useState('All Placements');
  const [expandedId, setExpandedId] = useState(null);

  function toggleRow(placementId) {
    setExpandedId((prev) => (prev === placementId ? null : placementId));
  }

  // Mock mutation: updates local state directly since there's no backend
  // yet. The shape of this function is intentionally identical to what a
  // real `await updateArrivalState(...); await refetch();` version would
  // look like, so swapping in the real API later is a small, mechanical
  // change rather than a rewrite.
  function handleAdvanceArrival(placementId, nextState) {
    setPlacements((prev) => prev.map((p) => (p.id === placementId ? { ...p, arrival_state: nextState } : p)));
  }

  function handleToggleTask(placementId, taskId, nextValue) {
    setPlacements((prev) =>
      prev.map((p) =>
        p.id === placementId
          ? { ...p, logistics_checklist: p.logistics_checklist.map((t) => (t.id === taskId ? { ...t, is_complete: nextValue } : t)) }
          : p
      )
    );
  }

  const visiblePlacements =
    arrivalFilter === 'All Placements' ? placements : placements.filter((p) => p.arrival_state === arrivalFilter);

  // Summary metrics for the stat card strip — plain derived counts, no
  // separate state needed since they're computed fresh on every render
  // from the same `placements` array everything else reads from.
  const totalPlacements = placements.length;
  const awaitingArrivalCount = placements.filter((p) => p.arrival_state === 'AWAITING_ARRIVAL').length;
  const housingConfirmedCount = placements.filter((p) => p.arrival_state === 'HOUSING_CONFIRMED' || p.arrival_state === 'ORIENTATION_COMPLETE').length;
  const orientationCompleteCount = placements.filter((p) => p.arrival_state === 'ORIENTATION_COMPLETE').length;

  return (
    <div className="bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white shadow-sm rounded-none p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Host Coordinator Dashboard</h1>
              <p className="text-xs text-slate-500">Tracking {totalPlacements} inbound student placement(s)</p>
            </div>
          </div>
          <CustomDropdown label="Arrival State" value={arrivalFilter} options={ARRIVAL_FILTER_OPTIONS} onChange={setArrivalFilter} />
        </header>

        {/* Demo-mode notice — honest about the data source, not hidden from
            the person presenting this. Remove once real endpoints exist. */}
        <div className="flex items-center gap-2 border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800 rounded-none">
          <ClipboardList className="h-3.5 w-3.5 shrink-0" />
          Placement and logistics endpoints are still being built on the backend — this view runs on illustrative sample data.
        </div>

        {/* Summary stat card strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Users} label="Total Placements" value={totalPlacements} tone="slate" />
          <StatCard icon={CalendarClock} label="Awaiting Arrival" value={awaitingArrivalCount} tone="amber" />
          <StatCard icon={Home} label="Housing Confirmed" value={housingConfirmedCount} tone="navy" />
          <StatCard icon={UserCheck} label="Orientation Complete" value={orientationCompleteCount} tone="emerald" />
        </div>

        <section className="border border-slate-200 bg-white shadow-sm rounded-none">
          {visiblePlacements.length === 0 ? (
            <EmptyState label="No placements match the current filter." />
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-8 px-4 py-2" />
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Home University</th>
                  <th className="px-4 py-2">Program Term</th>
                  <th className="px-4 py-2">Expected Arrival</th>
                  <th className="px-4 py-2">Arrival State</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlacements.map((placement) => (
                  <Fragment key={placement.id}>
                    <tr onClick={() => toggleRow(placement.id)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400">
                        <ChevronRight className={`h-4 w-4 transition-transform ${expandedId === placement.id ? 'rotate-90' : ''}`} />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{placement.student_name}</td>
                      <td className="px-4 py-3 text-slate-600">{placement.home_university}</td>
                      <td className="px-4 py-3 text-slate-600">{placement.program_term}</td>
                      <td className="px-4 py-3 text-slate-600">{placement.expected_arrival_date}</td>
                      <td className="px-4 py-3">
                        <Badge tone={toneForArrivalState(placement.arrival_state)}>{placement.arrival_state.replace(/_/g, ' ')}</Badge>
                      </td>
                    </tr>

                    {expandedId === placement.id && (
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <td colSpan={6} className="space-y-4 px-4 py-4">
                          <div>
                            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Arrival Pipeline</h3>
                            <ArrivalStepper currentStateKey={placement.arrival_state} placementId={placement.id} onAdvance={handleAdvanceArrival} />
                          </div>
                          <div>
                            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Logistics Checklist</h3>
                            <LogisticsChecklist placementId={placement.id} tasks={placement.logistics_checklist} onToggle={handleToggleTask} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
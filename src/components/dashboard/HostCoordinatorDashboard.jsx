import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Users,
  Plane,
  Home,
  ClipboardCheck,
  CheckSquare,
  Square,
  ChevronRight,
  ArrowRight,
  Loader2,
  CalendarClock,
} from 'lucide-react';
import { CustomDropdown, Badge, LoadingRow, EmptyState } from '../shared/DashboardUI';
import { getInboundPlacements, updateArrivalState, toggleLogisticsTask } from '../../api/hostcoord';

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

function ArrivalStepper({ currentStateKey, placementId, onAdvance, isAdvancing }) {
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
          disabled={isAdvancing}
          onClick={() => onAdvance(placementId, nextStage.key)}
          className="flex shrink-0 items-center gap-1.5 border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900 disabled:opacity-50"
        >
          {isAdvancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
          Mark {nextStage.label}
        </button>
      )}
    </div>
  );
}

function LogisticsChecklist({ placementId, tasks, onToggle, pendingTaskId }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          disabled={pendingTaskId === task.id}
          onClick={() => onToggle(placementId, task.id, !task.is_complete)}
          className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 rounded-none hover:border-slate-400 disabled:opacity-50"
        >
          {pendingTaskId === task.id ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
          ) : task.is_complete ? (
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

export default function HostCoordinatorDashboard() {
  const [placements, setPlacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [arrivalFilter, setArrivalFilter] = useState('All Placements');
  const [expandedId, setExpandedId] = useState(null);
  const [advancingId, setAdvancingId] = useState(null);
  const [pendingTaskId, setPendingTaskId] = useState(null);

  const fetchPlacements = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getInboundPlacements();
      setPlacements(response.data);
    } catch (err) {
      setPlacements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  function toggleRow(placementId) {
    setExpandedId((prev) => (prev === placementId ? null : placementId));
  }

  async function handleAdvanceArrival(placementId, nextState) {
    setAdvancingId(placementId);
    try {
      await updateArrivalState(placementId, nextState);
      await fetchPlacements();
    } catch (err) {
      // Catch layout error gracefully
    } finally {
      setAdvancingId(null);
    }
  }

  async function handleToggleTask(placementId, taskId, nextValue) {
    setPendingTaskId(taskId);
    try {
      await toggleLogisticsTask(placementId, taskId, nextValue);
      await fetchPlacements();
    } catch (err) {
      // Catch checkbox network drops smoothly
    } finally {
      setPendingTaskId(null);
    }
  }

  const visiblePlacements =
    arrivalFilter === 'All Placements' ? placements : placements.filter((p) => p.arrival_state === arrivalFilter);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white shadow-sm rounded-none p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Host Coordinator Dashboard</h1>
              <p className="text-xs text-slate-500">Tracking {placements.length} inbound student placement(s)</p>
            </div>
          </div>
          <CustomDropdown label="Arrival State" value={arrivalFilter} options={ARRIVAL_FILTER_OPTIONS} onChange={setArrivalFilter} />
        </header>

        <section className="border border-slate-200 bg-white shadow-sm rounded-none">
          {isLoading ? (
            <LoadingRow label="Loading placements…" />
          ) : visiblePlacements.length === 0 ? (
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
                    <tr
                      onClick={() => toggleRow(placement.id)}
                      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-slate-400">
                        <ChevronRight className={`h-4 w-4 transition-transform ${expandedId === placement.id ? 'rotate-90' : ''}`} />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{placement.student_name}</td>
                      <td className="px-4 py-3 text-slate-600">{placement.home_university}</td>
                      <td className="px-4 py-3 text-slate-600">{placement.program_term}</td>
                      <td className="px-4 py-3 text-slate-600">{placement.expected_arrival_date}</td>
                      <td className="px-4 py-3">
                        <Badge tone={toneForArrivalState(placement.arrival_state)}>
                          {placement.arrival_state.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    </tr>

                    {expandedId === placement.id && (
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <td colSpan={6} className="space-y-4 px-4 py-4">
                          <div>
                            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Arrival Pipeline</h3>
                            <ArrivalStepper
                              currentStateKey={placement.arrival_state}
                              placementId={placement.id}
                              onAdvance={handleAdvanceArrival}
                              isAdvancing={advancingId === placement.id}
                            />
                          </div>
                          <div>
                            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Logistics Checklist</h3>
                            <LogisticsChecklist
                              placementId={placement.id}
                              tasks={placement.logistics_checklist}
                              onToggle={handleToggleTask}
                              pendingTaskId={pendingTaskId}
                            />
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
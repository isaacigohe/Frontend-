// =============================================================================
// src/components/dashboard/shared/ProgressBar.jsx
// -----------------------------------------------------------------------------
// Reusable progress bar component for document upload progress.
// =============================================================================

export function ProgressBar({ value, max, label, color = 'gold' }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  
  const colorClasses = {
    gold: 'bg-gold-500',
    emerald: 'bg-emerald-500',
    navy: 'bg-navy-700',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    slate: 'bg-slate-500',
  };

  const barColor = colorClasses[color] || colorClasses.gold;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden bg-slate-200 rounded-none">
        <div
          className={`h-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
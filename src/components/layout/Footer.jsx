// =============================================================================
// src/components/layout/Footer.jsx
// -----------------------------------------------------------------------------
// Minimal institutional footer, shared across the three authenticated
// dashboards via DashboardLayout.
// =============================================================================

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4">
      <p className="text-center text-xs text-slate-400">
        © {new Date().getFullYear()} GlobalScholar — International Academic Exchange Network
      </p>
    </footer>
  );
}
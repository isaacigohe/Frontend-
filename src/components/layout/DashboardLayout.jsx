// =============================================================================
// src/components/layout/DashboardLayout.jsx
// -----------------------------------------------------------------------------
// Wraps Header + page content + Footer into one consistent shell. Applied at
// the router level in App.jsx around the three protected dashboard routes
// (Student, Admin, Host Coordinator) — NOT around the public ExploreCatalog,
// which already has its own hero navigation for logged-out visitors.
//
// `flex flex-col` + `flex-1` on <main> is what makes the footer stick to the
// bottom of short pages instead of floating up under the content.
// =============================================================================

import Header from './Header';
import Footer from './Footer';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
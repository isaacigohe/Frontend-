// =============================================================================
// ExploreCatalog.jsx
// -----------------------------------------------------------------------------
// PUBLIC landing / explore page, mounted at the root route "/". No auth
// required — this is the first thing a prospective student sees.
//
// NEW: Card-based grid layout with university images and "View More" buttons.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Globe,
  Languages,
  ChevronDown,
  GraduationCap,
  CalendarClock,
  ArrowRight,
  ImageIcon,
  MapPin,
  LogIn,
  UserPlus,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CustomDropdown, Badge, PaginationFooter, LoadingRow, EmptyState, advisoryBadgeMeta, LANGUAGE_CHOICES, degreeLevelLabel } from './shared/DashboardUI';
import { getPublicUniversities } from '../../api/public';

const PAGE_SIZE = 6; // 6 universities per page
const COUNTRY_OPTIONS = ['All Countries', 'United States', 'United Kingdom', 'Germany', 'Japan', 'South Korea', 'Australia', 'France', 'Spain'];
const LANGUAGE_OPTIONS = ['All Languages', ...LANGUAGE_CHOICES];

// ── University Card ──────────────────────────────────────────────────────────
function UniversityCard({ university }) {
  const navigate = useNavigate();
  const imageUrl = university.image_url || null;
  const hasImage = Boolean(imageUrl);
  const { tone, label } = advisoryBadgeMeta(university.travel_advisory_level);
  const toneClasses = {
    slate: 'border-slate-300 text-slate-500',
    emerald: 'border-emerald-500 text-emerald-700',
    amber: 'border-amber-500 text-amber-700',
    orange: 'border-orange-500 text-orange-700',
    red: 'border-red-600 text-red-700',
  }[tone];

  const handleViewMore = () => {
    navigate(`/universities/${university.id}`);
  };

  return (
    <div className="group flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      {/* ── Image ────────────────────────────────────────────────────────────── */}
      <div className="relative h-48 w-full overflow-hidden bg-navy-900">
        {hasImage ? (
          <img
            src={imageUrl}
            alt={university.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-700 to-navy-900">
            <span className="text-4xl font-bold text-white/20">
              {university.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Advisory Level Badge (top right corner) */}
        <div className="absolute right-3 top-3">
          <span className={`inline-flex items-center gap-1 border bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClasses}`}>
            <MapPin className="h-3 w-3" />
            {label}
          </span>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold uppercase tracking-wide text-navy-900 line-clamp-1">
          {university.name}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {university.city ? `${university.city}, ` : ''}{university.country}
        </p>
        <p className="text-xs text-slate-500">
          {university.primary_language} · GPA: {university.minimum_gpa}
        </p>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-400">
            {university.program_count || 0} program{university.program_count !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={handleViewMore}
            className="flex items-center gap-1 border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-slate-900"
          >
            View More <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HeroSection ──────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-navy-900">
      <div className="absolute inset-0 bg-navy-900">
        <div className="flex h-full w-full items-center justify-center opacity-[0.06]">
          <ImageIcon className="h-40 w-40 text-white" strokeWidth={1} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/85 to-navy-900/60" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-500">Global Exchange Network</p>
        <h1 className="max-w-2xl text-4xl font-bold uppercase leading-tight tracking-tight text-white sm:text-5xl">
          Study Abroad, Backed by an Institution You Can Trust
        </h1>
        <div className="my-6 h-px w-24 bg-gold-500" />
        <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Browse partner universities, review academic programs and application deadlines, and take the first step
          toward your international exchange term — before you ever create an account.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/login"
            className="flex items-center gap-2 bg-gold-500 px-6 py-3 text-xs font-bold uppercase tracking-wide text-navy-900 transition-colors hover:bg-gold-600"
          >
            <LogIn className="h-4 w-4" />
            Sign In to Apply
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-2 border border-white/30 px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:border-white hover:bg-white/10"
          >
            <UserPlus className="h-4 w-4" />
            Create an Account
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── TOP-LEVEL: ExploreCatalog ──────────────────────────────────────────────
export default function ExploreCatalog() {
  const [universities, setUniversities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [country, setCountry] = useState('All Countries');
  const [language, setLanguage] = useState('All Languages');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchUniversities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page };
      if (country !== 'All Countries') params.country = country;
      if (language !== 'All Languages') params.language = language;
      if (searchQuery) params.search = searchQuery;
      const response = await getPublicUniversities(params);
      setUniversities(response.data.results);
      setTotalCount(response.data.count);
    } catch (err) {
      setError('Could not load the university catalog right now. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [page, country, language, searchQuery]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  function handleCountryChange(value) {
    setCountry(value);
    setPage(1);
  }
  function handleLanguageChange(value) {
    setLanguage(value);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-canvas">
      <HeroSection />

      {/* ── FILTER BAR ──────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Explore</p>
            <h2 className="text-lg font-bold uppercase tracking-wide text-navy-900">Partner Universities</h2>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative">
              <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Search className="h-3.5 w-3.5" />
                Search
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="University name…"
                className="w-52 border border-slate-300 bg-white px-3 py-2 text-sm text-navy-900 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <CustomDropdown label="Country" icon={Globe} value={country} options={COUNTRY_OPTIONS} onChange={handleCountryChange} />
            <CustomDropdown label="Language" icon={Languages} value={language} options={LANGUAGE_OPTIONS} onChange={handleLanguageChange} />
          </div>
        </div>
      </section>

      {/* ── UNIVERSITY GRID ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-6">
        {isLoading ? (
          <LoadingRow label="Loading catalog…" />
        ) : error ? (
          <div className="border border-red-300 bg-red-50 p-6 text-sm text-red-600 rounded-none">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-red-500" />
            {error}
          </div>
        ) : universities.length === 0 ? (
          <EmptyState label="No universities match the current filters." />
        ) : (
          <>
            {/* Grid: 3 columns on large screens, 2 on medium, 1 on small */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {universities.map((university) => (
                <UniversityCard key={university.id} university={university} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} universities
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="flex items-center gap-1 border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 rounded-none hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <span className="flex items-center px-3 py-1.5 text-xs text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="flex items-center gap-1 border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 rounded-none hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── CLOSING CTA BANNER ────────────────────────────────────────────── */}
      <section className="mt-12 bg-navy-900 px-6 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl text-2xl font-bold uppercase tracking-wide text-white">
            Ready to Begin Your Exchange Application?
          </h2>
          <div className="h-px w-16 bg-gold-500" />
          <Link
            to="/register"
            className="flex items-center gap-2 bg-gold-500 px-8 py-3 text-xs font-bold uppercase tracking-wide text-navy-900 transition-colors hover:bg-gold-600"
          >
            Create an Account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
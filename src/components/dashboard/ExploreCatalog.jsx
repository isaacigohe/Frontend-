// =============================================================================
// ExploreCatalog.jsx
// -----------------------------------------------------------------------------
// PUBLIC landing / explore page, mounted at the root route "/". No auth
// required — this is the first thing a prospective student sees, before
// they ever create an account.
//
// Layout, top to bottom:
//   1. Hero — full-bleed navy gradient with an image-wrapper slot, headline,
//      and the two primary CTAs (Sign In / Create Account).
//   2. Filter bar — search + country/language dropdowns over the public
//      catalog.
//   3. Master list — one editorial-style row per university (sharp
//      dividers, no cards). Clicking a row lazily fetches that university's
//      programs and slides open a detail drawer beneath it.
//
// NEW: University images are displayed using the `image_url` field from
// the backend. If no image exists, a fallback placeholder is shown.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { CustomDropdown, Badge, PaginationFooter, LoadingRow, EmptyState, advisoryBadgeMeta, LANGUAGE_CHOICES, degreeLevelLabel } from './shared/DashboardUI';
import { getPublicUniversities, getUniversityPrograms } from '../../api/public';

const PAGE_SIZE = 10;
const COUNTRY_OPTIONS = ['All Countries', 'United States', 'United Kingdom', 'Germany', 'Japan', 'South Korea', 'Australia', 'France', 'Spain'];
const LANGUAGE_OPTIONS = ['All Languages', ...LANGUAGE_CHOICES];

// ── HeroSection ──────────────────────────────────────────────────────────────
function HeroSection({ backgroundImageUrl }) {
  return (
    <section className="relative overflow-hidden bg-navy-900">
      <div
        className="absolute inset-0 bg-navy-900"
        style={backgroundImageUrl ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {!backgroundImageUrl && (
          <div className="flex h-full w-full items-center justify-center opacity-[0.06]">
            <ImageIcon className="h-40 w-40 text-white" strokeWidth={1} />
          </div>
        )}
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

// ── ProgramDrawer ────────────────────────────────────────────────────────────
function ProgramDrawer({ isOpen, cacheEntry, universityName }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out"
      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-6">
          {!cacheEntry || cacheEntry.status === 'loading' ? (
            <LoadingRow label={`Loading ${universityName}'s programs…`} />
          ) : cacheEntry.status === 'error' ? (
            <p className="py-4 text-sm text-crimson-600">Could not load programs for this university. Please retry.</p>
          ) : cacheEntry.programs.length === 0 ? (
            <EmptyState label="No published programs for this university yet." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cacheEntry.programs.map((program) => (
                <div key={program.id} className="border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-2">
                    <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" />
                    <div>
                      <h4 className="text-sm font-semibold text-navy-900">{program.name}</h4>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{degreeLevelLabel(program.degree_level)}</p>
                    </div>
                  </div>
                  <div className="my-3 h-px bg-slate-200" />
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                      Deadline: <span className="font-medium text-slate-800">{program.application_deadline || 'Not yet published'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                      {program.duration_semesters} semester{program.duration_semesters === 1 ? '' : 's'}
                      {program.tuition_per_semester_usd ? ` · $${Number(program.tuition_per_semester_usd).toLocaleString()}/semester` : ''}
                    </div>
                  </div>
                  {program.credits_transferable && (
                    <span className="mt-2 inline-block border border-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Credits Transferable
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── UniversityRow ────────────────────────────────────────────────────────────
// NEW: Displays university image if available, otherwise shows fallback.
function UniversityRow({ university, isExpanded, onToggle, cacheEntry }) {
  // Determine image source - use image_url from backend or fallback
  const imageUrl = university.image_url || null;
  const hasImage = Boolean(imageUrl);

  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => onToggle(university.id)}
        className="group flex w-full items-center gap-5 px-6 py-5 text-left transition-colors hover:bg-slate-50"
      >
        {/* ── Image / Placeholder ───────────────────────────────────────────── */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-navy-900 transition-transform duration-200 ease-out group-hover:-skew-x-3">
          {hasImage ? (
            <img
              src={imageUrl}
              alt={university.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Building2 className="h-6 w-6 text-white/40" strokeWidth={1.5} />
          )}
        </div>

        {/* ── University Info ────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-bold uppercase tracking-wide text-navy-900">{university.name}</h3>
            {(() => {
              const { tone, label } = advisoryBadgeMeta(university.travel_advisory_level);
              return (
                <span className="inline-flex items-center gap-1">
                  <Badge tone={tone}>
                    <MapPin className="mr-0.5 inline h-3 w-3" />
                    {label}
                  </Badge>
                </span>
              );
            })()}
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            {university.city ? `${university.city}, ` : ''}
            {university.country} · {university.primary_language}
          </p>
        </div>

        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-gold-600' : ''}`} />
      </button>

      <ProgramDrawer isOpen={isExpanded} cacheEntry={cacheEntry} universityName={university.name} />
    </div>
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

  const [expandedId, setExpandedId] = useState(null);
  const [programsCache, setProgramsCache] = useState({});

  // Debounce the search box
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

  async function handleToggleRow(universityId) {
    if (expandedId === universityId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(universityId);

    if (programsCache[universityId]) return;

    setProgramsCache((prev) => ({ ...prev, [universityId]: { status: 'loading' } }));
    try {
      const response = await getUniversityPrograms(universityId);
      setProgramsCache((prev) => ({ ...prev, [universityId]: { status: 'ready', programs: response.data } }));
    } catch (err) {
      setProgramsCache((prev) => ({ ...prev, [universityId]: { status: 'error' } }));
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-canvas">
      <HeroSection />

      {/* FILTER BAR */}
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

      {/* MASTER LIST */}
      <section className="mx-auto max-w-6xl px-6 py-2">
        <div className="border border-slate-200 bg-white">
          {isLoading ? (
            <LoadingRow label="Loading catalog…" />
          ) : error ? (
            <p className="p-6 text-sm text-crimson-600">{error}</p>
          ) : universities.length === 0 ? (
            <EmptyState label="No universities match the current filters." />
          ) : (
            universities.map((university) => (
              <UniversityRow
                key={university.id}
                university={university}
                isExpanded={expandedId === university.id}
                cacheEntry={programsCache[university.id]}
                onToggle={handleToggleRow}
              />
            ))
          )}
        </div>
        {!isLoading && !error && universities.length > 0 && (
          <div className="border border-t-0 border-slate-200 bg-white">
            <PaginationFooter page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </section>

      {/* CLOSING CTA BANNER */}
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
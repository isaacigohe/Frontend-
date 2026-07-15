// =============================================================================
// src/components/dashboard/UniversityDetail.jsx
// -----------------------------------------------------------------------------
// University Detail Page - Shows full university info with program cards,
// descriptions, and pagination.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  CalendarClock,
  ExternalLink,
  Languages,
  ImageIcon,
  LogIn,
  Loader2,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  DollarSign,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { getUniversityDetail, getUniversityPrograms } from '../../api/public';
import { advisoryBadgeMeta, degreeLevelLabel, Badge, LoadingRow, EmptyState } from './shared/DashboardUI';

const PROGRAMS_PER_PAGE = 10;

export default function UniversityDetail() {
  const { id } = useParams();
  const [university, setUniversity] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [programsCount, setProgramsCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProgramsLoading, setIsProgramsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { tone: advisoryTone, label: advisoryLabel } = advisoryBadgeMeta(university?.travel_advisory_level || 'UNKNOWN');
  const advisoryToneClasses = {
    slate: 'border-slate-300 text-slate-500',
    emerald: 'border-emerald-500 text-emerald-700',
    amber: 'border-amber-500 text-amber-700',
    orange: 'border-orange-500 text-orange-700',
    red: 'border-red-600 text-red-700',
  }[advisoryTone];

  const fetchUniversity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUniversityDetail(id);
      setUniversity(response.data);
    } catch (err) {
      console.error('Failed to fetch university:', err);
      setError('Could not load this university. It may not exist or the server is unreachable.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchPrograms = useCallback(async () => {
    setIsProgramsLoading(true);
    try {
      const response = await getUniversityPrograms(id, { page });
      setPrograms(response.data || []);
      setProgramsCount(response.count || 0);
    } catch (err) {
      console.error('Failed to fetch programs:', err);
      setPrograms([]);
      setProgramsCount(0);
    } finally {
      setIsProgramsLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    fetchUniversity();
  }, [fetchUniversity]);

  useEffect(() => {
    if (university) {
      fetchPrograms();
    }
  }, [fetchPrograms, university]);

  const totalPages = Math.max(1, Math.ceil(programsCount / PROGRAMS_PER_PAGE));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-canvas text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading university…
      </div>
    );
  }

  if (error || !university) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-sm text-red-600">{error || 'University not found.'}</p>
        <Link to="/" className="text-xs font-semibold uppercase tracking-wide text-navy-700 hover:text-gold-600">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <div className="relative h-48 w-full overflow-hidden bg-navy-800">
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-6xl font-bold text-white/20">
            {university.name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/70 to-transparent" />
        
        {/* Back Button */}
        <Link
          to="/"
          className="absolute left-6 top-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:text-gold-500 transition-colors z-10"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Catalog
        </Link>

        {/* Hero Content */}
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white">{university.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-200">
            <MapPin className="h-4 w-4" />
            {university.city ? `${university.city}, ` : ''}{university.country}
          </p>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* ── Quick Facts Bar ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4 mb-6">
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-600">
            <Languages className="h-3.5 w-3.5" />
            {university.primary_language}
          </span>
          <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase ${advisoryToneClasses}`}>
            <MapPin className="h-3.5 w-3.5" />
            {advisoryLabel}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-600">
            <GraduationCap className="h-3.5 w-3.5" />
            GPA: {university.minimum_gpa}
          </span>
          {university.max_international_students != null && (
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-600">
              <Users className="h-3.5 w-3.5" />
              Cap: {university.max_international_students}/yr
            </span>
          )}
          {university.website && (
            <a
              href={university.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-navy-700 bg-navy-700 px-3 py-1 text-xs font-semibold uppercase text-white transition-colors hover:bg-navy-800"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit Website
            </a>
          )}
        </div>

        {/* ── Programs Section ────────────────────────────────────────────── */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Academic Programs {programsCount > 0 && `(${programsCount})`}
            </h2>
            <span className="text-xs text-slate-400">
              Showing {programs.length} of {programsCount}
            </span>
          </div>

          {isProgramsLoading ? (
            <LoadingRow label="Loading programs…" />
          ) : programs.length === 0 ? (
            <EmptyState label="No published programs for this university yet." />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {programs.map((program) => (
                  <div key={program.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-navy-900">{program.name}</h3>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{degreeLevelLabel(program.degree_level)}</p>
                      </div>
                      {program.credits_transferable && (
                        <Badge tone="emerald">Credits Transferable</Badge>
                      )}
                    </div>

                    <div className="my-3 h-px bg-slate-200" />

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {program.duration_semesters} semester{program.duration_semesters === 1 ? '' : 's'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                        Deadline: {program.application_deadline ? new Date(program.application_deadline).toLocaleDateString() : 'Not set'}
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        {program.tuition_per_semester_usd
                          ? `$${Number(program.tuition_per_semester_usd).toLocaleString()}/semester`
                          : 'Tuition not specified'}
                      </div>
                    </div>

                    {program.description && (
                      <div className="mt-3 rounded border-l-2 border-gold-400 bg-slate-50 p-3">
                        <p className="text-xs text-slate-600 leading-relaxed">{program.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-xs text-slate-500">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => prev - 1)}
                      className="flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((prev) => prev + 1)}
                      className="flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Sign In to Apply ────────────────────────────────────────────── */}
        <div className="mt-8 flex justify-start">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 border border-slate-800 bg-slate-800 px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-slate-900"
          >
            <LogIn className="h-4 w-4" />
            Sign In to Apply
          </Link>
        </div>
      </div>
    </div>
  );
}
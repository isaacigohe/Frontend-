// =============================================================================
// src/components/dashboard/UniversityDetail.jsx  (CORRECTED against the real
// universities/models.py and serializers.py)
// -----------------------------------------------------------------------------
// Three things changed from the first version, now that we have the real
// model/serializer:
//   1. ONE network call, not two. UniversitySerializer already nests the
//      full `programs` array — there is no need for a separate
//      getUniversityPrograms() request.
//   2. `description`, `website_url`, and `image_url` do not exist on
//      University. The real fields are `website` (a URL) and nothing else
//      photo/description-shaped — so the "About" text block is replaced
//      with an "Admissions Requirements" section built from fields that
//      actually exist (minimum_gpa, primary_language, language_test_required,
//      minimum_language_score, max_international_students).
//   3. travel_advisory_level is a STRING CODE (UNKNOWN/NORMAL/LEVEL_1..4),
//      not a number — uses the shared advisoryBadgeMeta() helper so this
//      page can never disagree with the catalog's badge again.
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
} from 'lucide-react';
import { getUniversityDetail } from '../../api/public';
import { advisoryBadgeMeta, degreeLevelLabel } from './shared/DashboardUI';

export default function UniversityDetail() {
  const { id } = useParams(); // campus id straight from the URL param
  const [university, setUniversity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // CONFIRMED: UniversitySerializer already embeds `programs` (nested
  // ProgramSerializer list) on the single detail response — one fetch
  // gets us everything this page needs.
  const fetchUniversity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUniversityDetail(id);
      setUniversity(response.data);
    } catch (err) {
      setError('Could not load this university. It may not exist or the server is unreachable.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUniversity();
  }, [fetchUniversity]);

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
        <p className="text-sm text-red-600">{error || 'University not found.'}</p>
        <Link to="/" className="text-xs font-semibold uppercase tracking-wide text-navy-700 hover:text-gold-600">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const { tone: advisoryTone, label: advisoryLabel } = advisoryBadgeMeta(university.travel_advisory_level);
  const advisoryToneClasses = {
    slate: 'border-slate-300 text-slate-500',
    emerald: 'border-emerald-500 text-emerald-700',
    amber: 'border-amber-500 text-amber-700',
    orange: 'border-orange-500 text-orange-700',
    red: 'border-red-600 text-red-700',
  }[advisoryTone];

  const programs = university.programs ?? [];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero banner. NOTE: University has no image field on the backend at
          all right now (confirmed against the model) — this is a design
          placeholder, not a broken image reference. If you add a photo
          field to the model later, swap the placeholder block below for
          an <img src={university.photo} />. */}
      <div className="relative h-64 overflow-hidden bg-navy-900">
        <div className="flex h-full items-center justify-center opacity-10">
          <ImageIcon className="h-24 w-24 text-white" strokeWidth={1} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
        <Link
          to="/"
          className="absolute left-6 top-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:text-gold-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Catalog
        </Link>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-white">{university.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-200">
            <MapPin className="h-4 w-4" />
            {university.city ? `${university.city}, ` : ''}
            {university.country}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {/* Quick facts strip */}
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1 border border-slate-300 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
            <Languages className="h-3.5 w-3.5" />
            {university.primary_language}
          </span>
          <span className={`flex items-center gap-1 border px-3 py-1 text-xs font-semibold uppercase ${advisoryToneClasses}`}>
            <MapPin className="h-3.5 w-3.5" />
            {advisoryLabel}
          </span>
          {university.max_international_students != null && (
            <span className="flex items-center gap-1 border border-slate-300 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
              <Users className="h-3.5 w-3.5" />
              Cap: {university.max_international_students}/yr
            </span>
          )}
          {university.website && (
            <a
              href={university.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 border border-navy-700 px-3 py-1 text-xs font-semibold uppercase text-navy-700 hover:bg-navy-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit Website
            </a>
          )}
        </div>

        {/* Admissions Requirements — replaces the old "About" text block,
            which was built against description/website_url fields that
            don't exist on this model. Every value here is a real,
            confirmed field. */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Admissions Requirements</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 border border-slate-200 bg-white p-3">
              <GraduationCap className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-700">
                Minimum GPA: <span className="font-semibold text-slate-900">{university.minimum_gpa}</span> / 4.00
              </span>
            </div>
            <div className="flex items-center gap-2 border border-slate-200 bg-white p-3">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-700">
                Language test required:{' '}
                <span className="font-semibold text-slate-900">
                  {university.language_test_required
                    ? `Yes${university.minimum_language_score ? ` (min. score ${university.minimum_language_score})` : ''}`
                    : 'No'}
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* Programs — already nested in this same response, no second fetch. */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
            Academic Programs {university.program_count != null && `(${university.program_count})`}
          </h2>
          {programs.length === 0 ? (
            <p className="text-sm text-slate-400">No published programs for this university yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <div key={program.id} className="border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-navy-900">{program.name}</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{degreeLevelLabel(program.degree_level)}</p>
                  <div className="my-3 h-px bg-slate-200" />
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                      Deadline: <span className="font-medium text-slate-800">{program.application_deadline || 'Not yet published'}</span>
                    </div>
                    <div>
                      {program.duration_semesters} semester{program.duration_semesters === 1 ? '' : 's'}
                      {program.tuition_per_semester_usd
                        ? ` · $${Number(program.tuition_per_semester_usd).toLocaleString()}/semester`
                        : ''}
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
        </section>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-gold-500 px-6 py-3 text-xs font-bold uppercase tracking-wide text-navy-900 hover:bg-gold-600"
        >
          <LogIn className="h-4 w-4" />
          Sign In to Apply
        </Link>
      </div>
    </div>
  );
}
// src/pages/auth/RegisterPage.jsx
// Registration page with role selector, student-type toggle
// (University Exchange Student vs High School Applicant), and a
// dynamic "unlisted home university" notice that explains the
// onboarding path for institutions not yet in our catalog.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, AlertCircle, Loader2, CheckCircle,
  School, BookOpen, Info,
} from 'lucide-react';

// Three account roles — map directly to backend User.Role choices
const ROLES = [
  { value: 'STUDENT', label: 'Student', desc: 'Apply for exchange programs' },
  { value: 'HOME_ADMIN', label: 'Home Administrator', desc: 'Review and approve applications' },
  { value: 'HOST_COORD', label: 'Host Coordinator', desc: 'Manage credit transfers' },
];

// Student sub-type toggle — map to backend User.StudentType choices.
// This is the "High School Applicant Toggle" your teacher requested.
const STUDENT_TYPES = [
  {
    value: 'UNDERGRADUATE',
    label: 'University Exchange Student',
    icon: BookOpen,
    desc: 'Currently enrolled at a university — GPA and major required',
  },
  {
    value: 'HIGH_SCHOOL',
    label: 'High School Applicant',
    icon: School,
    desc: 'Exploring study-abroad options — diploma and references instead of GPA',
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'STUDENT',
    student_type: 'UNDERGRADUATE',
    password: '',
    password_confirm: '',
    gpa: '',
    major: '',
    home_institution: '',
    enrollment_year: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const isStudent = form.role === 'STUDENT';
  const isHighSchool = form.student_type === 'HIGH_SCHOOL';
  const isUniversityStudent = isStudent && !isHighSchool;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Client-side validation mirrors the backend serializer rules exactly.
  // High school applicants skip the GPA/major requirement entirely —
  // the backend's requires_gpa_check property does the same skip.
  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required.';
    if (!form.first_name) e.first_name = 'First name is required.';
    if (!form.last_name) e.last_name = 'Last name is required.';
    if (!form.password) e.password = 'Password is required.';
    if (form.password.length < 8) e.password = 'Minimum 8 characters.';
    if (form.password !== form.password_confirm)
      e.password_confirm = 'Passwords do not match.';

    if (isUniversityStudent) {
      if (!form.gpa) e.gpa = 'GPA is required for university exchange students.';
      if (form.gpa && (parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 4.0))
        e.gpa = 'GPA must be between 0.00 and 4.00.';
      if (!form.major) e.major = 'Major is required for university exchange students.';
      if (!form.home_institution) e.home_institution = 'Home institution is required.';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    // Build payload — only include student fields when role is STUDENT,
    // and only include gpa/major when not a high school applicant
    const payload = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      role: form.role,
      password: form.password,
      password_confirm: form.password_confirm,
      ...(isStudent && {
        student_type: form.student_type,
        home_institution: form.home_institution || undefined,
        ...(isUniversityStudent && {
          gpa: form.gpa,
          major: form.major,
          enrollment_year: form.enrollment_year || undefined,
        }),
      }),
    };

    const user = await register(payload).catch((err) => {
      const data = err.response?.data;
      if (data && typeof data === 'object') setErrors(data);
      else setApiError('Registration failed. Please try again.');
      setLoading(false);
    });

    if (!user) return;

    if (user.role === 'STUDENT') navigate('/student');
    else if (user.role === 'HOME_ADMIN') navigate('/admin');
    else if (user.role === 'HOST_COORD') navigate('/coordinator');
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        <div className="flex items-center gap-2.5 mb-8">
          <GraduationCap className="text-navy-600" size={26} />
          <div>
            <h1 className="text-lg font-semibold text-ink-900">GlobalScholar</h1>
            <p className="text-xs text-ink-500">Create your institutional account</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="section-title">Account Registration</span>
          </div>

          <div className="panel-body">
            {apiError && (
              <div className="alert-error mb-5">
                <AlertCircle size={15} className="shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Role selector */}
              <div>
                <label className="input-label">Account type</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, role: r.value }))}
                      className={`text-left p-3 rounded border text-xs transition-colors ${
                        form.role === r.value
                          ? 'border-navy-500 bg-navy-50 text-navy-700'
                          : 'border-surface-300 bg-white text-ink-700 hover:border-surface-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{r.label}</span>
                        {form.role === r.value && <CheckCircle size={12} className="text-navy-500" />}
                      </div>
                      <span className="text-ink-500">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── HIGH SCHOOL APPLICANT TOGGLE ──────────────────────────
                  Only shows when role === STUDENT. Lets the person pick
                  between a currently-enrolled university student and a
                  high school applicant exploring options. This single
                  toggle changes which fields are required below. */}
              {isStudent && (
                <div>
                  <label className="input-label">Student category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STUDENT_TYPES.map((t) => {
                      const Icon = t.icon;
                      const active = form.student_type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, student_type: t.value }))}
                          className={`text-left p-3 rounded border text-xs transition-colors ${
                            active
                              ? 'border-navy-500 bg-navy-50 text-navy-700'
                              : 'border-surface-300 bg-white text-ink-700 hover:border-surface-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={14} className={active ? 'text-navy-600' : 'text-ink-400'} />
                            <span className="font-semibold">{t.label}</span>
                          </div>
                          <span className="text-ink-500">{t.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">First name</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} className="input-field" placeholder="Ada" />
                  {errors.first_name && <p className="input-error">{errors.first_name}</p>}
                </div>
                <div>
                  <label className="input-label">Last name</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} className="input-field" placeholder="Lovelace" />
                  {errors.last_name && <p className="input-error">{errors.last_name}</p>}
                </div>
              </div>

              <div>
                <label className="input-label">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@institution.edu" />
                {errors.email && <p className="input-error">{errors.email}</p>}
              </div>

              {/* ── UNIVERSITY EXCHANGE STUDENT FIELDS ────────────────── */}
              {isUniversityStudent && (
                <>
                  <div className="divider" />
                  <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">
                    Academic information
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Current GPA (0.00–4.00)</label>
                      <input type="number" name="gpa" value={form.gpa} onChange={handleChange} step="0.01" min="0" max="4" className="input-field" placeholder="3.80" />
                      {errors.gpa && <p className="input-error">{errors.gpa}</p>}
                    </div>
                    <div>
                      <label className="input-label">Enrollment year</label>
                      <input type="number" name="enrollment_year" value={form.enrollment_year} onChange={handleChange} className="input-field" placeholder="2022" />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Declared major</label>
                    <input name="major" value={form.major} onChange={handleChange} className="input-field" placeholder="Computer Science" />
                    {errors.major && <p className="input-error">{errors.major}</p>}
                  </div>

                  <div>
                    <label className="input-label">Home institution</label>
                    <input name="home_institution" value={form.home_institution} onChange={handleChange} className="input-field" placeholder="University of Nairobi" />
                    {errors.home_institution && <p className="input-error">{errors.home_institution}</p>}

                    {/* ── UNLISTED UNIVERSITY NOTICE ──────────────────────
                        Tells students their home institution does NOT need
                        to be in our catalog. Only the destination must
                        exist there. This satisfies the teacher's concern
                        about students from unregistered universities. */}
                    <div className="alert-info mt-2">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <span>
                        Your home institution does not need to be registered with
                        GlobalScholar — type it freely. Only your{' '}
                        <strong>destination</strong> university must exist in our
                        catalog for you to apply.
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* ── HIGH SCHOOL APPLICANT NOTICE ──────────────────────── */}
              {isHighSchool && (
                <>
                  <div className="divider" />
                  <div className="alert-info">
                    <School size={14} className="shrink-0 mt-0.5" />
                    <span>
                      No GPA or major needed. After registering you can browse
                      universities freely. When you apply, your application is
                      flagged for manual review by the destination's Home
                      Administrator, who will request your diploma and
                      reference letters instead of a university transcript.
                    </span>
                  </div>

                  <div className="mt-3">
                    <label className="input-label">Current school (optional)</label>
                    <input
                      name="home_institution"
                      value={form.home_institution}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Nairobi School"
                    />
                  </div>
                </>
              )}

              <div className="divider" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Password</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} className="input-field" placeholder="Min. 8 characters" />
                  {errors.password && <p className="input-error">{errors.password}</p>}
                </div>
                <div>
                  <label className="input-label">Confirm password</label>
                  <input type="password" name="password_confirm" value={form.password_confirm} onChange={handleChange} className="input-field" placeholder="Repeat password" />
                  {errors.password_confirm && <p className="input-error">{errors.password_confirm}</p>}
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-xs text-ink-500 text-center mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-navy-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
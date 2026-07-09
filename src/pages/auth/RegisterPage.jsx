// src/pages/auth/RegisterPage.jsx
// Registration page with role selector and student-type toggle.

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
  const [success, setSuccess] = useState(false);

  const isStudent = form.role === 'STUDENT';
  const isHighSchool = form.student_type === 'HIGH_SCHOOL';
  const isUniversityStudent = isStudent && !isHighSchool;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Client-side validation
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

    // Build payload
    const payload = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      role: form.role,
      password: form.password,
    };

    // Add student fields
    if (isStudent) {
      payload.student_type = form.student_type;
      payload.home_institution = form.home_institution || '';
      if (isUniversityStudent) {
        payload.gpa = parseFloat(form.gpa);
        payload.major = form.major;
        payload.enrollment_year = form.enrollment_year ? parseInt(form.enrollment_year) : null;
      }
    }

    try {
      const user = await register(payload);
      setSuccess(true);

      // Route to the correct dashboard
      if (user.role === 'STUDENT') navigate('/student');
      else if (user.role === 'HOME_ADMIN') navigate('/admin');
      else if (user.role === 'HOST_COORD') navigate('/coordinator');
      else navigate('/');
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        Object.keys(data).forEach((key) => {
          if (Array.isArray(data[key])) {
            fieldErrors[key] = data[key][0];
          } else {
            fieldErrors[key] = data[key];
          }
        });
        setErrors(fieldErrors);
        setApiError('Please fix the errors below.');
      } else {
        setApiError('Registration failed. Please try again.');
      }
      setLoading(false);
    }
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

        <div className="bg-white border border-surface-200 rounded shadow-sm">
          <div className="px-5 py-3.5 border-b border-surface-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-900 uppercase tracking-wide">Account Registration</span>
          </div>

          <div className="px-5 py-4">
            {apiError && (
              <div className="flex items-start gap-3 p-3.5 bg-crimson-50 border border-crimson-100 rounded text-sm text-crimson-700 mb-5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-700 mb-5">
                <CheckCircle size={15} className="shrink-0 mt-0.5" />
                <span>Account created successfully! Redirecting to your dashboard...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Role selector */}
              <div>
                <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Account type</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, role: r.value }))}
                      className={`text-left p-3 border text-xs transition-colors rounded-none ${
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

              {/* Student category toggle */}
              {isStudent && (
                <div>
                  <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Student category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STUDENT_TYPES.map((t) => {
                      const Icon = t.icon;
                      const active = form.student_type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, student_type: t.value }))}
                          className={`text-left p-3 border text-xs transition-colors rounded-none ${
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
                  <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">First name</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                    placeholder="Ada"
                  />
                  {errors.first_name && <p className="text-xs text-crimson-600 mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Last name</label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                    placeholder="Lovelace"
                  />
                  {errors.last_name && <p className="text-xs text-crimson-600 mt-1">{errors.last_name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                  placeholder="you@institution.edu"
                />
                {errors.email && <p className="text-xs text-crimson-600 mt-1">{errors.email}</p>}
              </div>

              {/* University Student Fields */}
              {isUniversityStudent && (
                <>
                  <div className="border-t border-surface-200 my-4" />
                  <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">Academic information</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Current GPA (0.00–4.00)</label>
                      <input
                        type="number"
                        name="gpa"
                        value={form.gpa}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        max="4"
                        className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                        placeholder="3.80"
                      />
                      {errors.gpa && <p className="text-xs text-crimson-600 mt-1">{errors.gpa}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Enrollment year</label>
                      <input
                        type="number"
                        name="enrollment_year"
                        value={form.enrollment_year}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                        placeholder="2022"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Declared major</label>
                    <input
                      name="major"
                      value={form.major}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                      placeholder="Computer Science"
                    />
                    {errors.major && <p className="text-xs text-crimson-600 mt-1">{errors.major}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Home institution</label>
                    <input
                      name="home_institution"
                      value={form.home_institution}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                      placeholder="University of Nairobi"
                    />
                    {errors.home_institution && <p className="text-xs text-crimson-600 mt-1">{errors.home_institution}</p>}
                    <div className="flex items-start gap-3 p-3 mt-2 bg-navy-50 border border-navy-200 rounded text-sm text-navy-700">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <span>
                        Your home institution does not need to be registered with GlobalScholar — type it freely. Only your{' '}
                        <strong>destination</strong> university must exist in our catalog for you to apply.
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* High School Applicant Notice */}
              {isHighSchool && (
                <>
                  <div className="border-t border-surface-200 my-4" />
                  <div className="flex items-start gap-3 p-3 bg-navy-50 border border-navy-200 rounded text-sm text-navy-700">
                    <School size={14} className="shrink-0 mt-0.5" />
                    <span>
                      No GPA or major needed. After registering you can browse universities freely. When you apply, your
                      application is flagged for manual review.
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Current school (optional)</label>
                    <input
                      name="home_institution"
                      value={form.home_institution}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                      placeholder="Nairobi School"
                    />
                  </div>
                </>
              )}

              <div className="border-t border-surface-200 my-4" />

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                    placeholder="Min. 8 characters"
                  />
                  {errors.password && <p className="text-xs text-crimson-600 mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Confirm password</label>
                  <input
                    type="password"
                    name="password_confirm"
                    value={form.password_confirm}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-surface-300 rounded text-sm text-ink-900 focus:border-gold-500 focus:outline-none"
                    placeholder="Repeat password"
                  />
                  {errors.password_confirm && <p className="text-xs text-crimson-600 mt-1">{errors.password_confirm}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white text-sm font-medium rounded border border-transparent transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
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
// src/pages/auth/RegisterPage.jsx
// Clean registration with side panel and 2-column layout
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUniversities } from '../../api/client';
import { 
  AlertTriangle, Loader2, Eye, EyeOff, GraduationCap, 
  Building2, User, School, Lock, UserPlus, ChevronRight
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'STUDENT',
    host_university: '',
    student_type: 'UNDERGRADUATE',
    gpa: '',
    major: '',
    home_institution: '',
    enrollment_year: '',
  });
  const [universities, setUniversities] = useState([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.role === 'HOST_COORD') {
      setIsLoadingUniversities(true);
      getUniversities({ page: 1, page_size: 100 })
        .then((response) => {
          const data = response.data.results || response.data || [];
          setUniversities(data);
        })
        .catch(() => setUniversities([]))
        .finally(() => setIsLoadingUniversities(false));
    }
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.role === 'HOST_COORD' && !formData.host_university) {
      setError('Please select the university you represent.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        host_university: formData.host_university || null,
        student_type: formData.student_type,
        gpa: formData.gpa || null,
        major: formData.major || null,
        home_institution: formData.home_institution || null,
        enrollment_year: formData.enrollment_year || null,
      };

      await register(payload);
      navigate('/login');
    } catch (err) {
      const responseData = err?.response?.data;
      if (typeof responseData === 'object') {
        const firstKey = Object.keys(responseData)[0];
        setError(responseData[firstKey]?.[0] || 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please check your information.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isUniversity = ['UNDERGRADUATE', 'POSTGRADUATE'].includes(formData.student_type);
  const isHighSchool = formData.student_type === 'HIGH_SCHOOL';
  const isIndependent = formData.student_type === 'INDEPENDENT';

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Hero ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-2/5 items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 p-8">
        <div className="max-w-xs text-center text-white">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/20">
            <GraduationCap className="h-7 w-7 text-gold-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Start Your Exchange Journey</h2>
          <p className="mt-2 text-sm text-navy-300 leading-relaxed">
            Join thousands of students who have found their perfect study abroad 
            program through GlobalScholar.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-0.5 w-8 rounded-full bg-gold-500" />
            <div className="h-0.5 w-12 rounded-full bg-navy-600" />
            <div className="h-0.5 w-8 rounded-full bg-navy-700" />
          </div>
          <div className="mt-4 space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-xs text-navy-300">
              <ChevronRight className="h-3 w-3 text-gold-500" />
              Apply to partner universities
            </div>
            <div className="flex items-center gap-2 text-xs text-navy-300">
              <ChevronRight className="h-3 w-3 text-gold-500" />
              Track your application in real-time
            </div>
            <div className="flex items-center gap-2 text-xs text-navy-300">
              <ChevronRight className="h-3 w-3 text-gold-500" />
              Connect with host coordinators
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Registration Form ────────────────────────────────── */}
      <div className="flex w-full items-center justify-center bg-white px-6 py-6 lg:w-3/5">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
              <GraduationCap className="h-5 w-5 text-gold-500" />
            </div>
            <span className="text-lg font-bold text-navy-900">GlobalScholar</span>
          </div>

          <div className="mb-4">
            <h1 className="text-xl font-bold text-navy-900">Create your account</h1>
            <p className="text-sm text-slate-500">Join the GlobalScholar network</p>
          </div>

          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* ── Row 1: Name ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="Alex"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Jordan"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>
            </div>

            {/* ── Email ────────────────────────────────────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="alex.jordan@gmail.com"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
              />
            </div>

            {/* ── Row 2: Password ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="8"
                    placeholder="Min 8 chars"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 pr-9 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Confirm Password</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 pr-9 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Role ──────────────────────────────────────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-slate-700">Register as</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
              >
                <option value="STUDENT">Student</option>
                <option value="HOME_ADMIN">Home Admin</option>
                <option value="HOST_COORD">Host Coordinator</option>
              </select>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {formData.role === 'HOST_COORD' && 'Select the university you represent.'}
                {formData.role === 'HOME_ADMIN' && 'Requires verification by Super Admin.'}
                {formData.role === 'STUDENT' && 'Automatically verified.'}
              </p>
            </div>

            {/* ── Host Coordinator ────────────────────────────────────────── */}
            {formData.role === 'HOST_COORD' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <label className="block text-xs font-medium text-amber-800">
                  <Building2 className="inline h-3.5 w-3.5 mr-1" />
                  University <span className="text-red-500">*</span>
                </label>
                <select
                  name="host_university"
                  value={formData.host_university}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                  disabled={isLoadingUniversities}
                >
                  <option value="">
                    {isLoadingUniversities ? 'Loading...' : 'Select a university...'}
                  </option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} ({uni.country})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ── Student Information ──────────────────────────────────────── */}
            {formData.role === 'STUDENT' && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <School className="h-3.5 w-3.5" />
                  Student Information
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Student Type</label>
                    <select
                      name="student_type"
                      value={formData.student_type}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                    >
                      <option value="UNDERGRADUATE">Undergraduate</option>
                      <option value="POSTGRADUATE">Postgraduate</option>
                      <option value="HIGH_SCHOOL">High School</option>
                      <option value="INDEPENDENT">Independent</option>
                    </select>
                  </div>

                  {isUniversity && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">GPA</label>
                        <input
                          type="number"
                          name="gpa"
                          value={formData.gpa}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                          max="4"
                          placeholder="3.50"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">Major</label>
                        <input
                          type="text"
                          name="major"
                          value={formData.major}
                          onChange={handleChange}
                          placeholder="CS"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">Home Institution</label>
                        <input
                          type="text"
                          name="home_institution"
                          value={formData.home_institution}
                          onChange={handleChange}
                          placeholder="University name"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">Enrollment Year</label>
                        <input
                          type="number"
                          name="enrollment_year"
                          value={formData.enrollment_year}
                          onChange={handleChange}
                          placeholder="2024"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                        />
                      </div>
                    </>
                  )}

                  {isHighSchool && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">High School Name</label>
                        <input
                          type="text"
                          name="home_institution"
                          value={formData.home_institution}
                          onChange={handleChange}
                          placeholder="High school name"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">Graduation Year</label>
                        <input
                          type="number"
                          name="enrollment_year"
                          value={formData.enrollment_year}
                          onChange={handleChange}
                          placeholder="2025"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                        />
                      </div>
                    </>
                  )}

                  {isIndependent && (
                    <div className="col-span-2 rounded-lg border border-purple-200 bg-purple-50 p-2 text-center">
                      <p className="text-xs text-purple-700">
                        🌱 No GPA, major, or institution details required.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Submit ────────────────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-800 hover:shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-3 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-navy-700 hover:text-gold-600 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
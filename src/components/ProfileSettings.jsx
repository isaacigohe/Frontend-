// src/components/ProfileSettings.jsx
// Profile update component for all users
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../api/client';
import { Loader2, AlertTriangle, CheckCircle, User, GraduationCap, Building2 } from 'lucide-react';

export default function ProfileSettings({ onClose }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    gpa: user?.gpa || '',
    major: user?.major || '',
    home_institution: user?.home_institution || '',
    enrollment_year: user?.enrollment_year || '',
    student_type: user?.student_type || 'UNDERGRADUATE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const payload = {};
      
      // Only include fields that have changed
      if (formData.first_name !== user?.first_name) payload.first_name = formData.first_name;
      if (formData.last_name !== user?.last_name) payload.last_name = formData.last_name;
      
      // Student-only fields
      if (user?.role === 'STUDENT') {
        if (formData.gpa !== user?.gpa) payload.gpa = formData.gpa || null;
        if (formData.major !== user?.major) payload.major = formData.major || null;
        if (formData.home_institution !== user?.home_institution) payload.home_institution = formData.home_institution || null;
        if (formData.enrollment_year !== user?.enrollment_year) payload.enrollment_year = formData.enrollment_year || null;
        if (formData.student_type !== user?.student_type) payload.student_type = formData.student_type;
      }

      if (Object.keys(payload).length === 0) {
        setSuccess(true);
        setIsSubmitting(false);
        setTimeout(() => onClose(), 1500);
        return;
      }

      await updateMyProfile(payload);
      setSuccess(true);
      
      // Update local user data
      const storedUser = JSON.parse(localStorage.getItem('gs_user') || '{}');
      const updatedUser = { ...storedUser, ...payload };
      localStorage.setItem('gs_user', JSON.stringify(updatedUser));
      
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      const responseData = err?.response?.data;
      if (typeof responseData === 'object') {
        const firstKey = Object.keys(responseData)[0];
        setError(responseData[firstKey]?.[0] || 'Update failed. Please try again.');
      } else {
        setError('Update failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'HOME_ADMIN' || user?.role === 'HOST_COORD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-navy-700" />
            <h2 className="text-lg font-bold text-navy-900">Profile Settings</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
          </div>

          {/* Student-Only Fields */}
          {isStudent && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Student Type</label>
                  <select
                    name="student_type"
                    value={formData.student_type}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    <option value="UNDERGRADUATE">Undergraduate</option>
                    <option value="POSTGRADUATE">Postgraduate</option>
                    <option value="HIGH_SCHOOL">High School</option>
                    <option value="INDEPENDENT">Independent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">GPA (0.00 - 4.00)</label>
                  <input
                    type="number"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="4"
                    placeholder="3.50"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Major</label>
                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    placeholder="Computer Science"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Home Institution</label>
                  <input
                    type="text"
                    name="home_institution"
                    value={formData.home_institution}
                    onChange={handleChange}
                    placeholder="Your university name"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Enrollment Year</label>
                  <input
                    type="number"
                    name="enrollment_year"
                    value={formData.enrollment_year}
                    onChange={handleChange}
                    placeholder="2024"
                    min="2000"
                    max="2030"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Admin Info */}
          {isAdmin && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                {user?.role === 'HOST_COORD' && (
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    Assigned University: <strong>{user?.host_university_name || 'None'}</strong>
                  </span>
                )}
                {user?.role === 'HOME_ADMIN' && (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    Role: <strong>Home Admin</strong> (can manage programs)
                  </span>
                )}
                {user?.is_verified ? (
                  <span className="ml-3 text-xs text-emerald-600">✓ Verified</span>
                ) : (
                  <span className="ml-3 text-xs text-amber-600">⏳ Pending Verification</span>
                )}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// ── RegisterUniversityPanel ────────────────────────────────────────────────
function RegisterUniversityPanel({ isOpen, onClose, onRegistered }) {
  const [formValues, setFormValues] = useState({
    name: '',
    country: '',
    city: '',
    website: '',
    minimum_gpa: '',
    primary_language: 'English',
    language_test_required: false,
    minimum_language_score: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [registeredUniversityId, setRegisteredUniversityId] = useState(null);

  function handleChange(field, value) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

  const gpaValue = Number(formValues.minimum_gpa);
  const isGpaValid = formValues.minimum_gpa !== '' && gpaValue >= 0 && gpaValue <= 4.0;
  const isValid = formValues.name.trim().length > 0 && formValues.country.trim().length > 0 && isGpaValid;

  async function handleSubmit() {
    if (!isValid) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', formValues.name.trim());
      formData.append('country', formValues.country.trim());
      formData.append('city', formValues.city.trim() || '');
      formData.append('website', formValues.website.trim() || '');
      formData.append('minimum_gpa', gpaValue);
      formData.append('primary_language', formValues.primary_language);
      formData.append('language_test_required', formValues.language_test_required);
      if (formValues.language_test_required && formValues.minimum_language_score) {
        formData.append('minimum_language_score', Number(formValues.minimum_language_score));
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await registerUniversity(formData);
      const universityId = response.data.id;
      setRegisteredUniversityId(universityId);
      setFormValues({
        name: '',
        country: '',
        city: '',
        website: '',
        minimum_gpa: '',
        primary_language: 'English',
        language_test_required: false,
        minimum_language_score: '',
      });
      setImageFile(null);
      setImagePreview(null);
      if (onRegistered) onRegistered();
    } catch (err) {
      const responseData = err?.response?.data;
      const firstKey = responseData && typeof responseData === 'object' ? Object.keys(responseData)[0] : null;
      const firstValue = firstKey ? responseData[firstKey] : null;
      setError(Array.isArray(firstValue) ? firstValue[0] : 'Could not register the university. Check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="mb-6 border border-slate-300 bg-white p-4 shadow-sm rounded-none">
      <div className="mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Register New University</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={formValues.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="University name *"
          className="border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <input
          value={formValues.country}
          onChange={(e) => handleChange('country', e.target.value)}
          placeholder="Country *"
          className="border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <input
          value={formValues.city}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="City"
          className="border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <input
          value={formValues.website}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="Website URL"
          className="border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <div>
          <input
            value={formValues.minimum_gpa}
            onChange={(e) => handleChange('minimum_gpa', e.target.value)}
            placeholder="Minimum GPA * (0.00-4.00)"
            type="number"
            step="0.01"
            min="0"
            max="4"
            className={`w-full border px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400 ${
              formValues.minimum_gpa && !isGpaValid ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          {formValues.minimum_gpa && !isGpaValid && <p className="mt-1 text-[11px] text-red-600">Must be between 0.00 and 4.00.</p>}
        </div>
        <select
          value={formValues.primary_language}
          onChange={(e) => handleChange('primary_language', e.target.value)}
          className="border border-slate-300 bg-white px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          {LANGUAGE_CHOICES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* ── Image Upload ────────────────────────────────────────────────────── */}
      <div className="mt-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
          University Logo / Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
          className="w-full border border-slate-300 bg-white px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover border border-slate-200" />
          </div>
        )}
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        <input
          type="checkbox"
          checked={formValues.language_test_required}
          onChange={(e) => handleChange('language_test_required', e.target.checked)}
        />
        Language test required
      </label>
      {formValues.language_test_required && (
        <input
          value={formValues.minimum_language_score}
          onChange={(e) => handleChange('minimum_language_score', e.target.value)}
          placeholder="Minimum language test score"
          type="number"
          step="0.01"
          className="mt-2 w-64 border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
      )}

      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setRegisteredUniversityId(null);
            setImageFile(null);
            setImagePreview(null);
            onClose();
          }}
          className="border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit}
          className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Register University
        </button>
      </div>

      {registeredUniversityId && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">University Registered! Add Programs:</span>
          </div>
          <ProgramList universityId={registeredUniversityId} onRefresh={() => {}} />
          <button
            type="button"
            onClick={() => {
              setRegisteredUniversityId(null);
              setImageFile(null);
              setImagePreview(null);
              onClose();
            }}
            className="mt-3 border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
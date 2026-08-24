import React, { useState } from 'react';

export const CandidateForm = ({ 
  categories = [], 
  initialValues = null, 
  defaultCategoryId = '',
  onSubmit, 
  onCancel,
  isSubmitting = false,
  module = 'club'
}) => {
  const isEvent = module === 'event';

  const [categoryId, setCategoryId] = useState(() => initialValues?.categoryId || defaultCategoryId || categories[0]?.id || '');
  const [name, setName] = useState(() => initialValues?.name || '');
  const [imageUrl, setImageUrl] = useState(() => initialValues?.imageUrl || '');
  const [gender, setGender] = useState(() => initialValues?.gender || 'male');
  const [bio, setBio] = useState(() => initialValues?.bio || '');
  const [manifesto, setManifesto] = useState(() => initialValues?.manifesto || '');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!categoryId) newErrors.categoryId = 'Category is required';
    if (!name.trim()) newErrors.name = isEvent ? 'Option name is required' : 'Candidate name is required';
    
    if (!isEvent) {
      if (!gender) newErrors.gender = 'Gender is required';
      if (!bio.trim()) newErrors.bio = 'Candidate bio is required';
      if (!manifesto.trim()) newErrors.manifesto = 'Manifesto vision statement is required';
      
      // Optional URL validation
      if (imageUrl.trim() && 
          !imageUrl.startsWith('http://') && 
          !imageUrl.startsWith('https://') && 
          !imageUrl.startsWith('/')) {
        newErrors.imageUrl = 'Image URL must start with http://, https://, or /';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (isEvent) {
      onSubmit({
        categoryId,
        name: name.trim(),
        imageUrl: '/images/events/theme.jpg',
        gender: 'male',
        bio: 'Event option description',
        manifesto: 'Event option manifesto'
      });
      return;
    }

    let finalImageUrl = imageUrl.trim();

    const isDefaultMalePhoto = (url) => {
      return !url || 
        url.includes('photo-1535713875002-d1d0cf377fde') || 
        url.includes('/images/candidates/male/');
    };
    
    const isDefaultFemalePhoto = (url) => {
      return url.includes('/images/candidates/female/');
    };

    // If gender is changed but the profile is still showing the opposite gender's placeholder, clear it
    if (gender === 'female' && isDefaultMalePhoto(finalImageUrl)) {
      finalImageUrl = '';
    } else if (gender === 'male' && isDefaultFemalePhoto(finalImageUrl)) {
      finalImageUrl = '';
    }

    onSubmit({
      categoryId,
      name: name.trim(),
      imageUrl: finalImageUrl,
      gender,
      bio: bio.trim(),
      manifesto: manifesto.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm text-slate-800 dark:text-slate-205">
      {/* Category selector */}
      <div className="flex flex-col gap-1">
        <label htmlFor="form-category" className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Category *
        </label>
        <select
          id="form-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="text-rose-500 text-xs mt-0.5">{errors.categoryId}</p>}
      </div>

      {/* Option/Candidate Name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="form-name" className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {isEvent ? 'Option Name *' : 'Candidate Name *'}
        </label>
        <input
          id="form-name"
          type="text"
          placeholder={isEvent ? 'Enter Option Text' : "Enter Candidate's Full Name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500"
        />
        {errors.name && <p className="text-rose-500 text-xs mt-0.5">{errors.name}</p>}
      </div>

      {!isEvent && (
        <>
          {/* Gender selection */}
          <div className="flex flex-col gap-1">
            <label htmlFor="form-gender" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Gender *
            </label>
            <select
              id="form-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100"
            >
              <option value="male" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Male</option>
              <option value="female" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Female</option>
            </select>
            {errors.gender && <p className="text-rose-500 text-xs mt-0.5">{errors.gender}</p>}
          </div>

          {/* Image URL */}
          <div className="flex flex-col gap-1">
            <label htmlFor="form-image" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Image URL (Optional)
            </label>
            <input
              id="form-image"
              type="text"
              placeholder="e.g. https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500"
            />
            {errors.imageUrl && <p className="text-rose-500 text-xs mt-0.5">{errors.imageUrl}</p>}
          </div>

          {/* Biography */}
          <div className="flex flex-col gap-1">
            <label htmlFor="form-bio" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Biography *
            </label>
            <textarea
              id="form-bio"
              rows={3}
              placeholder="Enter brief background, degree, year, and key interests..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-50 resize-y placeholder-slate-400 dark:placeholder-slate-500"
            />
            {errors.bio && <p className="text-rose-500 text-xs mt-0.5">{errors.bio}</p>}
          </div>

          {/* Manifesto */}
          <div className="flex flex-col gap-1">
            <label htmlFor="form-manifesto" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Manifesto / Campaign Vision *
            </label>
            <textarea
              id="form-manifesto"
              rows={4}
              placeholder="Explain the candidate's goals, plans, and vision for this role..."
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-50 resize-y placeholder-slate-400 dark:placeholder-slate-500"
            />
            {errors.manifesto && <p className="text-rose-500 text-xs mt-0.5">{errors.manifesto}</p>}
          </div>
        </>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-105 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="py-2 px-4 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          id="btn-submit-candidate-form"
          type="submit"
          disabled={isSubmitting}
          className="py-2 px-4 bg-violet-600 hover:bg-violet-755 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/25 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            isEvent ? 'Save Option' : 'Save Candidate'
          )}
        </button>
      </div>
    </form>
  );
};

export default CandidateForm;

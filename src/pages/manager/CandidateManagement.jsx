import React, { useState } from 'react';
import { useElectionQuery } from '../../hooks/queries/useElectionQuery';
import { useCandidatesQuery } from '../../hooks/queries/useCandidatesQuery';
import { 
  useCreateCandidateMutation, 
  useUpdateCandidateMutation, 
  useDeleteCandidateMutation 
} from '../../hooks/mutations/useCandidateMutation';
import { CandidateForm } from '../../components/manager/CandidateForm';
import { AnimatedModal } from '../../components/motion/AnimatedModal';
import { PageTransition } from '../../components/motion/PageTransition';

export const CandidateManagement = ({ module = 'club' }) => {
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null); // Null for Add, Object for Edit
  const [candidateToDelete, setCandidateToDelete] = useState(null);

  // Queries
  const { data: electionRes, isLoading: electionLoading } = useElectionQuery(module);
  const categories = electionRes?.data?.categories || [];

  React.useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const { data: candidatesRes, isLoading: candidatesLoading, isError: candidatesError } = useCandidatesQuery(activeCategoryId || '');

  // Mutations
  const createMutation = useCreateCandidateMutation();
  const updateMutation = useUpdateCandidateMutation();
  const deleteMutation = useDeleteCandidateMutation();


  if (electionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-455 text-sm">Loading categories...</p>
      </div>
    );
  }

  const candidatesList = candidatesRes?.data || [];

  const handleOpenAddForm = () => {
    setSelectedCandidate(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (candidate) => {
    setSelectedCandidate(candidate);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedCandidate) {
        // Edit flow
        const response = await updateMutation.mutateAsync({
          id: selectedCandidate.id,
          candidateData: formData
        });
        if (response.success) {
          setIsFormOpen(false);
        }
      } else {
        // Add flow
        const response = await createMutation.mutateAsync(formData);
        if (response.success) {
          setIsFormOpen(false);
          // Set tab to the category of candidate added
          setActiveCategoryId(formData.categoryId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!candidateToDelete) return;
    try {
      const response = await deleteMutation.mutateAsync(candidateToDelete.id);
      if (response.success) {
        setCandidateToDelete(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {module === 'event' ? 'Manage Options' : 'Manage Candidates'}
            </h1>
            <p className="text-slate-505 dark:text-slate-450 text-sm mt-0.5">
              {module === 'event'
                ? 'Add new voting options, edit options, or remove entries from active ballots.'
                : 'Add new candidates, edit manifestos, or remove entries from active ballots.'}
            </p>
          </div>

          <button
            id="btn-add-candidate"
            onClick={handleOpenAddForm}
            className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-violet-600 hover:bg-violet-755 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/25 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {module === 'event' ? 'Add New Option' : 'Add New Candidate'}
          </button>
        </div>

        {/* Categories Tab selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors outline-none focus-visible:text-indigo-650 ${
                activeCategoryId === cat.id
                  ? 'border-indigo-600 text-indigo-650 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Candidates View List */}
        {candidatesLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-violet-650 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-slate-455">Fetching options...</span>
          </div>
        ) : candidatesError ? (
          <div className="text-center py-12">
            <span className="text-rose-500 text-4xl">⚠️</span>
            <p className="text-slate-505 text-sm mt-2">Failed to load options for this category.</p>
          </div>
        ) : candidatesList.length > 0 ? (
          <div className="bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-805 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-105 text-xs font-bold text-slate-500 dark:bg-slate-950/60 dark:border-slate-805 uppercase tracking-wider select-none">
                    <th className="py-3.5 px-6">{module === 'event' ? 'Option Name' : 'Candidate'}</th>
                    {module !== 'event' && <th className="py-3.5 px-6 hidden md:table-cell">Biography</th>}
                    <th className="py-3.5 px-6 hidden sm:table-cell">Current Votes</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-105 text-sm dark:divide-slate-800">
                  {candidatesList.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      {/* Name / Profile */}
                      <td className="py-4 px-6 flex items-center gap-3">
                        {module !== 'event' && (
                          <img
                            src={cand.imageUrl}
                            alt={cand.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-750"
                            onError={(e) => {
                              const isFemale = (cand.gender === 'female' || cand.imageUrl?.includes('/female/'));
                              const gender = isFemale ? 'women' : 'men';
                              const match = (cand.imageUrl || '').match(/\/(\d+)\.jpg$/);
                              const index = match ? match[1] : Math.floor(Math.random() * 50) + 1;
                              e.target.src = `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
                              e.target.onerror = null;
                            }}
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white">{cand.name}</span>
                          <span className="text-[10px] font-semibold text-slate-400 font-mono">ID: {cand.id}</span>
                        </div>
                      </td>

                      {/* Bio */}
                      {module !== 'event' && (
                        <td className="py-4 px-6 hidden md:table-cell max-w-sm">
                          <p className="text-slate-505 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">
                            {cand.bio}
                          </p>
                        </td>
                      )}

                      {/* Vote Count */}
                      <td className="py-4 px-6 hidden sm:table-cell">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                          {cand.votesCount || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleOpenEditForm(cand)}
                            className="btn-edit-candidate p-1.5 text-slate-505 hover:text-indigo-650 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                            title={module === 'event' ? "Edit Option details" : "Edit Candidate details"}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setCandidateToDelete(cand)}
                            className="btn-delete-candidate p-1.5 text-slate-550 hover:text-rose-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                            title={module === 'event' ? "Delete Option" : "Delete Candidate"}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-205 rounded-2xl dark:bg-slate-900 dark:border-slate-800 shadow-sm">
            <span className="text-slate-400 text-5xl">👤</span>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mt-3">
              {module === 'event' ? 'No Options' : 'No Candidates'}
            </h3>
            <p className="text-xs text-slate-505 mt-1">
              {module === 'event'
                ? 'No options have been added yet. Click Add New Option above to begin.'
                : 'No candidates have been added yet. Click Add New Candidate above to begin.'}
            </p>
          </div>
        )}

        {/* Add/Edit Candidate Form Modal */}
        <AnimatedModal
          isOpen={isFormOpen}
          onClose={() => !(createMutation.isPending || updateMutation.isPending) && setIsFormOpen(false)}
          title={
            module === 'event' 
              ? (selectedCandidate ? 'Edit Option Details' : 'Add New Option')
              : (selectedCandidate ? 'Edit Candidate Details' : 'Add New Candidate')
          }
        >
          <CandidateForm
            key={selectedCandidate?.id || 'new'}
            categories={categories}
            initialValues={selectedCandidate}
            defaultCategoryId={activeCategoryId}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            module={module}
          />
        </AnimatedModal>

        {/* Delete Confirmation Modal */}
        <AnimatedModal
          isOpen={!!candidateToDelete}
          onClose={() => !deleteMutation.isPending && setCandidateToDelete(null)}
          title={module === 'event' ? 'Confirm Option Deletion' : 'Confirm Candidate Deletion'}
        >
          <div className="space-y-4 text-sm text-slate-650 dark:text-slate-350">
            <p>
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{candidateToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900 p-3 rounded-xl leading-normal">
              WARNING: This action is permanent. All recorded stats for this {module === 'event' ? 'option' : 'candidate'} entry will be wiped immediately.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-xl font-semibold shadow-lg shadow-rose-900/20 transition-all flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  module === 'event' ? 'Yes, Delete Option' : 'Yes, Delete Candidate'
                )}
              </button>
            </div>
          </div>
        </AnimatedModal>

      </div>
    </PageTransition>
  );
};

export default CandidateManagement;

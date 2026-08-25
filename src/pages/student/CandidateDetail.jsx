import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCandidateQuery } from '../../hooks/queries/useCandidateQuery';
import { useElectionQuery } from '../../hooks/queries/useElectionQuery';
import { useVoterStatusQuery } from '../../hooks/queries/useVoterStatusQuery';
import { useVoteMutation } from '../../hooks/mutations/useVoteMutation';
import { useRole } from '../../hooks/useRole';
import { AnimatedModal } from '../../components/motion/AnimatedModal';
import { PageTransition } from '../../components/motion/PageTransition';

export const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, studentId } = useRole();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Queries
  const { data: candidateRes, isLoading: candidateLoading, isError: candidateError } = useCandidateQuery(id);
  const { data: electionRes, isLoading: electionLoading } = useElectionQuery();
  const { data: statusRes, isLoading: statusLoading } = useVoterStatusQuery(role, studentId);

  // Mutation
  const voteMutation = useVoteMutation();

  const isLoading = candidateLoading || electionLoading || statusLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-450 text-sm">Loading candidate profile...</p>
      </div>
    );
  }

  if (candidateError || !candidateRes?.success) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Failed to Load Candidate Profile</h2>
        <p className="text-slate-500 dark:text-slate-450 mt-1">The candidate may not exist or has been removed.</p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-55 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-750 rounded-xl border border-slate-200 shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 outline-none"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const candidate = candidateRes.data;
  const { election, categories } = electionRes.data;
  const category = categories.find((c) => c.id === candidate.categoryId);
  const voterStatus = statusRes?.data || { votedCategoryIds: {} };

  const hasVotedThisCategory = !!voterStatus.votedCategoryIds[candidate.categoryId];
  const isElectionOpen = election.status === 'OPEN';

  const handleVoteSubmit = async () => {
    setSubmitError(null);
    try {
      const response = await voteMutation.mutateAsync({
        categoryId: candidate.categoryId,
        candidateId: candidate.id,
      });
      if (response.success) {
        setIsConfirmOpen(false);
        // Navigate to receipt
        navigate(`/student/receipt/${response.data.id}`);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit vote. Please try again.');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <button 
            onClick={() => navigate('/student/dashboard')} 
            className="hover:text-indigo-600 transition-colors"
          >
            Dashboard
          </button>
          <span>/</span>
          <button 
            onClick={() => navigate(`/student/vote/${candidate.categoryId}`)} 
            className="hover:text-indigo-600 transition-colors"
          >
            {category?.name || 'Category'}
          </button>
          <span>/</span>
          <span className="text-slate-650 dark:text-slate-350">{candidate.name}</span>
        </div>

        {/* Profile Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Picture and Vote Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="aspect-square w-full bg-slate-100 dark:bg-slate-850">
                <img
                  src={candidate.imageUrl}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const isFemale = (candidate.gender === 'female' || candidate.imageUrl?.includes('/female/'));
                    const gender = isFemale ? 'women' : 'men';
                    const match = (candidate.imageUrl || '').match(/\/(\d+)\.jpg$/);
                    const index = match ? match[1] : Math.floor(Math.random() * 50) + 1;
                    e.target.src = `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
                    e.target.onerror = null;
                  }}
                />
              </div>
              <div className="p-6 text-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{candidate.name}</h2>
                <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450 border border-slate-205 dark:border-slate-700">
                  Category Candidate
                </span>
              </div>
            </div>

            {/* Voting Control Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Cast Your Ballot
              </h3>

              {hasVotedThisCategory ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl space-y-2">
                  <p className="text-xs text-amber-850 dark:text-amber-400 font-medium">
                    You have already voted in this category. Duplicate voting is disabled.
                  </p>
                  <button
                    onClick={() => navigate(`/student/receipt/${voterStatus.votedCategoryIds[candidate.categoryId].receiptId}`)}
                    className="w-full py-1.5 px-3 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-850 dark:text-amber-200 text-amber-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    View Confirmation Receipt
                  </button>
                </div>
              ) : !isElectionOpen ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl">
                  <p className="text-xs text-rose-850 dark:text-rose-400 font-medium">
                    Voting is closed for this election. You cannot cast new ballots.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Submit your vote for <strong className="text-slate-700 dark:text-slate-300">{candidate.name}</strong> as <strong className="text-indigo-650 dark:text-indigo-400">{category?.name}</strong>.
                  </p>
                  <button
                    id="btn-vote-candidate"
                    onClick={() => {
                      setSubmitError(null);
                      setIsConfirmOpen(true);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/25 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
                  >
                    Vote for {candidate.name}
                  </button>
                </div>
              )}

              <button
                onClick={() => navigate(`/student/vote/${candidate.categoryId}`)}
                className="w-full py-2 px-3.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] outline-none"
              >
                Back to Candidate List
              </button>
            </div>
          </div>

          {/* Right Column: Profile details and Manifesto */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                Category
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {category?.name}
              </h2>
            </div>

            {/* Candidate Bio */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-950 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                Biography / Introduction
              </h3>
              <p className="text-slate-650 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-wrap">
                {candidate.bio}
              </p>
            </div>

            {/* Campaign Manifesto */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-950 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                Candidate Manifesto & Vision
              </h3>
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl p-5">
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                  "{candidate.manifesto}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vote Review Confirmation Modal */}
        <AnimatedModal
          isOpen={isConfirmOpen}
          onClose={() => !voteMutation.isPending && setIsConfirmOpen(false)}
          title="Review Your Vote"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-350">
              Please review your selection carefully. You can only cast <strong>one vote per category</strong>, and this action <strong>cannot be undone</strong>.
            </p>

            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 uppercase font-bold">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{category?.name}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-850">
                <span className="text-slate-400 uppercase font-bold">Candidate</span>
                <span className="font-bold text-indigo-650 dark:text-indigo-400">{candidate.name}</span>
              </div>
            </div>

            {submitError && (
              <div id="vote-error-message" className="p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">⚠️</span>
                <p className="text-xs text-rose-800 dark:text-rose-455 font-medium">{submitError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={voteMutation.isPending}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-vote"
                type="button"
                onClick={handleVoteSubmit}
                disabled={voteMutation.isPending}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/25 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {voteMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm & Cast Vote'
                )}
              </button>
            </div>
          </div>
        </AnimatedModal>
      </div>
    </PageTransition>
  );
};

export default CandidateDetail;

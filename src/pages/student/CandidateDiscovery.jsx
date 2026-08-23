import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCandidatesQuery } from '../../hooks/queries/useCandidatesQuery';
import { useElectionQuery } from '../../hooks/queries/useElectionQuery';
import { useVoterStatusQuery } from '../../hooks/queries/useVoterStatusQuery';
import { useRole } from '../../hooks/useRole';
import { MotionCandidateCard } from '../../components/motion/MotionCandidateCard';
import { PageTransition } from '../../components/motion/PageTransition';

export const CandidateDiscovery = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { role, studentId } = useRole();

  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data: electionRes, isLoading: electionLoading } = useElectionQuery();
  const { data: candidatesRes, isLoading: candidatesLoading, isError: candidatesError } = useCandidatesQuery(categoryId);
  const { data: statusRes, isLoading: statusLoading } = useVoterStatusQuery(role, studentId);

  const isLoading = electionLoading || candidatesLoading || statusLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-450 text-sm">Fetching candidates...</p>
      </div>
    );
  }

  if (candidatesError || !candidatesRes?.success) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Failed to Load Candidates</h2>
        <p className="text-slate-500 dark:text-slate-450 mt-1">Please go back and try again.</p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { categories } = electionRes.data;
  const category = categories.find((c) => c.id === categoryId);
  const candidatesList = candidatesRes.data || [];
  const voterStatus = statusRes?.data || { votedCategoryIds: {} };

  const hasVoted = !!voterStatus.votedCategoryIds[categoryId];

  // Filter candidates by search query
  const filteredCandidates = candidatesList.filter((candidate) =>
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <span className="text-slate-650 dark:text-slate-350">{category?.name || 'Category'}</span>
        </div>

        {/* Discovery Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {category?.name || 'Browse Candidates'}
            </h1>
            <p className="text-slate-500 dark:text-slate-450 text-sm mt-0.5">
              Review details and manifestos of candidates standing for {category?.name}.
            </p>
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-650 dark:text-slate-350 bg-white hover:bg-slate-55 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-750 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Info panel if user has already voted */}
        {hasVoted && (
          <div className="p-4 bg-amber-50 border border-amber-250 dark:bg-amber-950/20 dark:border-amber-900 rounded-2xl flex items-start gap-3">
            <span className="text-amber-500 mt-0.5">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Already Voted in this Category</h4>
              <p className="text-xs text-amber-750 dark:text-amber-500 mt-0.5">
                You have already cast your ballot for {category?.name}. You cannot vote again, but you may still review candidate manifestos.
              </p>
            </div>
          </div>
        )}

        {/* Search Controls */}
        <div className="flex items-center w-full max-w-md">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search candidates by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-sm placeholder-slate-450 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-50"
            />
          </div>
        </div>

        {/* Candidates Grid */}
        {filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate, idx) => (
              <MotionCandidateCard
                key={candidate.id}
                index={idx}
                onClick={() => navigate(`/student/candidate/${candidate.id}`)}
              >
                {/* Image */}
                <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-850 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                  <img
                    src={candidate.imageUrl}
                    alt={candidate.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      const isFemale = (candidate.gender === 'female' || candidate.imageUrl?.includes('/female/'));
                      const gender = isFemale ? 'women' : 'men';
                      const match = (candidate.imageUrl || '').match(/\/(\d+)\.jpg$/);
                      const index = match ? match[1] : Math.floor(Math.random() * 50) + 1;
                      e.target.src = `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
                      e.target.onerror = null;
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900/60 backdrop-blur-md text-white rounded-full">
                      ID: {candidate.id}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {candidate.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {candidate.bio}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-indigo-650 dark:text-indigo-400 group-hover:underline">
                      View Profile & Manifesto
                    </span>
                    <svg className="w-4 h-4 text-indigo-650 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </MotionCandidateCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl dark:bg-slate-900 dark:border-slate-800">
            <span className="text-slate-400 text-5xl">🔍</span>
            <h3 className="text-base font-bold text-slate-705 dark:text-slate-300 mt-3">
              {candidatesList.length === 0 ? 'No Candidates' : 'No Candidates Found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {candidatesList.length === 0 
                ? 'No candidates have been added yet.' 
                : `No candidates match "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default CandidateDiscovery;

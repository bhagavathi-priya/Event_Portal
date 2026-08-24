import React, { useState } from 'react';
import { useElectionQuery } from '../../hooks/queries/useElectionQuery';
import { useTallyQuery } from '../../hooks/queries/useTallyQuery';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MotionTallyBar } from '../../components/motion/MotionTallyBar';
import { PageTransition } from '../../components/motion/PageTransition';

export const LiveTally = ({ module = 'club' }) => {
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // Queries
  const { data: electionRes, isLoading: electionLoading } = useElectionQuery(module);
  const categories = electionRes?.data?.categories || [];

  React.useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);
  
  // Calculate isElectionOpen dynamically
  const isElectionOpen = electionRes?.data?.election?.status === 'OPEN';

  // Fetch tally query, passing active status for polling
  const { data: tallyRes, isLoading: tallyLoading, isRefetching } = useTallyQuery('election-1', module, isElectionOpen);

  const isLoading = electionLoading || tallyLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-455 text-sm font-semibold">Loading live vote counts...</p>
      </div>
    );
  }

  const { election } = electionRes?.data || { election: {} };
  const tally = tallyRes?.data || { totalVotesCast: 0, tallies: [] };

  const currentCategoryTally = tally.tallies.find(t => t.categoryId === activeCategoryId) || {
    categoryId: activeCategoryId || '',
    categoryName: categories.find(c => c.id === activeCategoryId)?.name || 'Category',
    totalVotes: 0,
    candidates: []
  };

  // Color cycles for candidate progress bars
  const barColors = [
    'bg-indigo-600 dark:bg-indigo-500',
    'bg-violet-605 dark:bg-violet-500',
    'bg-fuchsia-600 dark:bg-fuchsia-500',
    'bg-emerald-600 dark:bg-emerald-500',
    'bg-sky-650 dark:bg-sky-500',
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Live Vote Tally
              </h1>
              {isRefetching && (
                <span className="w-2 h-2 rounded-full bg-indigo-550 animate-ping" title="Syncing results..." />
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-450 text-sm mt-0.5">
              Monitor voter turn-out metrics and category leaderboards in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={election.status} />
            {isElectionOpen && (
              <span className="text-xs text-slate-400 font-medium animate-pulse">
                Auto-refreshing...
              </span>
            )}
          </div>
        </div>

        {/* Global Turnout Metrics Card */}
        <div className="bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-805 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Ballot Volume</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {tally.totalVotesCast} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Votes Submitted</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-950/40" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-650 dark:text-slate-350">Mock Ledger Node</span>
              <span className="text-[10px] text-slate-400 font-mono">Status: Connected & Listening</span>
            </div>
          </div>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
          {categories.map((cat) => {
            const catTally = tally.tallies.find(t => t.categoryId === cat.id);
            const votesCount = catTally ? catTally.totalVotes : 0;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 outline-none focus-visible:text-indigo-650 ${
                  activeCategoryId === cat.id
                    ? 'border-indigo-600 text-indigo-605 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
                }`}
              >
                {cat.name}
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                  {votesCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Leaderboards Bar Chart area */}
        <div className="bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {currentCategoryTally.categoryName} Results
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">
              Ordered by volume of votes. Total of {currentCategoryTally.totalVotes} votes cast.
            </p>
          </div>

          {currentCategoryTally.candidates.length > 0 ? (
            <div className="space-y-6">
              {currentCategoryTally.candidates.map((cand, idx) => {
                const colorClass = barColors[idx % barColors.length];
                const isLeader = idx === 0 && cand.votes > 0;

                return (
                  <div key={cand.candidateId} className="space-y-2">
                    {/* Candidate Info label */}
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3">
                        {module !== 'event' && (
                          <img
                            src={cand.imageUrl}
                            alt={cand.candidateName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-150 dark:border-slate-700"
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {cand.candidateName}
                            </span>
                            {isLeader && (
                              <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.2 rounded-md uppercase dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900">
                                Leader
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-450 font-mono uppercase tracking-wider">
                            {module === 'event' ? 'Option ID:' : 'Candidate ID:'} {cand.candidateId}
                          </span>
                        </div>
                      </div>

                      {/* Vote Count / Percent Info */}
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{cand.votes} votes</span>
                        <span className="text-xs text-slate-500 font-semibold ml-2">({cand.percentage}%)</span>
                      </div>
                    </div>

                    {/* Animated Tally Bar */}
                    <MotionTallyBar percentage={cand.percentage} colorClass={colorClass} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-slate-400 text-4xl">📊</span>
              <p className="text-sm text-slate-500 mt-2 font-medium">No candidates registered in this category.</p>
            </div>
          )}
        </div>

      </div>
    </PageTransition>
  );
};

export default LiveTally;

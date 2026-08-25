import React from 'react';
import { useElectionQuery } from '../../hooks/queries/useElectionQuery';
import { useTallyQuery } from '../../hooks/queries/useTallyQuery';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageTransition } from '../../components/motion/PageTransition';

export const LiveTally = ({ module = 'club' }) => {
  // Queries
  const { data: electionRes, isLoading: electionLoading } = useElectionQuery(module);
  const categories = electionRes?.data?.categories || [];
  
  // Calculate isElectionOpen dynamically
  const isElectionOpen = electionRes?.data?.election?.status === 'OPEN';

  // Fetch tally query, passing active status for polling
  const { data: tallyRes, isLoading: tallyLoading, isRefetching } = useTallyQuery('election-1', module, isElectionOpen);

  const isLoading = electionLoading || tallyLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-505 dark:text-slate-455 text-sm font-semibold">Loading live vote counts...</p>
      </div>
    );
  }

  const { election } = electionRes?.data || { election: {} };
  const tally = tallyRes?.data || { totalVotesCast: 0, tallies: [] };

  // Group categories by parent category dynamically
  const parentGroups = {};
  
  tally.tallies.forEach(catTally => {
    const catObj = categories.find(c => c.id === catTally.categoryId);
    if (!catObj || !catObj.parentId) return; // skip parent categories themselves

    const parentObj = categories.find(c => c.id === catObj.parentId);
    if (!parentObj) return;

    const parentName = parentObj.name;
    const itemLabel = catObj.name;

    if (!parentGroups[parentObj.id]) {
      parentGroups[parentObj.id] = {
        id: parentObj.id,
        name: parentName,
        items: []
      };
    }

    let highestOption = null;
    if (catTally.candidates.length > 0) {
      let maxVotes = -1;
      catTally.candidates.forEach(c => {
        if (c.votes > maxVotes) {
          maxVotes = c.votes;
          highestOption = c;
        }
      });
    }

    parentGroups[parentObj.id].items.push({
      categoryId: catTally.categoryId,
      itemLabel: itemLabel,
      totalVotes: catTally.totalVotes,
      candidates: catTally.candidates,
      highestOption: highestOption
    });
  });

  const groupedItems = Object.values(parentGroups);

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
              {module === 'event' 
                ? 'Monitor voter turn-out metrics and event-decision leaderboards in real-time.'
                : 'Monitor voter turn-out metrics and active club leaderboards in real-time.'
              }
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

        {/* Dynamic Leaderboards */}
        {groupedItems.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-sm">
            <span className="text-slate-400 text-4xl">📊</span>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              {module === 'event' ? 'No active event decisions configured yet.' : 'No active clubs configured yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedItems.map((parent) => (
              <div key={parent.id} className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                {/* Parent Title */}
                <div className="flex items-center gap-2 border-b border-slate-105 dark:border-slate-805 pb-3">
                  <span className="text-2xl">{module === 'event' ? '📅' : '🏛️'}</span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {parent.name}
                  </h2>
                </div>

                {/* Subcategories (Questions or Positions) Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {parent.items.map((item) => {
                    return (
                      <div key={item.categoryId} className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-855 dark:text-slate-200">
                              {item.itemLabel}
                            </h3>
                            <span className="text-[10px] text-slate-455 font-mono uppercase tracking-wider">
                              Total Votes: {item.totalVotes}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {item.candidates.map((cand) => {
                              const isHighest = item.highestOption && item.highestOption.candidateId === cand.candidateId && item.highestOption.votes > 0;

                              return (
                                <div key={cand.candidateId} className="space-y-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      {module !== 'event' && (
                                        <img
                                          src={cand.imageUrl}
                                          alt={cand.candidateName}
                                          className="w-6 h-6 rounded-full object-cover border border-slate-150 dark:border-slate-750 shrink-0"
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
                                      <span className="font-semibold text-slate-700 dark:text-slate-350 truncate">
                                        {cand.candidateName}
                                      </span>
                                      {isHighest && (
                                        <span className="inline-flex items-center text-[8px] font-bold text-amber-700 bg-amber-50 border border-amber-150 px-1 rounded uppercase dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900 shrink-0">
                                          ★ Lead
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0 ml-1">
                                      {cand.votes} ({cand.percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-550 ${
                                        isHighest ? 'bg-amber-500' : 'bg-indigo-600'
                                      }`}
                                      style={{ width: `${cand.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Leader summary block */}
                        {item.highestOption && item.highestOption.votes > 0 ? (
                          <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-655 dark:text-slate-400">
                            <span>Leading Option:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-450 truncate max-w-[120px]">
                              {item.highestOption.candidateName}
                            </span>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 italic">
                            No votes cast yet.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default LiveTally;

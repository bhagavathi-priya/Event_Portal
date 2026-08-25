import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useElectionQuery } from '../../hooks/queries/useElectionQuery';
import { useTallyQuery } from '../../hooks/queries/useTallyQuery';
import { useElectionMutation } from '../../hooks/mutations/useElectionMutation';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AnimatedModal } from '../../components/motion/AnimatedModal';
import { PageTransition } from '../../components/motion/PageTransition';

export const ManagerDashboard = ({ module }) => {
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // Queries
  const { data: electionRes, isLoading: electionLoading, isError: electionError } = useElectionQuery(module);
  const isElectionOpen = electionRes?.data?.election?.status === 'OPEN';
  // Fetch tally data (not polling here, just for metrics)
  const { data: tallyRes, isLoading: tallyLoading } = useTallyQuery('election-1', module, isElectionOpen);

  // Mutation
  const electionMutation = useElectionMutation();

  const isLoading = electionLoading || tallyLoading;

  if (!module) {
    return (
      <PageTransition>
        <div className="space-y-8 max-w-4xl mx-auto py-4">
          <div className="relative bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-lg border border-slate-800">
            <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/6 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-900 px-2.5 py-0.5 rounded-full">
                Manager Control Workspace
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, Administrative Portal!
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                Please select the system you want to manage. You can configure active candidates, monitor live results, and adjust voting windows independently.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Club Management */}
            <div 
              id="card-club-management"
              onClick={() => navigate('/manager/club/dashboard')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  🏛️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    Club Management Portal
                  </h3>
                  <p className="text-sm text-slate-505 mt-1.5 leading-relaxed">
                    Configure club-specific candidates, toggle club voting statuses, and view live results of student elections.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                <span>Enter Club Workspace</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Card 2: Event Management */}
            <div 
              id="card-event-management"
              onClick={() => navigate('/manager/event/dashboard')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-955/20 text-violet-650 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  🎉
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    Event Decision Portal
                  </h3>
                  <p className="text-sm text-slate-505 mt-1.5 leading-relaxed">
                    Manage event voting options, add/edit/delete topics, and monitor student decision polls in real time.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-2 text-violet-605 dark:text-violet-400 font-semibold text-sm">
                <span>Enter Event Workspace</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-505 dark:text-slate-455 text-sm font-semibold">Loading manager dashboard...</p>
      </div>
    );
  }

  if (electionError || !electionRes?.success) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Failed to Load Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-455 mt-1">Check your connection and permissions.</p>
      </div>
    );
  }

  const { election, categories } = electionRes.data;
  const tally = tallyRes?.data || { totalVotesCast: 0, tallies: [] };

  const totalCandidates = tally.tallies.reduce((sum, cat) => sum + cat.candidates.length, 0);

  const handleToggleStatus = async () => {
    setStatusError(null);
    const targetStatus = isElectionOpen ? 'CLOSED' : 'OPEN';
    try {
      const response = await electionMutation.mutateAsync({
        electionId: election.id,
        status: targetStatus,
        module,
      });
      if (response.success) {
        setIsConfirmOpen(false);
      }
    } catch (err) {
      setStatusError(err.message || 'Failed to update election status.');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        
        {/* Back navigation control */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/manager/dashboard')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 outline-none"
          >
            ← Back to Portals
          </button>
        </div>
        
        {/* Banner with controls */}
        <div className="relative bg-slate-900 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/6 w-64 h-64 rounded-full bg-violet-650/10 blur-2xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-950/60 border border-violet-900 px-2.5 py-0.5 rounded-full">
                  {module === 'event' ? 'Event Portal Workspace' : 'Club Portal Workspace'}
                </span>
                <StatusBadge status={election.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {election.title}
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                As the Election Manager, you hold administrative authority to toggle voting windows, configure candidates and ballot options, and review live tallied results.
              </p>
            </div>

            {/* Voting Control Widget */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center min-w-[220px] space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Voting State</span>
                <p className="text-sm font-semibold">
                  Elections are currently <span className={isElectionOpen ? 'text-emerald-450' : 'text-rose-450'}>{isElectionOpen ? 'OPEN' : 'CLOSED'}</span>
                </p>
              </div>
              
              <button
                id="btn-toggle-election-status"
                onClick={() => {
                  setStatusError(null);
                  setIsConfirmOpen(true);
                }}
                className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-colors ${
                  isElectionOpen
                    ? 'bg-rose-600 hover:bg-rose-750 text-white shadow-md shadow-rose-900/20'
                    : 'bg-emerald-600 hover:bg-emerald-755 text-white shadow-md shadow-emerald-900/20'
                }`}
              >
                {isElectionOpen ? 'Close Voting Window' : 'Open Voting Window'}
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Card 1: Total Votes Cast */}
          <div className="bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-55/20 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
              📥
            </div>
            <div>
              <span className="text-xs text-slate-455 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Ballots Cast</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{tally.totalVotesCast}</h2>
            </div>
          </div>

          {/* Card 2: Registered Candidates/Options Count */}
          <div className="bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-55/20 dark:bg-violet-955/20 text-violet-605 dark:text-violet-400 flex items-center justify-center text-xl">
              📝
            </div>
            <div>
              <span className="text-xs text-slate-455 dark:text-slate-400 uppercase tracking-wider font-semibold">
                {module === 'event' ? 'Registered Options' : 'Registered Candidates'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalCandidates}</h2>
            </div>
          </div>

          {/* Card 3: Categories Count */}
          <div className="bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-55/20 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
              🏷️
            </div>
            <div>
              <span className="text-xs text-slate-455 dark:text-slate-400 uppercase tracking-wider font-semibold">Active Categories</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{categories.length}</h2>
            </div>
          </div>
        </div>

        {/* Action Navigation Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Option/Candidate Management */}
          <div 
            id="card-candidate-management"
            onClick={() => navigate(`/manager/${module}/candidates`)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                ⚙️
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {module === 'event' ? 'Manage Options' : 'Candidate Management'}
                </h3>
                <p className="text-sm text-slate-505 mt-1.5 leading-relaxed">
                  {module === 'event' 
                    ? 'Configure event categories, add decision questions, and register voting choices.' 
                    : 'Configure club-specific candidates, register active profiles, and update candidate manifestos.'}
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2 text-indigo-605 dark:text-indigo-400 font-semibold text-sm">
              <span>{module === 'event' ? 'Enter Options Manager' : 'Enter Candidate Manager'}</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Card 2: Live Results */}
          <div 
            id="card-live-tally"
            onClick={() => navigate(`/manager/${module}/tally`)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-955/20 text-violet-650 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                📊
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {module === 'event' ? 'Live Decision Tally' : 'Live Results Tracker'}
                </h3>
                <p className="text-sm text-slate-505 mt-1.5 leading-relaxed">
                  {module === 'event'
                    ? 'Monitor real-time student decision progress and category tallies.'
                    : 'Monitor real-time voting progress, turnout percentages, and leading candidates.'}
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2 text-violet-605 dark:text-violet-400 font-semibold text-sm">
              <span>View Live Tally</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Confirmation Modal: Toggle status */}
        <AnimatedModal
          isOpen={isConfirmOpen}
          onClose={() => !electionMutation.isPending && setIsConfirmOpen(false)}
          title={isElectionOpen ? 'Confirm Close Election' : 'Confirm Open Election'}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-655 dark:text-slate-350 leading-relaxed">
              {isElectionOpen
                ? 'You are closing the election. When closed, students will no longer be able to cast votes. You can reopen voting later if required.'
                : 'You are opening the election. When open, student voters will be authorized to cast exactly one ballot in each category.'}
            </p>

            {statusError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2">
                <span className="text-rose-505 mt-0.5">⚠️</span>
                <p className="text-xs text-rose-800 dark:text-rose-455 font-medium">{statusError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={electionMutation.isPending}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-toggle-status"
                type="button"
                onClick={handleToggleStatus}
                disabled={electionMutation.isPending}
                className={`flex-1 py-2 text-white rounded-xl text-sm font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isElectionOpen
                    ? 'bg-rose-650 hover:bg-rose-750 shadow-rose-900/20'
                    : 'bg-emerald-650 hover:bg-emerald-750 shadow-emerald-900/20'
                }`}
              >
                {electionMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : isElectionOpen ? (
                  'Yes, Close Voting'
                ) : (
                  'Yes, Open Voting'
                )}
              </button>
            </div>
          </div>
        </AnimatedModal>

      </div>
    </PageTransition>
  );
};

export default ManagerDashboard;

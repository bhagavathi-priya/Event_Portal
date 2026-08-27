import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useElectionQuery } from '../../hooks/queries/useElectionQuery';
import { useVoterStatusQuery } from '../../hooks/queries/useVoterStatusQuery';
import { useRole } from '../../hooks/useRole';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageTransition } from '../../components/motion/PageTransition';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
};

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, studentId } = useRole();

  // Navigation states
  const [activeView, setActiveView] = useState('portal-selection'); // 'portal-selection', 'club', 'club-elections', 'event'
  const [selectedClubId, setSelectedClubId] = useState(null); // 'coding', 'cultural'
  const [selectedEventId, setSelectedEventId] = useState(null); // 'symposium', 'fest', 'workshop'
  const [eventVotes, setEventVotes] = useState([]);
  const [formSelections, setFormSelections] = useState({});
  const [formError, setFormError] = useState('');
  
  // Sync redirected location state
  useEffect(() => {
    if (location.state?.selectedClubId) {
      const clubId = location.state.selectedClubId;
      setActiveView('club-elections');
      setSelectedClubId(clubId);
      // Clear location state to prevent loop on back navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);
  
  // Load event votes on mount
  useEffect(() => {
    const stored = window.localStorage.getItem('voting_event_votes');
    if (stored) {
      try {
        setEventVotes(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Queries
  const { data: electionRes, isLoading: electionLoading, isError: electionError } = useElectionQuery();
  const { data: statusRes, isLoading: statusLoading } = useVoterStatusQuery(role, studentId);
  const { data: eventElectionRes, isLoading: eventElectionLoading } = useElectionQuery('event');

  const { data: allCandsRes, isLoading: allCandsLoading } = useQuery({
    queryKey: ['candidates', 'all'],
    queryFn: () => axiosClient.get('/api/candidates'),
    refetchInterval: 3000
  });

  if (electionLoading || statusLoading || eventElectionLoading || allCandsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-455 text-sm font-semibold">Loading dashboard portal...</p>
      </div>
    );
  }

  if (electionError || !electionRes?.success) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Failed to Load Dashboard Data</h2>
        <p className="text-slate-500 dark:text-slate-455 mt-1">Please check your connection and try again.</p>
      </div>
    );
  }

  const { election, categories } = electionRes.data;
  const eventElection = eventElectionRes?.data?.election || { status: 'OPEN' };
  const isEventElectionOpen = eventElection.status === 'OPEN';
  const allCandidates = allCandsRes?.data || [];

  const voterStatus = statusRes?.data || { votedCategoryIds: {}, hasVotedAny: false };
  
  // Group categories by club dynamically
  const clubGroups = {};
  
  // Find all active parent club categories
  const parentClubs = categories.filter(c => c.id.startsWith('club-cat-') && c.status === 'ACTIVE');
  
  parentClubs.forEach(club => {
    // Find positions belonging to this parent club
    const positions = categories.filter(pos => pos.parentId === club.id);
    
    clubGroups[club.id] = {
      id: club.id,
      name: club.name,
      description: club.description || '',
      categories: positions
    };
  });

  const presentClubs = Object.values(clubGroups);

  const getVotedStats = (cats) => {
    const total = cats.length;
    const voted = cats.filter(c => !!voterStatus.votedCategoryIds[c.id]).length;
    const progress = total > 0 ? Math.round((voted / total) * 100) : 0;
    return { total, voted, progress };
  };

  const activeClubCategories = clubGroups[selectedClubId]?.categories || [];
  const activeClubStats = getVotedStats(activeClubCategories);
  const activeClubTitle = `${clubGroups[selectedClubId]?.name || 'Club'} Elections`;
  const isElectionOpen = election.status === 'OPEN';

  const eventCategories = eventElectionRes?.data?.categories || [];
  
  // Filter active parent Event Categories (starts with 'ev-cat-' and status is 'ACTIVE')
  const parentEvents = eventCategories.filter(
    cat => cat.id.startsWith('ev-cat-') && cat.status === 'ACTIVE'
  );

  const events = parentEvents.map(parent => {
    // Find child questions for this parent Category
    const questions = eventCategories.filter(q => q.parentId === parent.id);
    return {
      id: parent.id,
      name: parent.name,
      description: parent.description || 'Vote on student preferences.',
      questions: questions.map(q => {
        // Options for this question
        const options = allCandidates
          .filter(c => c.categoryId === q.id)
          .map(c => c.name);
        return {
          key: q.id,
          label: q.name,
          options: options
        };
      })
    };
  });

  const handleEventSubmit = (e) => {
    e.preventDefault();
    
    if (!isEventElectionOpen) {
      setFormError('Voting is currently closed for events.');
      return;
    }

    const eventObj = events.find(ev => ev.id === selectedEventId);
    if (!eventObj) return;
    
    // Validate all questions are answered
    const unanswered = eventObj.questions.some(q => !formSelections[q.key]);
    if (unanswered) {
      setFormError('Please select an option for all ballot questions.');
      return;
    }
    
    setFormError('');
    
    const newVote = {
      id: `ev-receipt-${Date.now()}`,
      studentId,
      eventId: selectedEventId,
      eventName: eventObj.name,
      selections: eventObj.questions.reduce((acc, q) => {
        acc[q.label] = formSelections[q.key];
        return acc;
      }, {}),
      issuedAt: new Date().toISOString()
    };
    
    const updatedVotes = [...eventVotes, newVote];
    setEventVotes(updatedVotes);
    window.localStorage.setItem('voting_event_votes', JSON.stringify(updatedVotes));
    setFormSelections({});
  };

  const studentEventVote = eventVotes.find(ev => ev.studentId === studentId && ev.eventId === selectedEventId);

  const handleEventDownload = () => {
    if (!studentEventVote) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Ballot Receipt - ${studentEventVote.id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;850;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #ffffff;
      color: #0f172a;
    }
  </style>
</head>
<body class="flex justify-center items-start min-h-screen py-10 px-6 bg-white">
  <div class="w-full max-w-2xl bg-white">
    <!-- Header Section -->
    <div class="pb-6 border-b border-slate-200">
      <span class="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Campus Ledger System</span>
      <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Official Ballot Receipt</h1>
    </div>

    <!-- Content Table -->
    <div class="py-8 space-y-6">
      <p class="text-sm text-slate-500 leading-relaxed">
        This document serves as the official transaction confirmation for your ballot. It has been securely logged on the campus election node.
      </p>

      <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <table class="w-full text-sm text-left border-collapse">
          <tbody>
            <tr class="border-b border-slate-200">
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] w-1/3 bg-slate-100/50">Receipt ID</td>
              <td class="px-6 py-4 font-mono font-bold text-slate-800 break-all select-all">${studentEventVote.id}</td>
            </tr>
            <tr class="border-b border-slate-200">
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] bg-slate-100/50">Voter ID</td>
              <td class="px-6 py-4 font-mono font-bold text-slate-800">${studentEventVote.studentId}</td>
            </tr>
            <tr class="border-b border-slate-200">
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] bg-slate-100/50">Election Category</td>
              <td class="px-6 py-4 font-bold text-slate-800">${studentEventVote.eventName}</td>
            </tr>
            <tr class="border-b border-slate-200">
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] bg-slate-100/50">Date Issued</td>
              <td class="px-6 py-4 font-semibold text-slate-800">${formatDate(studentEventVote.issuedAt)}</td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] bg-slate-100/50">Time Logged</td>
              <td class="px-6 py-4 font-semibold text-slate-800">${formatTime(studentEventVote.issuedAt)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ballot-receipt-${studentEventVote.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        
        {/* VIEW 1: PORTAL SELECTION */}
        {activeView === 'portal-selection' && (
          <div className="space-y-6">
            <div className="relative bg-gradient-to-r from-indigo-900 to-violet-905 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-lg">
              <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/6 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl" />
              <div className="relative z-10 space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-350 bg-indigo-950/60 border border-indigo-850 px-2.5 py-0.5 rounded-full">
                  Student Voter Portal
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome, {studentId}!
                </h1>
                <p className="text-slate-300 text-sm max-w-xl">
                  Please choose whether you want to access Club Elections or cast your vote on upcoming College Event decisions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Clubs */}
              <div 
                onClick={() => setActiveView('club')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    🏛️
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Club Elections Portal
                    </h3>
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                      Register your votes for running candidates and select representatives in active club leadership positions.
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                  <span>Enter Club Portal</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Events */}
              <div 
                onClick={() => setActiveView('event')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-955/20 text-violet-650 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    🎉
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Event Decisions Portal
                    </h3>
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                      Participate in event voting and select preferred themes, activities, and workshops for cultural fests and symposiums.
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-2 text-violet-605 dark:text-violet-400 font-semibold text-sm">
                  <span>Enter Event Portal</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CLUB SELECTION */}
        {activeView === 'club' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveView('portal-selection')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 outline-none"
              >
                ← Back to Portals
              </button>
            </div>

            <div className="space-y-8">
              {/* Present Clubs */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-indigo-600 pl-3">
                  Present Active Clubs
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {presentClubs.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                      <span className="text-slate-400 text-4xl">🏛️</span>
                      <p className="text-sm text-slate-500 mt-2 font-medium">No active club elections configured yet.</p>
                    </div>
                  ) : (
                    presentClubs.map((club, idx) => {
                      const colors = ['indigo', 'violet', 'fuchsia'];
                      const themeColor = colors[idx % colors.length];
                      
                      return (
                        <div 
                          key={club.id}
                          onClick={() => {
                            setActiveView('club-elections');
                            setSelectedClubId(club.id);
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between group"
                        >
                          <div className="space-y-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-${themeColor}-700 bg-${themeColor}-50 border border-${themeColor}-150 px-2 py-0.5 rounded-full dark:bg-${themeColor}-955/20 dark:text-${themeColor}-400`}>
                              Elections Open
                            </span>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {club.name}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {club.description || 'Currently conducting elections for student representatives. Click to view candidates and cast your vote.'}
                            </p>
                          </div>
                          <div className={`mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-${themeColor}-600 dark:text-${themeColor}-400 text-xs font-bold`}>
                            <span>Enter Election System</span>
                            <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Past Clubs */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-slate-300 pl-3">
                  Past Completed Clubs
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Photo Club */}
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 flex flex-col justify-between opacity-75 group">
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-400">
                        Elections Completed
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        Photography Club
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        All electoral terms are finalized. Voting is closed.
                      </p>
                    </div>
                  </div>

                  {/* Music Club */}
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 flex flex-col justify-between opacity-75 group">
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-400">
                        Elections Completed
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        Music Club
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        All electoral terms are finalized. Voting is closed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: UNIFIED CLUB ELECTIONS */}
        {activeView === 'club-elections' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setActiveView('club');
                  setSelectedClubId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 outline-none"
              >
                ← Back to Clubs
              </button>
            </div>

            <div className="space-y-8">
              {/* Dashboard Header Banner */}
              <div className="relative bg-gradient-to-r from-indigo-900 to-violet-905 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-lg">
                <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/6 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-350 bg-indigo-950/60 border border-indigo-850 px-2.5 py-0.5 rounded-full">
                        {activeClubTitle}
                      </span>
                      <StatusBadge status={election.status} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {election.title}
                    </h1>
                    <p className="text-slate-300 text-sm max-w-xl">
                      Welcome, {studentId}! Browse current categories, review candidates, and submit your secure ballot. You can vote exactly once per category.
                    </p>
                  </div>

                  {/* Voting Progress Card */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-center min-w-[200px]">
                    <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Voting Progress</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold">{activeClubStats.voted}</span>
                      <span className="text-slate-300 text-sm">/ {activeClubStats.total} categories</span>
                    </div>
                    <div className="w-full bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="bg-indigo-400 h-full rounded-full transition-all duration-550" 
                        style={{ width: `${activeClubStats.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-300 mt-2 text-right">
                      {activeClubStats.progress}% Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Voting Categories</h2>
                  <span className="text-xs text-slate-500">{activeClubStats.total} Available</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {activeClubCategories.map((category) => {
                    const votedInfo = voterStatus.votedCategoryIds[category.id];
                    const hasVoted = !!votedInfo;

                    return (
                      <div 
                        key={category.id} 
                        className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm dark:bg-slate-900 group ${
                          hasVoted 
                            ? 'border-indigo-100 dark:border-indigo-950 ring-1 ring-indigo-50 dark:ring-indigo-955/20' 
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Category State Indicator */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                              {category.id}
                            </span>
                            {hasVoted ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                Ballot Cast
                              </span>
                            ) : !isElectionOpen ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-955/30 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-900">
                                Closed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-955/30 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                                Ballot Available
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              {hasVoted 
                                ? 'Your ballot has been successfully received and counted in this category.' 
                                : isElectionOpen 
                                ? 'Review candidate profiles and manifestos to submit your choice.' 
                                : 'Voting is disabled because the manager has closed this election.'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                          {hasVoted ? (
                            <button
                              onClick={() => navigate(`/student/receipt/${votedInfo.receiptId}`)}
                              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-350 dark:hover:text-white rounded-xl text-xs font-semibold border border-slate-205 dark:border-slate-750 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View Receipt
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/student/vote/${category.id}`)}
                              disabled={!isElectionOpen}
                              className={`w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                                isElectionOpen
                                  ? 'bg-indigo-600 hover:bg-indigo-750 text-white shadow-md shadow-indigo-100 dark:shadow-none focus-visible:ring-2 focus-visible:ring-indigo-500'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-650 border border-slate-200 dark:border-slate-750 cursor-not-allowed'
                              }`}
                            >
                              {isElectionOpen ? (
                                <>
                                  Browse Candidates
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </>
                              ) : (
                                'Voting Closed'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: EVENTS SELECTION & BALLOTING */}
        {activeView === 'event' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (selectedEventId) {
                    setSelectedEventId(null);
                    setFormSelections({});
                    setFormError('');
                  } else {
                    setActiveView('portal-selection');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 outline-none"
              >
                {selectedEventId ? '← Back to Events' : '← Back to Portals'}
              </button>
            </div>

            {/* List of events if none is selected */}
            {!selectedEventId && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-violet-650 pl-3">
                  Upcoming College Event Decisions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {events.map((event) => {
                    const hasVoted = eventVotes.some(ev => ev.studentId === studentId && ev.eventId === event.id);

                    return (
                      <div 
                        key={event.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 whitespace-nowrap shrink-0">
                              {event.id.toUpperCase()}
                            </span>
                            {hasVoted ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-955/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900 whitespace-nowrap shrink-0">
                                Ballot Cast
                              </span>
                            ) : !isEventElectionOpen ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-650 bg-rose-50 dark:bg-rose-955/30 dark:text-rose-455 px-2.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-900 whitespace-nowrap shrink-0">
                                Closed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-605 bg-violet-50 dark:bg-violet-955/30 dark:text-violet-400 px-2.5 py-0.5 rounded-full border border-violet-100 dark:border-violet-900 whitespace-nowrap shrink-0">
                                Open
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {event.name}
                          </h3>
                          <p className="text-xs text-slate-505 leading-relaxed">
                            {event.description}
                          </p>
                          
                          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-2.5 border border-slate-105 dark:border-slate-850 flex items-center justify-between text-xs text-slate-655 dark:text-slate-400">
                            <span>Questions:</span>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {event.questions.length} {event.questions.length === 1 ? 'Question' : 'Questions'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => setSelectedEventId(event.id)}
                            disabled={!hasVoted && !isEventElectionOpen}
                            className={`w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                              hasVoted
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-350'
                                : !isEventElectionOpen
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-750 cursor-not-allowed'
                                : 'bg-violet-600 hover:bg-violet-750 text-white shadow-md shadow-violet-100 dark:shadow-none'
                            }`}
                          >
                            {hasVoted ? (
                              <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Ballot Receipt
                              </>
                            ) : !isEventElectionOpen ? (
                              'Voting Closed'
                            ) : (
                              <>
                                Cast Ballot
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Event Form or Receipt Card */}
            {selectedEventId && (
              <div className="max-w-2xl mx-auto">
                {studentEventVote ? (
                  <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto py-4">
                    
                    {/* Animated Checkmark and Success Header */}
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-955/20 text-emerald-500 border border-emerald-200 dark:border-emerald-900 shadow-md">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
                        Vote Confirmed!
                      </h1>
                      <p className="text-xs text-slate-500">
                        Thank you for casting your vote. Your ballot has been cryptographically signed and secured.
                      </p>
                    </div>

                    {/* Printable Receipt Card */}
                    <div
                      id="receipt-card"
                      className="w-full bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden print:border-none print:shadow-none"
                    >
                      {/* Top strip border styling */}
                      <div className="h-2 bg-indigo-600" />

                      <div className="p-6 sm:p-8 space-y-6">
                        {/* Header / Receipt details */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                              Official Ballot Receipt
                            </span>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                              Transaction Verified
                            </h2>
                          </div>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase font-mono">
                            Receipt
                          </span>
                        </div>

                        {/* Dotted separator line */}
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                        {/* Data items */}
                        <div className="space-y-4 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                              Receipt ID
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {studentEventVote.id}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                              Voter ID
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {studentEventVote.studentId}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                              Event Name
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {studentEventVote.eventName}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                              Date
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {formatDate(studentEventVote.issuedAt)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                              Time
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {formatTime(studentEventVote.issuedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Dotted separator line */}
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                        {/* Verification Hash / Security details */}
                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              Ballot Status
                            </h4>
                            <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal">
                              Recorded on Event Ledger.
                            </p>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 w-full print:hidden">
                      <button
                        onClick={() => setSelectedEventId(null)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/25 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none text-center"
                      >
                        Dashboard
                      </button>
                      
                      <button
                        onClick={handleEventDownload}
                        className="py-2.5 px-4 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-750 dark:text-slate-300 text-slate-700 border border-slate-250 dark:border-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>

                  </div>
                ) : (
                  /* Event Ballot casting form */
                  <form onSubmit={handleEventSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {events.find(ev => ev.id === selectedEventId).name} Ballot
                      </h2>
                      <p className="text-xs text-slate-550 mt-1.5 leading-relaxed">
                        Please review the decisions below and check your preferences. Once submitted, your choices are locked.
                      </p>
                    </div>

                    {formError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2 text-rose-800 dark:text-rose-455 text-xs font-semibold">
                        <span>⚠️</span>
                        <p>{formError}</p>
                      </div>
                    )}

                    <div className="space-y-6">
                      {events.find(ev => ev.id === selectedEventId).questions.map((question) => (
                        <div key={question.key} className="space-y-3">
                          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                            {question.label}
                          </label>
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <label 
                                key={option} 
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  formSelections[question.key] === option
                                    ? 'border-violet-650 bg-violet-50/50 dark:border-violet-750 dark:bg-violet-955/20 ring-1 ring-violet-550'
                                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950/30'
                                }`}
                              >
                                <input 
                                  type="radio" 
                                  name={question.key}
                                  value={option}
                                  checked={formSelections[question.key] === option}
                                  onChange={() => setFormSelections({ ...formSelections, [question.key]: option })}
                                  className="w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500 accent-violet-600 shrink-0"
                                />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  {option}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-violet-600 hover:bg-violet-750 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 transition-all flex items-center justify-center gap-2"
                    >
                      Submit Ballot
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;

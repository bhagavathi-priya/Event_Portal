import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import axiosClient from '../api/axiosClient';
import { ROLES } from '../utils/permissions';
import { motion } from 'framer-motion';

export const RoleSelection = () => {
  const { login } = useRole();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    const cleanId = studentId.trim();
    if (!cleanId) {
      setError('Please enter a valid Student ID');
      return;
    }
    setError('');

    try {
      const response = await axiosClient.post('/api/auth/student-login', {
        studentId: cleanId,
      });

      if (response.success) {
        login(ROLES.STUDENT, cleanId);
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('STUDENT LOGIN ERROR:', err);
      setError(err.message || 'Invalid Student ID.');
    }
  };

  const handleManagerLogin = () => {
    navigate('/manager/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative z-10"
      >
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/50 border border-indigo-900 px-3 py-1 rounded-full">
            Campus Elections 2026
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-4 tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-violet-200 bg-clip-text text-transparent">
            College Voting Portal
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Select your role to access the voting system or manage election candidates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Card */}
          <div className="bg-slate-850 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-650 flex items-center justify-center text-white mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-100 group-hover:text-blue-600 transition-colors">Student Voter</h2>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Browse categories, candidate manifestos, and cast your secure ballot.
              </p>
            </div>

            <form onSubmit={handleStudentLogin} className="mt-2 space-y-3">
              <div>
                <label htmlFor="student-id-input" className="sr-only">Student ID</label>
                <input
                  id="student-id-input"
                  type="text"
                  placeholder="Enter Student ID (e.g. 23CS001)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-slate-100 placeholder-slate-500 outline-none transition-all"
                />
              </div>
              {error && <p className="text-rose-500 text-xs">{error}</p>}
              <button
                id="btn-enter-student"
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-900/35 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
              >
                Enter Student Portal
              </button>
            </form>
          </div>

          {/* Manager Card */}
          <div className="bg-slate-850 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-violet-500/50 transition-all duration-300 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-650 flex items-center justify-center text-white mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-100 group-hover:text-blue-600 transition-colors">Election Manager</h2>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                Open/close voting, manage candidates and track tally progress.
              </p>
            </div>

            <div className="mt-2">
              <button
                onClick={handleManagerLogin}
                id="btn-enter-manager"
                className="w-full py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-sm font-semibold shadow-lg shadow-violet-900/35 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
              >
                Enter Manager Portal
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-slate-800/60">
          <p className="text-xs text-slate-500">
            Secure, encrypted, and audit-ready polling platform. Authorized college credentials only.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RoleSelection;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import axiosClient from '../../api/axiosClient';
import { ROLES } from '../../utils/permissions';
import { motion } from 'framer-motion';

export const StudentLogin = () => {
  const { login, isAuthenticated, role } = useRole();
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // If already logged in as student, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated && role === ROLES.STUDENT) {
      navigate('/student/dashboard');
    }
  }, [isAuthenticated, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanId = studentId.trim();
    const cleanDob = dob.trim();

    if (!cleanId) {
      setError('Please enter a valid Student ID');
      return;
    }
    if (!cleanDob) {
      setError('Please enter your Date of Birth (DOB)');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      const response = await axiosClient.post('/api/auth/student-login', {
        studentId: cleanId,
        dob: cleanDob
      });

      if (response.success) {
        // Log in the student and navigate directly to dashboard
        login(ROLES.STUDENT, cleanId);
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('STUDENT LOGIN ERROR:', err);
      setError(err.message || 'Invalid Student ID or Date of Birth.');
    } finally {
      setIsVerifying(false);
    }
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
        className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10"
      >
        <div className="text-center mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/50 border border-indigo-900 px-3 py-1 rounded-full">
            Security Gate
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-violet-200 bg-clip-text text-transparent">
            Student Login
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Enter your ID and Date of Birth to access the Student Portal.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Student ID */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="student-id-field" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Student ID *
            </label>
            <input
              id="student-id-field"
              type="text"
              placeholder="Enter Student ID (e.g. 23CS004)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={isVerifying}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Date of Birth (DOB) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="student-dob-field" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Date of Birth (DOB) *
            </label>
            <input
              id="student-dob-field"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={isVerifying}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 outline-none transition-all [color-scheme:dark]"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Submit Login */}
          <button
            type="submit"
            disabled={isVerifying}
            id="btn-login-student"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/35 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Go Back Trigger */}
        <div className="text-center mt-6 pt-4 border-t border-slate-800/60">
          <button
            onClick={() => navigate('/role-selection')}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            ← Back to Role Selection
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentLogin;

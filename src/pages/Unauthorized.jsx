import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { ROLES } from '../utils/permissions';

export const Unauthorized = () => {
  const navigate = useNavigate();
  const { role, logout } = useRole();

  const handleGoDashboard = () => {
    if (role === ROLES.STUDENT) {
      navigate('/student/dashboard');
    } else if (role === ROLES.MANAGER) {
      navigate('/manager/dashboard');
    } else {
      navigate('/role-selection');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/role-selection');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="mx-auto w-16 h-16 bg-rose-950/45 border border-rose-800 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v2m0-6a9 9 0 110 18 9 9 0 010-18z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Unauthorized Access
        </h1>
        <p className="text-sm text-slate-400 mt-2 mb-8">
          You do not have the required permissions to access this page. Your role has been restricted.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGoDashboard}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-950/25 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
          >
            Go to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-sm font-semibold border border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
          >
            Switch Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

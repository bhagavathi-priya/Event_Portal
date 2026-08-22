import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { ROLES } from '../../utils/permissions';
import { motion } from 'framer-motion';
import axiosClient from '../../api/axiosClient';

export const ManagerLogin = () => {
  const { login, role } = useRole();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (role === ROLES.MANAGER) {
      navigate('/manager/dashboard');
    }
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Both username and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.post('/api/auth/manager-login', {
        username: username.trim(),
        password: password,
      });

      if (response.success) {
        // Authenticate inside AuthContext
        login(ROLES.MANAGER);
        // Redirect to dashboard
        navigate('/manager/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative z-10"
      >
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-950/50 border border-violet-900 px-3 py-1 rounded-full">
            Security Gateway
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-4 tracking-tight bg-gradient-to-r from-violet-200 via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Manager Authorization
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Please enter your administrative credentials to access the manager dashboard.
          </p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="manager-username-input" className="text-xs font-bold uppercase tracking-wider text-slate-455">
              Username or Email
            </label>
            <input
              id="manager-username-input"
              type="text"
              placeholder="e.g. admin"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-slate-100 placeholder-slate-600 outline-none transition-all text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="manager-password-input" className="text-xs font-bold uppercase tracking-wider text-slate-455">
              Password
            </label>
            <input
              id="manager-password-input"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-slate-100 placeholder-slate-650 outline-none transition-all text-sm"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-rose-500 text-xs font-semibold"
            >
              ⚠️ {error}
            </motion.p>
          )}

          <div className="pt-2 flex flex-col gap-3">
            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-violet-650 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/35 transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Authorize & Enter'
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/role-selection')}
              disabled={loading}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-550"
            >
              Back to Role Selection
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ManagerLogin;

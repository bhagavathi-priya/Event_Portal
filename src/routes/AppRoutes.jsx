import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ROLES } from '../utils/permissions';

// Shared Pages
import RoleSelection from '../pages/RoleSelection';
import Unauthorized from '../pages/Unauthorized';

// Student Pages
import StudentLayout from '../layouts/StudentLayout';
import StudentDashboard from '../pages/student/StudentDashboard';
import CandidateDiscovery from '../pages/student/CandidateDiscovery';
import CandidateDetail from '../pages/student/CandidateDetail';
import VoteReceipt from '../pages/student/VoteReceipt';
import StudentLogin from '../pages/student/StudentLogin';

// Manager Pages
import ManagerLayout from '../layouts/ManagerLayout';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import CandidateManagement from '../pages/manager/CandidateManagement';
import LiveTally from '../pages/manager/LiveTally';
import ManagerLogin from '../pages/manager/ManagerLogin';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public/Entry Routes */}
      <Route path="/" element={<Navigate to="/role-selection" replace />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/manager/login" element={<ManagerLogin />} />
      <Route path="/student/login" element={<StudentLogin />} />

      {/* Student Protected Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="vote/:categoryId" element={<CandidateDiscovery />} />
        <Route path="candidate/:id" element={<CandidateDetail />} />
        <Route path="receipt/:receiptId" element={<VoteReceipt />} />
      </Route>

      {/* Manager Protected Routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        
        {/* Club Module */}
        <Route path="club/dashboard" element={<ManagerDashboard module="club" />} />
        <Route path="club/candidates" element={<CandidateManagement module="club" />} />
        <Route path="club/tally" element={<LiveTally module="club" />} />

        {/* Event Module */}
        <Route path="event/dashboard" element={<ManagerDashboard module="event" />} />
        <Route path="event/candidates" element={<CandidateManagement module="event" />} />
        <Route path="event/tally" element={<LiveTally module="event" />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/role-selection" replace />} />
    </Routes>
  );
};

export default AppRoutes;

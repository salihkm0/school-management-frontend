import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import OpenLayout from './OpenLayout';
import OpenMarklistFlow from './OpenMarklistFlow';
import OpenStudentsFlow from './OpenStudentsFlow';

const OpenDashboardRouter = () => {
  return (
    <Routes>
      <Route element={<OpenLayout />}>
        {/* Default redirect to marklist */}
        <Route index element={<Navigate to="marklist/2025-2026" replace />} />
        
        {/* Nested routes for Mark Lists */}
        <Route path="marklist/:year/*" element={<OpenMarklistFlow />} />
        
        {/* Nested routes for Students */}
        <Route path="students/:year/*" element={<OpenStudentsFlow />} />
      </Route>
    </Routes>
  );
};

export default OpenDashboardRouter;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import OpenLayout from './OpenLayout';
import OpenMarklistFlow from './OpenMarklistFlow';
import OpenStudentsFlow from './OpenStudentsFlow';
import StudentOutsourcingView from './StudentOutsourcingView';

const OpenDashboardRouter = () => {
  return (
    <Routes>
      <Route element={<OpenLayout />}>
        {/* Default redirect to outsourcing */}
        <Route index element={<Navigate to="outsourcing" replace />} />
        
        {/* Student Outsourcing Master View */}
        <Route path="outsourcing" element={<StudentOutsourcingView />} />
        
        {/* Nested routes for Mark Lists */}
        <Route path="marklist/:year/*" element={<OpenMarklistFlow />} />
        
        {/* Nested routes for Students */}
        <Route path="students/:year/*" element={<OpenStudentsFlow />} />
      </Route>
    </Routes>
  );
};

export default OpenDashboardRouter;

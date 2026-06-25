import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OpenStandardsList from './OpenStandardsList';
import OpenDivisionsList from './OpenDivisionsList';
import OpenStudentsList from './OpenStudentsList';
import StudentDetails from '../../components/students/StudentDetails';

const OpenStudentsFlow = () => {
  return (
    <Routes>
      <Route path="/" element={<OpenStandardsList />} />
      <Route path=":standard" element={<OpenDivisionsList />} />
      <Route path=":standard/:classId" element={<OpenStudentsList />} />
      <Route path="student/:id" element={<StudentDetails />} />
    </Routes>
  );
};

export default OpenStudentsFlow;

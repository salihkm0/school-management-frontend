import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ExamsList from './ExamsList';
import StandardsListForExam from './StandardsListForExam';
import DivisionsListForExam from './DivisionsListForExam';
import MarksEntryTable from './MarksEntryTable';

const MarksEntryRouter = () => {
  return (
    <Routes>
      <Route index element={<ExamsList />} />
      <Route path=":examId/standards" element={<StandardsListForExam />} />
      <Route path=":examId/standards/:standard/divisions" element={<DivisionsListForExam />} />
      <Route path=":examId/classes/:classId" element={<MarksEntryTable />} />
    </Routes>
  );
};

export default MarksEntryRouter;

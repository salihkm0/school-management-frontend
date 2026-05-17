// src/pages/ExamsPage.jsx
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ExamList from '../components/exams/ExamList'
import ExamForm from '../components/exams/ExamForm'
import ExamDetails from '../components/exams/ExamDetails'
import ExamSchedule from '../components/exams/ExamSchedule'
import MarksEntry from '../components/exams/MarksEntry'
import ExamReview from '../components/exams/ExamReview'
import StudentFilter from '../components/exams/StudentFilter' 

const ExamsPage = () => {
  return (
    <Routes>
      <Route index element={<ExamList />} />
      <Route path="new" element={<ExamForm />} />
      <Route path=":id" element={<ExamDetails />} />
      <Route path=":id/edit" element={<ExamForm />} />
      <Route path="schedule" element={<ExamSchedule />} />
      <Route path="marks" element={<MarksEntry />} />
      <Route path=":examId/marks/:classId" element={<MarksEntry />} />
      <Route path=":examId/review" element={<ExamReview />} />
      <Route path="filter" element={<StudentFilter />} /> 
    </Routes>
  )
}

export default ExamsPage
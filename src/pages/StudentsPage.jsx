import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StudentList from '../components/students/StudentList'
import StudentForm from '../components/students/StudentForm'
import StudentDetails from '../components/students/StudentDetails'
import StudentImport from '../components/students/StudentImport'
import PromotionList from '../components/students/PromotionList'
import StudentMarks from '../components/students/StudentMarks'
import StandardsList from '../components/students/StandardsList'
import DivisionsList from '../components/students/DivisionsList'
import AcademicYearsList from '../components/students/AcademicYearsList'

const StudentsPage = () => {
  return (
    <Routes>
      <Route index element={<AcademicYearsList />} />
      <Route path="years/:academicYearId" element={<StandardsList />} />
      <Route path="years/:academicYearId/standards/:standard" element={<DivisionsList />} />
      <Route path="classes/:classId" element={<StudentList />} />
      <Route path="all" element={<StudentList />} />
      <Route path="new" element={<StudentForm />} />
      <Route path=":id" element={<StudentDetails />} />
      <Route path=":id/edit" element={<StudentForm />} />
      <Route path="import" element={<StudentImport />} />
      <Route path="promotion-list" element={<PromotionList />} />
      <Route path=":id/marks" element={<StudentMarks />} />
    </Routes>
  )
}

export default StudentsPage
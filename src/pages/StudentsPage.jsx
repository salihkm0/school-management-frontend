import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StudentList from '../components/students/StudentList'
import StudentForm from '../components/students/StudentForm'
import StudentDetails from '../components/students/StudentDetails'
import StudentImport from '../components/students/StudentImport'
import PromotionList from '../components/students/PromotionList'
import StudentMarks from '../components/students/StudentMarks'

const StudentsPage = () => {
  return (
    <Routes>
      <Route index element={<StudentList />} />
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
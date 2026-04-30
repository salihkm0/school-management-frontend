import React from 'react'
import { Routes, Route } from 'react-router-dom'
import SubjectList from '../components/subjects/SubjectList'
import SubjectForm from '../components/subjects/SubjectForm'
import SubjectTemplate from '../components/subjects/SubjectTemplate'

const SubjectsPage = () => {
  return (
    <Routes>
      <Route index element={<SubjectList />} />
      <Route path="new" element={<SubjectForm />} />
      <Route path=":id/edit" element={<SubjectForm />} />
      <Route path="template" element={<SubjectTemplate />} />
    </Routes>
  )
}

export default SubjectsPage
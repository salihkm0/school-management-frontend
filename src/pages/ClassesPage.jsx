import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ClassList from '../components/classes/ClassList'
import ClassForm from '../components/classes/ClassForm'
import ClassDetails from '../components/classes/ClassDetails'
import SubjectTeacherMapping from '../components/classes/SubjectTeacherMapping'
import Timetable from '../components/classes/Timetable'

const ClassesPage = () => {
  return (
    <Routes>
      <Route index element={<ClassList />} />
      <Route path="new" element={<ClassForm />} />
      <Route path=":id" element={<ClassDetails />} />
      <Route path=":id/edit" element={<ClassForm />} />
      <Route path=":id/subject-teachers" element={<SubjectTeacherMapping />} />
      <Route path=":id/timetable" element={<Timetable />} />
    </Routes>
  )
}

export default ClassesPage
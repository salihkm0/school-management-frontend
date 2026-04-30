import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StaffList from '../components/staff/StaffList'
import StaffForm from '../components/staff/StaffForm'
import StaffDetails from '../components/staff/StaffDetails'
import StaffAssignment from '../components/staff/StaffAssignment'
import StaffTimetable from '../components/staff/StaffTimetable'

const StaffPage = () => {
  return (
    <Routes>
      <Route index element={<StaffList />} />
      <Route path="new" element={<StaffForm />} />
      <Route path=":id" element={<StaffDetails />} />
      <Route path=":id/edit" element={<StaffForm />} />
      <Route path=":id/assignments" element={<StaffAssignment />} />
      <Route path=":id/timetable" element={<StaffTimetable />} />
    </Routes>
  )
}

export default StaffPage
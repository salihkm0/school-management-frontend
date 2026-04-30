// src/pages/ParentsPage.jsx
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ParentList from '../components/parents/ParentList'
import ParentForm from '../components/parents/ParentForm'
import ParentDetails from '../components/parents/ParentDetails'

const ParentsPage = () => {
  return (
    <Routes>
      <Route index element={<ParentList />} />
      <Route path="new" element={<ParentForm />} />
      <Route path=":id" element={<ParentDetails />} />
      <Route path=":id/edit" element={<ParentForm />} />
    </Routes>
  )
}

export default ParentsPage
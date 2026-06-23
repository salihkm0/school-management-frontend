import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HistoricalYearsList from './HistoricalYearsList'
import HistoricalStandardsList from './HistoricalStandardsList'
import HistoricalMediumsList from './HistoricalMediumsList'
import HistoricalClassesList from './HistoricalClassesList'
import HistoricalMarksList from './HistoricalMarksList'

const HistoricalRecordsFlow = () => {
  return (
    <Routes>
      <Route path="/" element={<HistoricalYearsList />} />
      <Route path=":year" element={<HistoricalStandardsList />} />
      <Route path=":year/:standard" element={<HistoricalMediumsList />} />
      <Route path=":year/:standard/:medium" element={<HistoricalClassesList />} />
      <Route path=":year/:standard/:medium/:division" element={<HistoricalMarksList />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}

export default HistoricalRecordsFlow

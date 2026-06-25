import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HistoricalStandardsList from '../admin/HistoricalRecords/HistoricalStandardsList';
import HistoricalMediumsList from '../admin/HistoricalRecords/HistoricalMediumsList';
import HistoricalClassesList from '../admin/HistoricalRecords/HistoricalClassesList';
import HistoricalMarksList from '../admin/HistoricalRecords/HistoricalMarksList';

const OpenMarklistFlow = () => {
  return (
    <Routes>
      <Route path="/" element={<HistoricalStandardsList />} />
      <Route path=":standard" element={<HistoricalMediumsList />} />
      <Route path=":standard/:medium" element={<HistoricalClassesList />} />
      <Route path=":standard/:medium/:division" element={<HistoricalMarksList />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
};

export default OpenMarklistFlow;

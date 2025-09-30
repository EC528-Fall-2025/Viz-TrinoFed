import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Help from '../pages/Help'
import QueryHistory from '../pages/QueryHistory'
import NotFound from '../pages/NotFound'
import TreePage from '../pages/TreePage'

// page routing for the app

const AppRoutes = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<TreePage />} />
        <Route path="/help" element={<Help />} />
        <Route path="/current-query" element={<Navigate to="/" replace/>} />
        <Route path="/query-history" element={<QueryHistory />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
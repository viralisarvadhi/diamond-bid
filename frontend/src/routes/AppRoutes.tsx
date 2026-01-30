import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import NotFound from '../pages/NotFound'
import ProtectedRoute from './ProtectedRoute'
import UserDashboard from '../pages/user/UserDashboard'
import UserDiamonds from '../pages/user/UserDiamonds'
import MyBids from '../pages/user/MyBids'
import BidPage from '../pages/user/BidPage'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminDiamonds from '../pages/admin/AdminDiamonds'
import CreateDiamond from '../pages/admin/CreateDiamond'
import AdminBids from '../pages/admin/AdminBids'
import AdminResult from '../pages/admin/AdminResult'
import UserLayout from '../components/layouts/UserLayout'
import AdminLayout from '../components/layouts/AdminLayout'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/user" element={<ProtectedRoute allowedRoles={['USER']} />}>
        <Route element={<UserLayout />}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="diamonds" element={<UserDiamonds />} />
          <Route path="my-bids" element={<MyBids />} />
          <Route path="bid/:diamondId" element={<BidPage />} />
        </Route>
      </Route>

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="diamonds" element={<AdminDiamonds />} />
          <Route path="diamonds/create" element={<CreateDiamond />} />
          <Route path="bids/:diamondId" element={<AdminBids />} />
          <Route path="results/:diamondId" element={<AdminResult />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes

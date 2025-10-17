// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import HomePage from "./components/HomePage";
import DashboardLayout from "./components/Dashboard/Dashboard";
import ThreeDView from "./components/Dashboard/Threeview";
import Whatif from "./components/Dashboard/whatif.jsx";
import GIS from "./components/Dashboard/gis.jsx";
function App() {
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomePage />} />
      
      {/* Dashboard Layout with Outlet for nested routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        {/* Index Route - Default dashboard page */}
        <Route index element={<Navigate to="/dashboard/predict-disaster" replace />} />
        
        {/* Dashboard Sub-routes */}
        <Route path="predict-disaster" element={<ThreeDView />} />
        <Route path="gis" element={<GIS />} />
        <Route path="whatif" element={<Whatif />} />
        {/* <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} /> */}
        
        {/* Add more subpages here */}
        {/* <Route path="profile" element={<ProfilePage />} /> */}
        {/* <Route path="analytics" element={<AnalyticsPage />} /> */}
      </Route>

      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
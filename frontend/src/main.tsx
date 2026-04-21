import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./pages/Home";
import NewRequest from "./pages/NewRequest";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import RequestDetail from "./pages/admin/RequestDetail";
import Settings from "./pages/admin/Settings";
import Integration from "./pages/admin/Integration";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/request/new" element={<NewRequest />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/requests/:id" element={<RequestDetail />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/integration" element={<Integration />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

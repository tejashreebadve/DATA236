// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import App from "./App";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OwnerSignup from "./pages/OwnerSignup"; 
import Search from "./pages/Search";
import PropertyDetails from "./pages/PropertyDetails";
import TravelerProfile from "./pages/TravelerProfile";
import TravelerDashboard from "./pages/TravelerDashboard";
import OwnerProfile from "./pages/OwnerProfile";
import OwnerDashboard from "./pages/OwnerDashboard";
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';

// Simple error element so router errors never white-screen
function RouteError() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Something went wrong loading this route.</h1>
      <p className="text-black/60 mt-2">Check the browser console for the exact error.</p>
      <a href="/" className="inline-block mt-4 px-3 py-1 rounded-full border border-black bg-black text-white">Go Home</a>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
       { path: "signup/owner", element: <OwnerSignup /> }, 
      { path: "search", element: <Search /> },
      { path: "property/:id", element: <PropertyDetails /> },
      { path: "traveler", element: <TravelerDashboard /> },
      { path: "traveler/profile", element: <TravelerProfile /> },
      { path: "owner", element: <OwnerDashboard /> },
      { path: "owner/profile", element: <OwnerProfile /> },
      { path: 'owner/add', element: <AddProperty /> },
      { path: 'owner/edit/:id', element: <EditProperty /> },
      { path: "*", element: <div className="p-4">Not found</div> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

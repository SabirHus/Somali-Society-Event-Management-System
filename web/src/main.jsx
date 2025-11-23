import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Success from "./pages/Success.jsx";
import Admin from "./pages/Admin.jsx";
import Scan from "./pages/Scan.jsx";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/", element: <Register /> },
  { path: "/success", element: <Success /> },
  { path: "/admin", element: <Admin /> },
  { path: "/scan", element: <Scan /> }, 
  { path: "/admin/scan", element: <Scan /> } 
]);

createRoot(document.getElementById("root")).render(
<RouterProvider router={router} />
);

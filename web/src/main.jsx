import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import EventRegister from "./pages/EventRegister.jsx";
import Register from "./pages/Register.jsx";
import Success from "./pages/Success.jsx";
import Admin from "./pages/Admin.jsx";
import Scan from "./pages/Scan.jsx";
import EditEvent from './pages/EditEvent';
import EditAttendee from './pages/EditAttendee';
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/event/:eventId", element: <EventRegister /> },
  { path: "/register", element: <Register /> },
  { path: "/success", element: <Success /> },
  { path: "/admin", element: <Admin /> },
  { path: "/admin/events/:eventId/edit", element: <EditEvent />},
  { path: "/admin/attendees/:attendeeId/edit", element: <EditAttendee />},
  { path: "/scan", element: <Scan /> }, 
  { path: "/admin/scan", element: <Scan /> },
  { path: "/terms", element: <Terms /> },
  { path: "/privacy", element: <Privacy /> }
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
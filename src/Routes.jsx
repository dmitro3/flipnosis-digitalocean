import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import CreateFlip from "./pages/CreateFlip";
import Layout from "./components/Layout";
import AdminPanel from "./components/AdminPanel";
import Dashboard from "./components/Dashboard";
import UnifiedGamePage from "./components/UnifiedGamePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "create",
        element: <CreateFlip />,
      },
      {
        path: "game/:gameId",
        element: <UnifiedGamePage />,
      },
      {
        path: "admin",
        element: <AdminPanel />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
    ],
  },
]); 
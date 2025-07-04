import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import CreateFlip from "./pages/CreateFlip";
import FlipGame from "./pages/FlipGame";
import Layout from "./components/Layout";
import AdminPanel from "./components/AdminPanel";

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
        element: <FlipGame />,
      },
      {
        path: "admin",
        element: <AdminPanel />,
      },

    ],
  },
]); 
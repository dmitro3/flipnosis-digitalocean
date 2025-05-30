import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import CreateFlip from "./pages/CreateFlip";
import FlipGame from "./components/FlipGame";
import Layout from "./components/Layout";

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
    ],
  },
]); 
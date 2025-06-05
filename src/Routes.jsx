import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import EnhancedFlipGame from "./components/FlipGame";
import DatabaseAdmin from "./components/DatabaseAdmin";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "game/:gameId",
        element: <EnhancedFlipGame />,
      },
      {
        path: "admin",
        element: <DatabaseAdmin />,
      },
    ],
  },
]);

export default router; 
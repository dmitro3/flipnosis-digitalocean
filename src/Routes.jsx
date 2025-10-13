import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import CreateBattle from "./pages/CreateBattle";
import Layout from "./components/Layout";
import AdminPanel from "./components/AdminPanel";
import Dashboard from "./components/Dashboard";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import BattleRoyaleContainer from "./components/BattleRoyale/BattleRoyaleContainer";
import ErrorBoundary from "./components/BattleRoyale/ErrorBoundary";
import TestGame from "./Pages/TestGame";
import TestGameStandalone from "./Pages/TestGameStandalone";
import TestGlassTubeGame from "./pages/TestGlassTubeGame";

export const router = createBrowserRouter([
  {
    // Standalone test route (no Layout = no wagmi dependencies)
    path: "/test-standalone",
    element: <TestGameStandalone />,
  },
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
        element: <CreateBattle />,  // Redirect create to Battle Royale creation
      },
      {
        path: "create-battle",
        element: <CreateBattle />,
      },
      {
        path: "admin",
        element: <AdminPanel />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "profile/:address",
        element: <Profile />,
      },
      {
        path: "leaderboard",
        element: <Leaderboard />,
      },
      {
        path: "battle-royale/:gameId",
        element: (
          <ErrorBoundary>
            <BattleRoyaleContainer />
          </ErrorBoundary>
        ),
      },
      {
        path: "test",
        element: <TestGame />,
      },
      {
        path: "test-glass-tube",
        element: <TestGlassTubeGame />,
      },
    ],
  },
]); 
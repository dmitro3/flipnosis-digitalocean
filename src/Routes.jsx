import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import CreateFlip from "./pages/CreateFlip";
import Layout from "./components/Layout";
import AdminPanel from "./components/AdminPanel";
import Dashboard from "./components/Dashboard";
import GameLobby from "./components/Lobby/GameLobby";  // Changed from GamePage
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";

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
        path: "game/listing_:listingId",
        element: <GameLobby />,  // Changed from GamePage
      },
      {
        path: "game/:gameId",
        element: <GameLobby />,  // Changed from GamePage
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
    ],
  },
]); 
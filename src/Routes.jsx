import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import CreateFlip from "./pages/CreateFlip";
import CreateBattle from "./pages/CreateBattle";
import Layout from "./components/Layout";
import AdminPanel from "./components/AdminPanel";
import Dashboard from "./components/Dashboard";
import LobbyFinal from "./components/LobbyFinal";  // Direct lobby component
import FlipSuiteFinal from "./components/FlipSuiteFinal";  // New clean game room
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import BattleRoyaleLobby from "./components/BattleRoyale/BattleRoyaleLobby";
import BattleRoyaleGameRoom from "./components/BattleRoyale/BattleRoyaleGameRoom";
import BattleRoyaleContainer from "./components/BattleRoyale/BattleRoyaleContainer";

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
        path: "create-battle",
        element: <CreateBattle />,
      },
      {
        path: "game/listing_:listingId",
        element: <LobbyFinal />,  // Direct lobby for listing pages
      },
      {
        path: "game/:gameId",
        element: <FlipSuiteFinal />,  // Direct to server-side game
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
        element: <BattleRoyaleContainer />,
      },
      {
        path: "battle-royale/:gameId/play",
        element: <BattleRoyaleGameRoom />,
      },
    ],
  },
]); 
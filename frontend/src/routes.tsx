import Chat from "./pages/chat";
import { Routes, Route } from "react-router-dom";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/chat/*" element={<Chat />} />
    </Routes>
  );
};

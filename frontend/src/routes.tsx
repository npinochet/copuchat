import Chat from "./pages/chat";
import { QueryClient, QueryClientProvider } from "react-query";
import { Routes, Route } from "react-router-dom";

const queryClient = new QueryClient();

export const AppRoutes = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/chat/*" element={<Chat />} />
      </Routes>
    </QueryClientProvider>
  );
};

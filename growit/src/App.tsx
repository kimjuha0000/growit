import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Player from "./pages/Player";
import MyPage from "./pages/MyPage";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Categories from "./pages/Categories";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/hooks/use-auth";
import GlobalAnalytics from "@/components/GlobalAnalytics";
import RequireAuth from "@/components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalAnalytics />
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              }
            />
            <Route
              path="/courses"
              element={
                <RequireAuth>
                  <Courses />
                </RequireAuth>
              }
            />
            <Route
              path="/course/:id"
              element={
                <RequireAuth>
                  <CourseDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/player"
              element={
                <RequireAuth>
                  <Player />
                </RequireAuth>
              }
            />
            <Route
              path="/my-page"
              element={
                <RequireAuth>
                  <MyPage />
                </RequireAuth>
              }
            />
            <Route
              path="/search"
              element={
                <RequireAuth>
                  <Search />
                </RequireAuth>
              }
            />
            <Route
              path="/cart"
              element={
                <RequireAuth>
                  <Cart />
                </RequireAuth>
              }
            />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/categories"
              element={
                <RequireAuth>
                  <Categories />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminPage />
                </RequireAuth>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route
              path="*"
              element={
                <RequireAuth>
                  <NotFound />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;

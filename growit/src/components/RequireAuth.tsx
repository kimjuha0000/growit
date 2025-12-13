import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default RequireAuth;

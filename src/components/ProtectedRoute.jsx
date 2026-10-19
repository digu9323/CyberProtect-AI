
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");

  const token = localToken || sessionToken;

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

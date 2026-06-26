import { Navigate } from "react-router-dom";
import React from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      // ✅ Step 1: localStorage check
      const token = localStorage.getItem("authToken");
      const user = localStorage.getItem("user");
      
      if (token && user) {
        // ✅ Token aur user dono hain toh authenticated
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // ✅ Step 2: Agar nahi hai toh API call karo
      try {
        const response = await fetch("http://localhost:5000/auth", {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          // ✅ Agar API successful hai toh localStorage mein save karo
          localStorage.setItem("user", JSON.stringify(data.user));
          // Note: AuthToken cookie mein hai, isliye yahan se nahi milega
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
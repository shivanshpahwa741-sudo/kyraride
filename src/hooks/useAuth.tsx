import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthUser {
  id: string;
  name: string;
  phone: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "kyra_auth_user";
const SESSION_TOKEN_KEY = "kyra_session_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate session with backend
  const validateSession = useCallback(async (token: string): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("auth-session", {
        body: { action: "validate", sessionToken: token },
      });

      if (error || !data?.valid) {
        console.log("Session validation failed:", data?.error);
        return null;
      }

      return {
        id: data.user.id,
        name: data.user.name,
        phone: data.user.phone,
        isVerified: true,
      };
    } catch (err) {
      console.error("Session validation error:", err);
      return null;
    }
  }, []);

  // Load and validate user session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(SESSION_TOKEN_KEY);
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

        if (token) {
          // Validate token with backend
          const validatedUser = await validateSession(token);
          if (validatedUser) {
            setUser(validatedUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validatedUser));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem(SESSION_TOKEN_KEY);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } else if (storedUser) {
          // Fallback: use stored user but mark as needing re-auth
          const parsed = JSON.parse(storedUser);
          if (parsed?.isVerified) {
            setUser(parsed);
          }
        }
      } catch (error) {
        console.error("Failed to load auth state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [validateSession]);

  // Create session on login
  const login = useCallback(async (name: string, phone: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("auth-session", {
        body: { action: "create", phone },
      });

      if (error) {
        console.error("Session creation error:", error);
        // Fallback to local storage only
        const newUser: AuthUser = {
          id: crypto.randomUUID(),
          name,
          phone,
          isVerified: true,
        };
        setUser(newUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        return;
      }

      if (data?.success && data.sessionToken) {
        localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
        
        const newUser: AuthUser = {
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          isVerified: true,
        };
        setUser(newUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      } else {
        // Fallback
        const newUser: AuthUser = {
          id: crypto.randomUUID(),
          name,
          phone,
          isVerified: true,
        };
        setUser(newUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      }
    } catch (err) {
      console.error("Login error:", err);
      // Fallback
      const newUser: AuthUser = {
        id: crypto.randomUUID(),
        name,
        phone,
        isVerified: true,
      };
      setUser(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    }
  }, []);

  // Logout and invalidate session
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (token) {
        await supabase.functions.invoke("auth-session", {
          body: { action: "logout", sessionToken: token },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return false;

    const validatedUser = await validateSession(token);
    if (validatedUser) {
      setUser(validatedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validatedUser));
      return true;
    }

    // Session invalid
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    return false;
  }, [validateSession]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Get session token for API calls
export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

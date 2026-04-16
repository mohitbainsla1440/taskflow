import { useCallback, useEffect, useState } from "react";
import {
  getToken,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  type User,
} from "../lib/api";

const USER_KEY = "taskflow_user";

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => ({
    token: getToken(),
    user: readStoredUser(),
    loading: false,
    error: null,
  }));

  useEffect(() => {
    if (state.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [state.user]);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiLogin({ email, password });
      setState({
        token: data.token,
        user: data.user,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await apiRegister({ name, email, password });
        setState({
          token: data.token,
          user: data.user,
          loading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        setState((s) => ({ ...s, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const logout = useCallback(() => {
    apiLogout();
    setState({ token: null, user: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    token: state.token,
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: Boolean(state.token),
    login,
    register,
    logout,
    clearError,
  };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;

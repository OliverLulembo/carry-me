import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthUser } from "@/api/client";
import { devLogin, getMe } from "@/api/endpoints";

const TOKEN_KEY = "carryme.session.token";
const USER_KEY = "carryme.session.user";

// SecureStore is unavailable on web; fall back to in-memory storage there.
const memoryStore: Record<string, string | undefined> = {};

async function loadString(key: string): Promise<string | null> {
  if (Platform.OS === "web") return memoryStore[key] ?? null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function saveString(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    memoryStore[key] = value;
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    /* noop */
  }
}

async function clearString(key: string): Promise<void> {
  if (Platform.OS === "web") {
    delete memoryStore[key];
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* noop */
  }
}

type AuthState = {
  status: "loading" | "signedOut" | "signedIn";
  token: string | null;
  user: AuthUser | null;
  error: string | null;
};

type AuthContextValue = AuthState & {
  signInDev: (phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    token: null,
    user: null,
    error: null,
  });

  // Rehydrate on boot.
  useEffect(() => {
    (async () => {
      const [token, userRaw] = await Promise.all([
        loadString(TOKEN_KEY),
        loadString(USER_KEY),
      ]);
      if (!token) {
        setState({ status: "signedOut", token: null, user: null, error: null });
        return;
      }
      try {
        const fresh = await getMe(token);
        setState({
          status: "signedIn",
          token,
          user: fresh.user,
          error: null,
        });
        await saveString(USER_KEY, JSON.stringify(fresh.user));
      } catch {
        // Token rejected — fall back to cached user (offline tolerance) but
        // still keep us signed in so the UI can render something.
        const cached = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
        if (cached) {
          setState({
            status: "signedIn",
            token,
            user: cached,
            error: null,
          });
        } else {
          await clearString(TOKEN_KEY);
          setState({
            status: "signedOut",
            token: null,
            user: null,
            error: null,
          });
        }
      }
    })();
  }, []);

  const signInDev = useCallback(async (phone?: string) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { token, user } = await devLogin(phone);
      await Promise.all([
        saveString(TOKEN_KEY, token),
        saveString(USER_KEY, JSON.stringify(user)),
      ]);
      setState({ status: "signedIn", token, user, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      setState({
        status: "signedOut",
        token: null,
        user: null,
        error: message,
      });
    }
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([clearString(TOKEN_KEY), clearString(USER_KEY)]);
    setState({ status: "signedOut", token: null, user: null, error: null });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.token) return;
    try {
      const { user } = await getMe(state.token);
      await saveString(USER_KEY, JSON.stringify(user));
      setState((s) => ({ ...s, user }));
    } catch {
      /* keep stale */
    }
  }, [state.token]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signInDev, signOut, refreshUser }),
    [state, signInDev, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Convenience hook for screens that require a token: throws if missing so
// callers don't have to null-check downstream.
export function useToken(): string {
  const { token } = useAuth();
  if (!token) throw new Error("Expected a session token at this point");
  return token;
}

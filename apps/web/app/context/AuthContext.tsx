import { createContext, type Dispatch, type SetStateAction } from "react";
import type { CurrentUser } from "../hooks/useAuth";

type AuthContextValue = {
  user: CurrentUser | null;
  setUser: Dispatch<SetStateAction<CurrentUser | null>>;
  isAuthLoading: boolean;
  refreshUser: () => Promise<CurrentUser | null>;
};

export const Authcontext = createContext<AuthContextValue | null>(null);

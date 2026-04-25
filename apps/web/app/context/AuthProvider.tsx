"use client";

import { Authcontext } from "./AuthContext";
import { useState, useEffect, type ReactNode, useContext } from "react";
import { getCurrentUser, type CurrentUser } from "../hooks/useAuth";


export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            return currentUser;
        } catch {
            setUser(null);
            return null;
        }
    };
   
      useEffect(() => {
        refreshUser().finally(() => {
            setIsAuthLoading(false);
        });
      }, []);

    return (

        <Authcontext.Provider value={{user, setUser, isAuthLoading, refreshUser}}>
               {children}
        </Authcontext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(Authcontext);
    return context;
};

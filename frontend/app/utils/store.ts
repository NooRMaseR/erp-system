import { create } from "zustand";

type UserSessionStore = {
    email: string | null;
    username: string | null;
    login: (email: string, username: string) => void;
}

export const useAuthState = create<UserSessionStore>((set) => ({
    email: null,
    username: null,
    login(email, username) {
        set({ email, username });
    }
}));

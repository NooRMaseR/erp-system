import { create } from "zustand";
import { components } from "../generated/schema";

type User = {
    email: string | null;
    username: string | null;
    role: components['schemas']['ERPUserRole'];
};

type UserSessionStore = {
    user: User | null,
    login: (user: User) => void;
}

type InvoiceToEdit = {
    invoiceNumber: string | null;
    setData: (invoiceNumber: string) => void;
    clean: () => void;
}

export const useAuthState = create<UserSessionStore>((set) => ({
    user: null,
    login(user) {
        set({ user });
    }
}));

export const useEditInvoiceState = create<InvoiceToEdit>((set) => ({
    invoiceNumber: null,
    info: null,
    setData(invoiceNumber) {
        set({ invoiceNumber });
    },
    clean() {
        set({ invoiceNumber: null });
    }
}))

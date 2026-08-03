"use server";

import { components } from "./generated/schema";
import { cookies } from "next/headers";
import { API } from "./utils/api";

type AuthResponse = {
    success: boolean;
    data?: components['schemas']['LoginResponse'];
    error?: string;
}

export async function authenticateUser(loginData: components['schemas']['LoginRequest']): Promise<AuthResponse> {

    const [cookies_set, { data, error }] = await Promise.all(
        [
            cookies(),
            API.POST("/login/", {
                body: loginData,
            })
        ]
    );

    if (error || !data) {
        return { error: "Invalid credentials. Please try again.", success: false };
    }

    cookies_set.set({
        name: "auth_token",
        value: data.tokens.access_token,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 3600,
    });
    cookies_set.set({
        name: "refresh_token",
        value: data.tokens.refresh_token,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 3600 * 24 * 7,
    });

    return { success: true, data };
}

export const deleteAuthCookies = async () => {
    const cookies_store = await cookies();
    cookies_store.delete("auth_token");
    cookies_store.delete("refresh_token");
}
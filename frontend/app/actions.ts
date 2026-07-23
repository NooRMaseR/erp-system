"use server";

import { components } from "./generated/schema";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { API } from "./utils/api";

export async function authenticateUser(loginData: components['schemas']['LoginRequest'], logFunc: (email: string, username: string) => void) {
    const cookies_set = await cookies();

    const { data, error } = await API.POST("/login/", {
        body: loginData,
    });

    if (error || !data) {
        return { error: "Invalid credentials. Please try again." };
    }

    // Set the HTTP-Only cookie for extreme security
    cookies_set.set({
        name: "auth_token",
        value: data.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 1, // 1 hours
    });
    logFunc(data.email, data.username);

    // Redirect to the Dashboard upon success
    redirect("/super/dashboard");
}
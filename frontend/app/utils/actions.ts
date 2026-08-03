'use server';

import { cookies } from "next/headers";

export default async function get_auth_token() {
    const cookies_store = await cookies();
    return cookies_store.get("auth_token");
}

import type { paths } from "../generated/schema";
import createClient from "openapi-fetch";
import get_auth_token from "./actions";

export const BASE_API_URL = "http://localhost:8000";
export const API = createClient<paths>({ baseUrl: BASE_API_URL });

// eslint-disable-next-line react-hooks/rules-of-hooks
API.use({
    async onRequest({ request }) {
        const token = await get_auth_token();
        if (token) {
            request.headers.set("Authorization", `Bearer ${token.value}`);
        }

        return request;
    }
});

export type SearchParamsType<T> = {
    searchParams: Promise<T>;
}

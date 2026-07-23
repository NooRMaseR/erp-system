import createClient from "openapi-fetch";
import type { paths } from "../generated/schema";

export const API = createClient<paths>({ baseUrl: "http://localhost:8000" });

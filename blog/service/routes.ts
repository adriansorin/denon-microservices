import {
    createRouteMap,
    jsonResponse,
    forMethod,
    DBPool,
    uuidv4
} from "../deps.ts";

import createBlogService from "./blog_service.ts";
import createDbService from "./db_service.ts";


function createClientOpts() {
    return Object.fromEntries([
        ["hostname", "POSTGRES_HOST"],
        ["user", "POSTGRES_USER"],
        ["password", "POSTGRES_PASSWORD"],
        ["database", "POSTGRES_DB"]
    ].map(([key, envVar]) => [key, Deno.env.get(envVar)]));
}

function getPoolConnectionCount() {
    return Number.parseInt(Deno.env.get("POSTGRES_POOL_CONNECTIONS") || "1")
}

const dbPool = new DBPool(createClientOpts(), getPoolConnectionCount());

const blogService = createBlogService(createDbService(dbPool), uuidv4.generate);

async function getPosts() {
    const res = await blogService.getPosts();
    return jsonResponse(res);
}

const routes = createRouteMap([
    ["/posts", forMethod([
        ["GET", getPosts],
    ])],
]);

export default routes;
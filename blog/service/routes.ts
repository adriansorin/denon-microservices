import {
    createRouteMap,
    jsonResponse,
    forMethod,
    AugmentedRequest,
    DBPool,
    uuidv4,
    withJsonBody,
} from "../deps.ts";

import createBlogService, { BlogService, CreatePostPayload, EditPostPayload } from "./blog_service.ts";
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

export class PostNotFoundError extends Error {
    constructor(id: string) {
      super(`Post not found with ID ${id}`);
    }
}

async function getPost(blogService: BlogService, id: string) {
    const res = await blogService.getPost(id);
    if (!res) {
        throw new PostNotFoundError(`Post not found with ID ${id}`);
    }
    return res;
  }

async function getPosts({ routeParams: [id] }: AugmentedRequest) {
    const res = await (id ? getPost(blogService, id) : blogService.getPosts());
    return jsonResponse(res);
}

const addPost = withJsonBody<CreatePostPayload>(
    // @ts-ignore
    async function addPost({ body }) {
      const id = await blogService.createPost(body);
      return jsonResponse({ id });
    },
);

const editPost = withJsonBody<EditPostPayload>(
    // @ts-ignore
    async function editPost({ body: { contents }, routeParams: [id] }) {
      const rowCount = await blogService.editPost(id, contents);
  
      if (rowCount === 0) {
        throw new PostNotFoundError(id);
      }
  
      return jsonResponse({ id });
    },
);

const routes = createRouteMap([
    ["/posts/*", forMethod([
        ["GET", getPosts],
        ["POST", addPost],
        ["PATCH", editPost],
    ])],
]);

export default routes;
import {
  listenAndServe,
  ServerRequest,
  textResponse,
  createRouter,
  NotFoundError,
} from "../deps.ts";

import routes, { PostNotFoundError } from "./routes.ts";

const BINDING = ":8000";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function logRequest(req: ServerRequest) {
  console.log(`[${formatDate(new Date())}] Request for ${req.url}`);
}

function createErrorResponse(status: number, { message }: Error) {
  return textResponse(message, {}, status);
}

function badRequest(e: Error) {
  return createErrorResponse(400, e);
}

function notFound(e: Error) {
  return createErrorResponse(404, e);
}

function serverError(e: Error) {
  return createErrorResponse(500, e);
}

function mapToErrorResponse(e: Error) {
  switch (e.constructor) {
    case NotFoundError:
    case PostNotFoundError:
      return notFound(e);
    default:
      return serverError(e);
  }
}

console.log(`Listening for requests on ${BINDING}...`);

await listenAndServe(
  BINDING,
  async (req: ServerRequest) => {
    logRequest(req);

    try {
      const router = createRouter(routes);
      const res = await router(req);
      return req.respond(res);
    } catch (e) {
      return req.respond(mapToErrorResponse(e));
    }
  },
);

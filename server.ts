import {
  listenAndServe,
  ServerRequest
} from "https://deno.land/std/http/mod.ts";

import {
  createRouter,
  createRouteMap,
  forMethod,
  withJsonBody,
  jsonResponse,
  textResponse,
  ProcessedRequest,
  NotFoundError
} from "https://deno.land/x/reno/reno/mod.ts";

interface MessagePayload {
  message: string;
}

const BINDING = ":8000";

const decoder = new TextDecoder();
const messages: string[] = [];

async function addMessage({ body: { message } }: ProcessedRequest<MessagePayload>) {
  messages.push(message);
  return jsonResponse({ success: true }, 201);
}

function getMessages() {
  return jsonResponse(messages);
}

function methodNotAllowed({ method, url }: ServerRequest) {
  return textResponse(
    `${method} method not allowed for respurce ${url}`,
    405
  )
}

function notFound({ url }: ServerRequest) {
  return textResponse(`No resource found for ${url}`, {}, 404);
}

function internalServerError({ message }: Error) {
  return textResponse(message, {}, 500);
}

const routes = createRouteMap([
  [
    "/messages",
    forMethod([
      ["GET", getMessages],
      ["POST", withJsonBody<MessagePayload>(addMessage)]
    ])
  ]
]);

const router = createRouter(routes);

console.log(`Listening on ${BINDING}...`);

await listenAndServe(BINDING, async (req: any) => {
  try {
    req.respond(await router(req));
  } catch (e) {
    req.respond(
      e instanceof NotFoundError ? notFound(req) : internalServerError(e)
    );
  }
});
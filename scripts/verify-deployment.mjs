import { createRequire } from "node:module";

const frontendRequire = createRequire(new URL("../apps/frontend/package.json", import.meta.url));
const { io } = frontendRequire("socket.io-client");

const baseUrl = requiredEnvironmentValue("ORION_BASE_URL").replace(/\/+$/, "");
const publicOrigin = process.env.ORION_PUBLIC_ORIGIN?.trim() || new URL(baseUrl).origin;
const firstUser = {
  email: requiredEnvironmentValue("ORION_TEST_USER_ONE_EMAIL"),
  password: requiredEnvironmentValue("ORION_TEST_USER_ONE_PASSWORD"),
};
const secondUser = {
  email: requiredEnvironmentValue("ORION_TEST_USER_TWO_EMAIL"),
  password: requiredEnvironmentValue("ORION_TEST_USER_TWO_PASSWORD"),
};

function requiredEnvironmentValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function readResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body.message === "string" ? body.message : "request failed";
    throw new Error(`${response.status} ${message}`);
  }
  return body;
}

function responseCookies(response) {
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);

  return setCookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

async function login(user) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    body: JSON.stringify(user),
    headers: {
      "content-type": "application/json",
      origin: new URL(baseUrl).origin,
    },
    method: "POST",
  });
  await readResponse(response);
  const cookie = responseCookies(response);
  if (!cookie) throw new Error("Login did not return session cookies.");
  return cookie;
}

async function apiRequest(cookie, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      cookie,
      origin: new URL(baseUrl).origin,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });
  return { body: await readResponse(response), response };
}

function connectRealtime(ticket) {
  const socket = io(`${baseUrl}/chat`, {
    auth: { ticket },
    extraHeaders: { Origin: publicOrigin },
    reconnection: false,
    transports: ["websocket"],
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Realtime connection timed out."));
    }, 10_000);

    socket.once("connect", () => {
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function main() {
  const firstCookie = await login(firstUser);
  const secondCookie = await login(secondUser);
  console.log("deployment verification: both users authenticated");

  const usersResult = await apiRequest(
    firstCookie,
    `/api/chat/users?search=${encodeURIComponent(secondUser.email)}&limit=30`,
  );
  const targetUser = usersResult.body.users?.find((user) => user.email === secondUser.email);
  if (!targetUser) throw new Error("The second user was not returned by chat search.");

  const conversationResult = await apiRequest(firstCookie, "/api/chat/conversations/direct", {
    body: JSON.stringify({ userId: targetUser.id }),
    method: "POST",
  });
  const conversationId = conversationResult.body.conversation?.id;
  if (!conversationId) throw new Error("Direct conversation was not created.");
  console.log("deployment verification: direct conversation available");

  const ticketResult = await apiRequest(secondCookie, "/api/chat/realtime-ticket", {
    body: JSON.stringify({}),
    method: "POST",
  });
  const socket = await connectRealtime(ticketResult.body.ticket);

  try {
    const content = `deployment-check-${Date.now()}`;
    const receivedMessage = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Realtime message timed out.")), 10_000);
      socket.once("conversation.message", (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    const sendResult = await apiRequest(
      firstCookie,
      `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
      { body: JSON.stringify({ content }), method: "POST" },
    );
    const sentMessageId = sendResult.body.message?.id;
    const realtimePayload = await receivedMessage;

    if (
      realtimePayload.conversationId !== conversationId ||
      realtimePayload.message?.id !== sentMessageId ||
      realtimePayload.message?.content !== content
    ) {
      throw new Error("Realtime payload does not match the persisted message.");
    }

    const historyResult = await apiRequest(
      secondCookie,
      `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages?limit=50`,
    );
    if (!historyResult.body.messages?.some((message) => message.id === sentMessageId)) {
      throw new Error("The realtime message was not found in persisted history.");
    }

    const forbiddenResponse = await fetch(`${baseUrl}/api/chat/conversations/direct`, {
      body: JSON.stringify({ userId: targetUser.id }),
      headers: {
        "content-type": "application/json",
        cookie: firstCookie,
        origin: "https://invalid.example.com",
      },
      method: "POST",
    });
    if (forbiddenResponse.status !== 403) {
      throw new Error("Cross-origin mutation was not rejected.");
    }

    console.log("deployment verification: realtime, persistence, and same-origin protection passed");
  } finally {
    socket.disconnect();
  }
}

await main();

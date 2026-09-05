import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";

interface SavedLocation {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  altitude: number;
  updatedAt: string;
}

interface UserRecord {
  settings: Record<string, unknown>;
  locations: Map<string, SavedLocation>;
}

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
    bodyLimit: 32 * 1024,
    genReqId: () => crypto.randomUUID(),
  });
  const records = new Map<string, UserRecord>();
  let shuttingDown = false;

  app.addHook("onSend", async (_request, reply) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    reply.header(
      "permissions-policy",
      "camera=(), microphone=(), geolocation=()",
    );
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async (_request, reply) => {
    if (shuttingDown) return reply.code(503).send({ status: "shutting-down" });
    return { status: "ready" };
  });

  app.get("/v1/me", { preHandler: authenticate }, async (request) => {
    const userId = request.userId!;
    const record = getRecord(records, userId);
    return {
      userId,
      settings: record.settings,
      locations: [...record.locations.values()],
    };
  });

  app.put<{ Body: Record<string, unknown> }>(
    "/v1/settings",
    {
      preHandler: authenticate,
      schema: {
        body: { type: "object", maxProperties: 30, additionalProperties: true },
      },
    },
    async (request) => {
      const record = getRecord(records, request.userId!);
      record.settings = { ...record.settings, ...request.body };
      return { settings: record.settings };
    },
  );

  app.put<{
    Params: { id: string };
    Body: Omit<SavedLocation, "id" | "updatedAt">;
  }>(
    "/v1/locations/:id",
    {
      preHandler: authenticate,
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", minLength: 1, maxLength: 80 } },
        },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["name", "longitude", "latitude", "altitude"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 120 },
            longitude: { type: "number", minimum: -180, maximum: 180 },
            latitude: { type: "number", minimum: -90, maximum: 90 },
            altitude: { type: "number", minimum: -500, maximum: 1_000_000 },
          },
        },
      },
    },
    async (request) => {
      const record = getRecord(records, request.userId!);
      const location = {
        ...request.body,
        id: request.params.id,
        updatedAt: new Date().toISOString(),
      };
      record.locations.set(location.id, location);
      return location;
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/v1/locations/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const deleted = getRecord(records, request.userId!).locations.delete(
        request.params.id,
      );
      return deleted
        ? reply.code(204).send()
        : reply.code(404).send({ error: "not_found" });
    },
  );

  app.addHook("onClose", async () => {
    shuttingDown = true;
  });
  return app;
}

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ") || authorization.length < 8) {
    await reply.code(401).send({ error: "unauthorized" });
    return;
  }
  request.userId = authorization.slice(7);
}

function getRecord(
  records: Map<string, UserRecord>,
  userId: string,
): UserRecord {
  const existing = records.get(userId);
  if (existing) return existing;
  const created = { settings: {}, locations: new Map<string, SavedLocation>() };
  records.set(userId, created);
  return created;
}

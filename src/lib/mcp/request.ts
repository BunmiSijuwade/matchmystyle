// Per-request client IP for MCP tool handlers.
// The MCP toolkit doesn't pass HTTP headers to tools, so we wrap Deno.serve once (before the generated
// entry calls it) and keep the caller's IP in AsyncLocalStorage for the duration of the request.
// Import-safe: no env reads or I/O; outside Deno (manifest extraction) this is a no-op.
import { AsyncLocalStorage } from "node:async_hooks";
import { clientIp } from "../../../supabase/functions/_shared/rateLimit";

const store = new AsyncLocalStorage<string>();

type ServeHandler = (req: Request, info?: unknown) => Response | Promise<Response>;
type DenoServe = { serve?: (...args: unknown[]) => unknown; __mmsWrapped?: boolean };
const deno = (globalThis as { Deno?: DenoServe }).Deno;
if (deno?.serve && !deno.__mmsWrapped) {
  const original = deno.serve.bind(deno);
  deno.__mmsWrapped = true;
  deno.serve = (...args: unknown[]) => {
    const i = args.findIndex((a) => typeof a === "function");
    if (i >= 0) {
      const h = args[i] as ServeHandler;
      args[i] = (req: Request, info?: unknown) => {
        // AUTH: when this server stops being public, check an API key here, e.g.
        // if (req.headers.get("x-api-key") !== env("MCP_API_KEY")) return new Response("unauthorized", { status: 401 });
        return store.run(clientIp(req.headers), () => h(req, info));
      };
    }
    return original(...args);
  };
}

export const currentIp = () => store.getStore() ?? "unknown";

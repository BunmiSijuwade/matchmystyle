import { defineTool } from "@lovable.dev/mcp-js";
import { AESTHETICS } from "../../../../supabase/functions/_shared/aesthetics";

export default defineTool({
  name: "list_aesthetics",
  title: "List style aesthetics",
  description: "List the 12 MatchMyStyle New York style aesthetics with short definitions.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const aesthetics = AESTHETICS.map((a) => ({ name: a.name, definition: a.definition }));
    return {
      content: [{ type: "text", text: aesthetics.map((a) => `${a.name}: ${a.definition}`).join("\n") }],
      structuredContent: { aesthetics },
    };
  },
});

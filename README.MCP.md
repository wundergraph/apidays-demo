# Model Context Protocol (MCP) Integration

This project supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), allowing AI assistants (like Cursor, Roo, etc.) to discover and execute operations defined in your services.

## 1. Adding New Tools

Tools in MCP correspond to GraphQL operations defined in your `services` directory. To add a new tool:

1.  Create a new `.graphql` file in a service directory (e.g., `services/apidays.v2025/AgendaService/`).
2.  Define your GraphQL Query or Mutation.
3.  Add a documentation description above the operation. **This description is used as the tool description** for the AI model.

### Example: `QueryListSessions.graphql`

```graphql
"""
ListSessions retrieves the complete dataset of sessions from the database without filtering.
Returns basic metadata including ID, title, description, and timing information.
"""
query ListSessions($search: String) {
  sessions(search: $search) {
    id
    title
    description
    day
    dateStart
  }
}
```

## 2. Starting the Router

To start the router (which hosts the API and MCP server), run:

```bash
pnpm connect:router
```

The router configuration is defined in `connect.config.yaml`.

## 3. Using MCP Clients

Connect to your streamable http server on `http://localhost:5025/mcp` or via your MCP inspector:

```bash
pnpm mcp:inspector
```

You can also configure it via JSON (e.g., in `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "apidays": {
      "type": "streamable-http",
      "url": "http://localhost:5025/mcp",
      "note": "Find out all about the awesome sessions at APIDays Paris 2025",
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

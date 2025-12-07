# APIDays Demo

![APIDays Demo Hero Image](apidays-hero.png)

A demo project showcasing a federated GraphQL architecture for API Days Paris 2025.

## Subgraphs

*   **locations**: Manages venue and room information.
*   **speakers**: Manages speaker profiles.
*   **sessions**: Manages conference sessions and schedule.
*   **ratings**: Manages session ratings and aggregation.

## Getting Started

1.  Install dependencies:
    ```bash
    pnpm install
    ```

2.  Start the subgraphs:
    ```bash
    pnpm subgraph:start
    ```

    This will start the subgraphs on the following ports:
    *   Locations: http://localhost:5001
    *   Speakers: http://localhost:5002
    *   Sessions: http://localhost:5003
    *   Ratings: http://localhost:5004

3.  Create a Graph API Token and configure your environment:
    ```bash
    npx wgc router token create apidays -n default -g apidays
    ```
    
    Copy the token and add it to your `.env` file (see `.env.example`):
    ```env
    GRAPH_API_TOKEN=<your-token-here>
    ```

4.  Publish the subgraphs to Cosmo:
    ```bash
    pnpm subgraph:publish:all
    ```

## Running the Router

This demo supports multiple router modes. Please refer to the specific documentation for your use case:

- **Connect**: See [README.CONNECT.md](README.CONNECT.md) for running with Connect.
- **MCP**: See [README.MCP.md](README.MCP.md) for running with Model Context Protocol.

## Scripts

See `package.json` for a full list of available scripts.


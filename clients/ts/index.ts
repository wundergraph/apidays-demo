import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { AgendaService } from "../../gen/ts/services/apidays.v2025/AgendaService/service_connect.js";
import { ListSessionsRequest } from "../../gen/ts/services/apidays.v2025/AgendaService/service_pb.js";

const transport = createGrpcTransport({
  baseUrl: "http://localhost:5026",
  httpVersion: "2",
});

const client = createClient(AgendaService, transport);

async function main() {
  const req = new ListSessionsRequest();
  const res = await client.listSessions(req);

  for (const session of res.sessions) {
    console.log(`Session: ${session.title} (${session.id})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

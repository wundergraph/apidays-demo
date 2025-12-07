# ConnectRPC Demo

This project demonstrates how to use ConnectRPC with a router that supports multi-protocol communication (gRPC, gRPC-Web, Connect).

## Prerequisites

- Go (1.20+)
- Node.js (18+)
- `buf` CLI
- `pnpm`

## Code Generation

To regenerate the client code and OpenAPI specifications:

```bash
# Install Go plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
go install github.com/sudorandom/protoc-gen-connect-openapi@latest

# Install TypeScript plugins
pnpm add -D @bufbuild/protoc-gen-es @connectrpc/protoc-gen-connect-es

# Generate code
buf generate
```

## Running Clients

### Go Client

The Go client demonstrates consuming the API using the **gRPC protocol over HTTP/2**.

```bash
# Initialize module (first time only)
go mod tidy

# Run the client
pnpm connect:client-go
```

### TypeScript Client

The TypeScript client demonstrates consuming the API using the **gRPC protocol over HTTP/2**.

```bash
# Install dependencies (first time only)
pnpm add @connectrpc/connect @connectrpc/connect-node @bufbuild/protobuf

# Run the client
pnpm connect:client-ts
```

## Testing with CURL

You can also test the endpoints directly using `grpcurl` or `curl`.

```bash
# Test using gRPC
grpcurl \
    -plaintext \
    -proto services/apidays.v2025/AgendaService/service.proto \
    -d '{}' \
    localhost:5026 \
    apidays.v2025.AgendaService/ListSessions
```

```bash
# Test using Connect Protocol (HTTP/1.1 or HTTP/2)
curl -X POST http://localhost:5026/apidays.v2025.AgendaService/ListSessions \
    -H "Content-Type: application/json" \
    -H "Connect-Protocol-Version: 1" \
    -d '{}'
```

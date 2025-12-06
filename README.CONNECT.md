```bash
grpcurl \
    -plaintext \
    -proto services/apidays.v2025/AgendaService/service.proto \
    -d '{}' \
    localhost:5026 \
    apidays.v2025.AgendaService/ListSessions
```

```bash
curl -X POST http://localhost:5026/apidays.v2025.AgendaService/ListSessions \
    -H "Content-Type: application/json" \
    -H "Connect-Protocol-Version: 1" \
    -d '{}'
```



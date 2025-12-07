package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/http"

	"connectrpc.com/connect"
	pb "github.com/wundergraph/apidays-demo/gen/go/apidays/v2025"
	"github.com/wundergraph/apidays-demo/gen/go/apidays/v2025/apidaysv2025connect"
	"golang.org/x/net/http2"
)

func main() {
	client := apidaysv2025connect.NewAgendaServiceClient(
		&http.Client{
			Transport: &http2.Transport{
				AllowHTTP: true,
				DialTLS: func(network, addr string, cfg *tls.Config) (net.Conn, error) {
					return net.Dial(network, addr)
				},
			},
		},
		"http://localhost:5026",
		connect.WithGRPC(),
	)

	req := connect.NewRequest(&pb.ListSessionsRequest{})

	res, err := client.ListSessions(context.Background(), req)
	if err != nil {
		log.Fatalln(err)
	}

	for _, session := range res.Msg.Sessions {
		fmt.Printf("Session: %s (%s)\n", session.Title.Value, session.Id)
	}
}

package ws

import (
	"copuchat/internal/redis"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/dyatlov/go-opengraph/opengraph"
	redigo "github.com/gomodule/redigo/redis"
	"golang.org/x/net/websocket"
	"mvdan.cc/xurls/v2"
)

const cacheExpirationTime = 12 * time.Hour

type Event struct {
	Type string `json:"type"` // Messages | Message | Preview | Topic.
	Data any    `json:"data"`
}

var Hubs = map[string]*Hub{}

type Hub struct {
	RoomName string
	Conns    map[string]*websocket.Conn
	sync.RWMutex
}

func GetHub(roomName string) *Hub {
	if hub, ok := Hubs[roomName]; ok {
		return hub
	}

	return &Hub{RoomName: roomName, Conns: map[string]*websocket.Conn{}}
}

func (h *Hub) Broadcast(event Event, except []string) error {
	h.RLock()
	defer h.RUnlock()
	for userName, conn := range h.Conns {
		skip := false
		for _, exceptName := range except {
			if exceptName == userName {
				skip = true

				break
			}
		}
		if skip {
			continue
		}
		if err := websocket.JSON.Send(conn, event); err != nil {
			return err
		}
	}

	return nil
}

func Handler(roomName, userName string) websocket.Handler {
	return func(conn *websocket.Conn) {
		defer conn.Close()

		hub := GetHub(roomName)
		hub.Lock()
		hub.Conns[userName] = conn
		hub.Unlock()
		defer func() {
			hub.Lock()
			defer hub.Unlock()
			delete(hub.Conns, userName)
			if len(hub.Conns) == 0 {
				delete(Hubs, roomName)
			}
		}()
		if err := sendInitialData(conn, roomName); err != nil {
			log.Printf("%s\n", err)
		}

		for {
			var message *redis.Message
			if err := websocket.JSON.Receive(conn, &message); err != nil {
				if !errors.Is(err, io.EOF) {
					log.Printf("ws: error reading conn: %s\n", err)
				}

				break
			}
			if message == nil || message.Text == "" {
				continue
			}
			message.UserName = userName
			if err := handleMessage(hub, message, roomName); err != nil {
				log.Printf("ws: error handling message: %s\n", err)
				// TODO: Send error message somehow
			}
		}
	}
}

func sendInitialData(conn *websocket.Conn, roomName string) error {
	messages, err := redis.GetLastMessages(roomName)
	if err != nil && !errors.Is(err, redigo.ErrNil) {
		return fmt.Errorf("ws: error getting room messages: %w", err)
	}
	topic, err := redis.GetTopic(roomName)
	if err != nil && !errors.Is(err, redigo.ErrNil) {
		return fmt.Errorf("ws: error getting room topic: %w", err)
	}

	if err := websocket.JSON.Send(conn, Event{Type: "Messages", Data: messages}); err != nil {
		return fmt.Errorf("ws: error sending room messages: %w", err)
	}
	if err := websocket.JSON.Send(conn, Event{Type: "Topic", Data: topic}); err != nil {
		return fmt.Errorf("ws: error sending room topic: %w", err)
	}

	return nil
}

func handleMessage(hub *Hub, message *redis.Message, roomName string) error {
	newRoom, err := redis.AddMessage(message, roomName)
	if err != nil {
		return fmt.Errorf("ws: error adding message: to redis %w", err)
	}
	if err := hub.Broadcast(Event{Type: "Message", Data: message}, nil); err != nil {
		return fmt.Errorf("ws: error broadcasting: %w", err)
	}
	if newRoom {
		path := strings.Split(roomName, "/")
		parentRoom := strings.Join(path[:len(path)-1], "/")
		if err := GetHub(parentRoom).Broadcast(Event{Type: "Message", Data: message}, nil); err != nil {
			return fmt.Errorf("ws: error broadcasting to parent room: %w", err)
		}
	}

	go func() {
		if err := broadcastPreview(hub, message); err != nil {
			log.Printf("ws: error broadcasting open graph: %s\n", err)
		}
	}()

	return nil
}

func broadcastPreview(hub *Hub, message *redis.Message) error {
	url := xurls.Relaxed().FindString(message.Text)
	if url == "" {
		return nil
	}
	var graph *opengraph.OpenGraph
	cacheKey := "cache:" + url

	data, err := redis.Get(cacheKey)
	if err != nil && !errors.Is(err, redis.ErrNil) {
		return err
	}
	if err == nil {
		if err := json.Unmarshal(data, &graph); err != nil {
			return err
		}
	}
	if errors.Is(err, redis.ErrNil) {
		hub.Lock()
		remoteAddr := hub.Conns[message.UserName].Request().RemoteAddr
		hub.Unlock()
		if graph, err = fetchOpenGraph(url, remoteAddr); err != nil {
			return err
		}
		data, err := graph.ToJSON()
		if err != nil {
			return err
		}
		if err := redis.SetPX(cacheKey, data, cacheExpirationTime); err != nil {
			return err
		}
	}

	return hub.Broadcast(Event{Type: "Preview", Data: graph}, nil)
}

func fetchOpenGraph(url string, remoteAddr string) (*opengraph.OpenGraph, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	if clientIP, _, err := net.SplitHostPort(remoteAddr); err == nil {
		req.Header.Set("X-Forwarded-For", clientIP)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	graph := opengraph.NewOpenGraph()
	if err := graph.ProcessHTML(resp.Body); err != nil {
		return nil, err
	}

	return graph, nil
}

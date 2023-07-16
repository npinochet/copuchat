package ws

import (
	"copuchat/internal/redis"
	"errors"
	"fmt"
	"log"
	"sync"

	redigo "github.com/gomodule/redigo/redis"
	"golang.org/x/net/websocket"
)

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

func (h *Hub) Broadcast(message *redis.Message, except []string) error {
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
		if err := websocket.JSON.Send(conn, message); err != nil {
			return err
		}
	}

	return nil
}

func Handler(roomName, userName string) (websocket.Handler, error) {
	room, err := redis.GetRoom(roomName)
	if err != nil && !errors.Is(err, redigo.ErrNil) {
		return nil, fmt.Errorf("ws: error getting room: %w", err)
	}

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
		if err := websocket.JSON.Send(conn, room); err != nil {
			log.Printf("ws: error sending room: %s\n", err)
		}

		for {
			var data *redis.Message
			if err := websocket.JSON.Receive(conn, &data); err != nil {
				log.Printf("ws: error reading conn: %s\n", err)

				break
			}
			if data == nil || data.Text == "" {
				continue
			}
			data.UserName = userName
			if err := handleMessage(hub, data, roomName, userName); err != nil {
				log.Printf("ws: error handling message: %s\n", err)
			}
		}
	}, nil
}

func handleMessage(hub *Hub, message *redis.Message, roomName, userName string) error {
	if err := redis.AddMessage(message, roomName); err != nil {
		return fmt.Errorf("ws: error adding message: to redis %w", err)
	}

	if err := hub.Broadcast(message, []string{userName}); err != nil {
		return fmt.Errorf("ws: error broadcasting: %w", err)
	}

	return nil
}

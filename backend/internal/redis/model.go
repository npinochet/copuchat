package redis

type Message struct {
	UserName  string `json:"userName"`
	Text      string `json:"text"`
	Timestamp int64  `json:"timestamp"`
}

type ActiveUsersLen struct {
	RoomName       string `json:"roomName"`
	ActiveUsersLen int    `json:"activeUsersLength"`
}

package redis

type Message struct {
	UserName  string `json:"userName"`
	Text      string `json:"text"`
	Timestamp int64  `json:"timestamp"`
}

type Room struct {
	Name     string    `json:"name"`
	Title    string    `json:"title"`
	Messages []Message `json:"messages"`
}

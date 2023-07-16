package redis

type Message struct {
	UserName string `json:"userName"`
	Text     string `json:"text"`
}

type Room struct {
	Name     string    `json:"name"`
	Title    string    `json:"title"`
	Messages []Message `json:"messages"`
}

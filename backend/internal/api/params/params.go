package params

type Message struct {
	SubRoom  string `query:"sub_room"`
	UserName string `query:"user_name"`
	Message  string `query:"message"`
}

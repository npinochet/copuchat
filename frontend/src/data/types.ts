type WebSocketEvent = {
  Event: "Room" | "Message";
  Data: Room | Message;
}

type Room = {
  name: string;
  topic: string;
  messages: Message[];
};

type Message = {
  userName: string;
  text: string;
  timestamp: number;
};

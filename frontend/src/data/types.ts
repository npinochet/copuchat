type WebSocketEvent = {
  Event: "Room" | "Message";
  Data: Room | Message;
} | null;

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

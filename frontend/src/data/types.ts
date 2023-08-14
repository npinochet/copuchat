type WebSocketEvent = {
  type: "Room" | "Message";
  data: Room | Message;
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

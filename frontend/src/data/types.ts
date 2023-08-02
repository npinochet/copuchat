type WebSocketJson = Room | Message | null;

type Room = {
  name: string;
  title: string;
  messages: Message[];
};

type Message = {
  userName: string;
  text: string;
  timestamp: number;
};

export type WebSocketEvent = {
  type: "Room" | "Message";
  data: Room | Message;
} | null;

export type Room = {
  name: string;
  topic: string;
  messages: Message[];
};

export type Message = {
  userName: string;
  text: string;
  timestamp: number;
};

export type RoomPreview = {
  name: string;
  room: string;
  activeUsersLength: number;
};

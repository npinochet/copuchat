export type WebSocketEvent = {
  type: "Message" | "Messages" | "Topic";
  data: Message | Message[] | string;
} | null;

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

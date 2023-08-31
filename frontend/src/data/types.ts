type WebSocketEvent<Type, Data> = {
  type: Type;
  data: Data;
};

export type WebSocketResponse =
  | WebSocketEvent<"Message", Message>
  | WebSocketEvent<"Messages", Message[]>
  | WebSocketEvent<"Topic", string>
  | null;

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

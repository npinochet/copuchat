import ChatBox from "./chatbox";
import SubRooms from "./subrooms";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "react-use-websocket";

const Content = () => {
  const { "*": room } = useParams();
  const chatID = useMemo(() => room?.split("/")?.pop() || "", [room]);
  const [title, setTitle] = useState("");
  const { lastJsonMessage } = useWebSocket<WebSocketJson>(
    `ws://127.0.0.1:8090/${room}`,
    {
      share: true,
      retryOnError: true,
      shouldReconnect: () => true,
      queryParams: { userName: "MasterBoth" },
    }
  );

  useEffect(() => {
    const roomTitle = (lastJsonMessage as Room)?.title;
    if (title !== undefined && title !== null) setTitle(roomTitle as string);
  }, [lastJsonMessage, setTitle, room]);

  return (
    <div className="bg-background flex justify-center flex-1">
      <div className="container pb-10 px-4 flex flex-col">
        <p className="text-lg my-3">
          <b>{chatID}: </b>
          {title}
        </p>
        <div className="flex h-full">
          <ChatBox />
          <div className="mx-8"></div>
          <SubRooms />
        </div>
      </div>
    </div>
  );
};

export default Content;

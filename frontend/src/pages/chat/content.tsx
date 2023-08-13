import ChatBox from "./chatbox";
import SubRooms from "./subrooms";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "react-use-websocket";

const Content = () => {
  const { "*": room } = useParams();
  const chatID = useMemo(() => room?.split("/")?.pop() || "", [room]);
  const [topic, setTopic] = useState("");
  const { lastJsonMessage } = useWebSocket<WebSocketEvent>(
    `ws://127.0.0.1:8090/ws/${room}?userName=MasterBoth`,
    {
      share: true,
      retryOnError: true,
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    if (lastJsonMessage == null) return;
    if (lastJsonMessage.Event === "Message") return;
    const roomTopic = (lastJsonMessage.Data as Room)?.topic;
    if (topic !== undefined && topic !== null) setTopic(roomTopic as string);
  }, [lastJsonMessage, setTopic, room]);

  return (
    <div className="bg-background flex justify-center flex-1">
      <div className="container pb-10 px-4 flex flex-col">
        <p className="text-lg my-3">
          <b>{chatID}: </b>
          {topic}
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

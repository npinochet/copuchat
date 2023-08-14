import ChatBox from "./chatbox";
import SubRooms from "./subrooms";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useWebSocket from "react-use-websocket";

type linkRef = { text: string; href: string };

function parseNavParams(): linkRef[] {
  const { "*": room } = useParams();
  let navigation = [{ text: "home", href: "/chat" }];
  const rooms = room?.split("/");
  if (rooms === undefined || rooms[0] === "") {
    return navigation;
  }
  return navigation.concat(
    rooms.map((v, i) => ({
      text: v,
      href: `/chat/${rooms.slice(0, i + 1).join("/")}`,
    }))
  );
}

const NavBarLink = ({ link }: { link: linkRef }) => (
  <Link
    to={link.href}
    className="block md:inline-block py-4 md:py-0 text-center text-primary hover:underline font-semibold"
  >
    {link.text}
  </Link>
);

const Content = () => {
  const navigation = parseNavParams();
  const { "*": room } = useParams();
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
    if (lastJsonMessage.type === "Message") return;
    const roomTopic = (lastJsonMessage.data as Room)?.topic;
    if (topic !== undefined && topic !== null) setTopic(roomTopic as string);
  }, [lastJsonMessage, setTopic, room]);

  return (
    <div className="flex flex-col bg-complement w-full">
      <div
        className="flex relative px-4 py-2 items-center shadow-drop"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 200%, 0 200%)" }}
      >
        <div>
          <div>
            {navigation.map((v, i) => (
              <Fragment key={i}>
                <NavBarLink link={v} />
                {navigation.length === i + 1 ? " " : " / "}
              </Fragment>
            ))}
          </div>
          <b>{topic}Cristiano Ronaldo Fan Club Lovers</b>
        </div>
        <div className="flex-1" />
        <div className="font-medium no-underline">
          <a>User Name</a>
        </div>
      </div>
      <div className="flex h-full">
        <ChatBox />
        <SubRooms />
      </div>
    </div>
  );
};

export default Content;

import { CheckIcon, DrawerIcon, EditIcon, XIcon } from "../../assets/icons";
import { drawerAtom, userNameAtom } from "../../data/atoms";
import ChatBox from "./chatbox";
import SubRooms from "./subrooms";
import { useAtom, useAtomValue } from "jotai";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useWebSocket from "react-use-websocket";

type navLink = { text: string; href: string };

function parseNavParams(): navLink[] {
  const { "*": room } = useParams();
  let navigation = [{ text: "home", href: "/chat" }];
  const rooms = room?.split("/");
  if (rooms === undefined || rooms[0] === "") return navigation;
  return navigation.concat(
    rooms.map((v, i) => ({
      text: v,
      href: `/chat/${rooms.slice(0, i + 1).join("/")}`,
    }))
  );
}

const NavBarLink = ({ link }: { link: navLink }) => (
  <Link
    to={link.href}
    className="block md:inline-block text-center text-primary hover:underline hover:text-accent font-semibold"
  >
    {link.text}
  </Link>
);

const HeaderButton = ({
  icon,
  onClick,
  className,
}: {
  icon: JSX.Element;
  onClick: () => void;
  className?: string;
}) => (
  <>
    <button className="pl-2" onClick={onClick}>
      <div className={`w-5 h-5 ${className}`}>{icon}</div>
    </button>
  </>
);

const TopicHeader = () => {
  const userName = useAtomValue(userNameAtom);
  const { "*": room } = useParams();
  /* TODO: think of a better default topic*/
  const [topic, setTopic] = useState("Cristiano Ronaldo Fan Club Lovers");
  const [editingTopic, setEditingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const topicRef = useRef<HTMLParagraphElement>(null);
  const { lastJsonMessage } = useWebSocket<WebSocketEvent>(
    `ws://127.0.0.1:8090/ws/${room}?userName=${userName}`,
    {
      share: true,
      retryOnError: true,
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    if (lastJsonMessage == null) return;
    if (lastJsonMessage.type !== "Room") return;
    const roomTopic = (lastJsonMessage.data as Room)?.topic;
    if (roomTopic) setTopic(roomTopic);
  }, [lastJsonMessage, setTopic, room]);

  return (
    <div className="flex items-center">
      <p
        ref={topicRef}
        className={`mr-1 outline-1 font-bold ${
          editingTopic && "outline font-normal px-1"
        }`}
        contentEditable={editingTopic}
        suppressContentEditableWarning={true}
        onInput={(evt) => setNewTopic(evt.currentTarget.textContent || "")}
      >
        {topic}
      </p>
      {editingTopic ? (
        <>
          <HeaderButton
            className="text-accent mr-1"
            icon={<CheckIcon />}
            onClick={async () => {
              setEditingTopic(false);
              if (newTopic === "") return;
              // TODO: Send request to change topic
              await fetch(`https://127.0.0.1:8090/${room}/topic`, {
                method: "POST",
                body: newTopic,
              });
              setTopic(newTopic);
            }}
          />
          <HeaderButton
            icon={<XIcon />}
            onClick={() => {
              setEditingTopic(false);
              setNewTopic("");
              if (topicRef.current) topicRef.current.innerHTML = topic;
            }}
          />
        </>
      ) : (
        <HeaderButton
          icon={<EditIcon />}
          onClick={() => {
            topicRef.current?.focus();
            setEditingTopic(true);
          }}
        />
      )}
    </div>
  );
};

const Content = () => {
  const navigation = parseNavParams();
  const [drawerOpen, setDrawer] = useAtom(drawerAtom);

  return (
    <div className="flex flex-col bg-complement w-full">
      <div
        className="flex relative px-4 py-2 items-center shadow-drop"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 200%, 0 200%)" }}
      >
        <button
          id="menuBtn"
          className="pr-4 block md:hidden"
          onClick={() => setDrawer(!drawerOpen)}
        >
          <DrawerIcon />
        </button>
        <div>
          <div className="flex whitespace-pre">
            {navigation.map((v, i) => (
              <Fragment key={i}>
                <NavBarLink link={v} />
                {navigation.length === i + 1 ? " " : " / "}
              </Fragment>
            ))}
          </div>
          <TopicHeader />
        </div>
        <div className="flex-1" />
        <div className="font-medium no-underline text-right ml-4">
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

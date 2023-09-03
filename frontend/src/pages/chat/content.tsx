import {
  CheckIcon,
  DotsIcon,
  DrawerIcon,
  EditIcon,
  XIcon,
} from "../../assets/icons";
import { drawerAtom, userNameAtom } from "../../data/atoms";
import { WebSocketResponse } from "../../data/types";
import Auth from "./auth";
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
  const { lastJsonMessage } = useWebSocket<WebSocketResponse>(
    `ws://localhost:8090/ws/${room}?userName=${encodeURIComponent(userName)}`,
    {
      share: true,
      retryOnError: true,
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    if (lastJsonMessage == null || lastJsonMessage.type !== "Topic") return;
    const { data } = lastJsonMessage;
    if (data) setTopic(data);
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
              await fetch(`http://localhost:8090/topic/${room}`, {
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
  const [userName, setUserName] = useAtom(userNameAtom);
  const [showUserOptions, setShowUserOptions] = useState(false);

  return (
    <main className="flex flex-col bg-complement w-full">
      <header
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
          <nav className="flex whitespace-pre">
            {navigation.map((v, i) => (
              <Fragment key={i}>
                <NavBarLink link={v} />
                {navigation.length === i + 1 ? " " : " / "}
              </Fragment>
            ))}
          </nav>
          <TopicHeader />
        </div>
        <div className="flex-1" />
        <div className="flex items-center font-medium no-underline text-right">
          <h5 className="mx-2">{userName}</h5>
          <button onClick={() => setShowUserOptions(!showUserOptions)}>
            <div className="w-6 h-6">
              <DotsIcon />
            </div>
          </button>
          <div
            // TODO: Make transitions work
            className={`transition-all ease-out duration-100 text-left ${
              showUserOptions ? "" : "hidden"
            }`}
          >
            <div className="absolute right-2 top-[90%] z-1 p-2 outline outline-1 outline-text drop-shadow-2xl origin-top-right bg-complement">
              <button
                onClick={() => {
                  setShowUserOptions(false);
                  setUserName("");
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-col md:flex-row h-full">
        {userName ? (
          <>
            <ChatBox />
            <SubRooms />
          </>
        ) : (
          <Auth />
        )}
      </div>
    </main>
  );
};

export default Content;

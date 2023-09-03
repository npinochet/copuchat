import { userNameAtom } from "../../data/atoms";
import {
  ChatEvent,
  LinkPreview,
  Message,
  WebSocketResponse,
} from "../../data/types";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import Linkify from "react-linkify";
import { useParams } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";

const InputBar = ({
  submit,
  setInput,
  inputRef,
  disabled,
}: {
  submit: () => void;
  setInput: (content: string) => void;
  inputRef: React.RefObject<HTMLDivElement>;
  disabled: boolean;
}) => (
  <>
    <div
      ref={inputRef}
      className="w-full mr-3 p-1 resize-none outline outline-0 outline-primary focus:outline-1 cursor-text"
      contentEditable="true"
      placeholder="Send a message..."
      onInput={(evt) => {
        const content = evt.currentTarget.textContent || "";
        if (content === "") {
          evt.currentTarget.innerHTML = "";
        }
        setInput(content);
      }}
      onKeyDown={(evt) => evt.key === "Enter" && !evt.shiftKey && submit()}
    />
    <div className="flex flex-col">
      <button
        disabled={disabled}
        className="bg-primary text-secondary font-semibold px-5 h-[32px] text-lg hover:bg-accent cursor-pointer"
        onClick={submit}
      >
        Send
      </button>
    </div>
  </>
);

const TextEntry = ({
  message,
  showName,
}: {
  message: Message;
  showName: boolean;
}) => {
  const { text, userName, timestamp } = message;
  return (
    <div className="flex items-center">
      <div className="flex flex-1">
        <div className="md:min-w-[120px] text-right">
          <b className={`block opacity-50 ${!showName && "md:hidden"}`}>
            {userName}
          </b>
        </div>
        <div className="mr-1 md:mx-2">
          <p className="block md:hidden"> : </p>
        </div>
        <Linkify
          componentDecorator={(href, text, key) => (
            //https://play.tailwindcss.com/36Sefv582C
            <a
              href={href}
              key={key}
              target="_blank"
              className="font-bold text-primary hover:text-accent hover:underline"
            >
              {text}
            </a>
          )}
        >
          <p>{text}</p>
        </Linkify>
      </div>
      <p className="opacity-50 text-sm">
        {new Date(timestamp).toLocaleString(navigator.language, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </p>
    </div>
  );
};

const LinkPreviewMessage = ({
  url,
  title,
  description,
  site_name,
  images,
}: LinkPreview) => {
  return (
    <div className="mx-auto max-w-2lg bg-gray-200 ring-1">
      <a href={url} className="flex">
        {images?.at(0) && (
          <div
            className="object-contain flex-1 max-w-[10rem] min-w-[8rem]"
            style={{
              background: `url(${images[0]}) no-repeat center center / contain`,
            }}
          ></div>
        )}
        <div className="flex flex-col p-3 overflow-hidden">
          <div className="text-md truncate leading-tight text-gray-900">
            {title}
          </div>
          <p className="text-gray-500 truncate">
            {site_name && `${site_name} - `}
            {new URL(url).host}
          </p>
          {description && (
            <p className="text-sm text-black truncate">{description}</p>
          )}
        </div>
      </a>
    </div>
  );
};

const ChatBox = () => {
  const { "*": room } = useParams();
  const userName = useAtomValue(userNameAtom);
  const [chat, setChat] = useState<ChatEvent[]>([]);
  const [message, setMessage] = useState<string>("");
  const inputRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const { sendJsonMessage, lastJsonMessage, readyState } =
    useWebSocket<WebSocketResponse>(
      `ws://localhost:8090/ws/${room}?userName=${encodeURIComponent(userName)}`,
      {
        share: true,
        retryOnError: true,
        shouldReconnect: () => true,
      }
    );

  useEffect(() => {
    if (lastJsonMessage == null) return;
    console.log(lastJsonMessage.data);
    if (lastJsonMessage.type === "Message") {
      const message = lastJsonMessage.data;
      if (message?.text) setChat((chat) => [...chat, lastJsonMessage]);
    }
    if (lastJsonMessage.type === "Messages") {
      const messages = lastJsonMessage.data;
      if (messages)
        messages.forEach((m) =>
          setChat((chat) => [...chat, { type: "Message", data: m }])
        );
    }
    if (lastJsonMessage.type === "Preview") {
      const preview = lastJsonMessage.data;
      if (preview?.description) setChat((chat) => [...chat, lastJsonMessage]);
    }
  }, [lastJsonMessage, setChat]);

  useEffect(() => {
    if (boxRef.current === null) return;
    const diff =
      boxRef.current.scrollHeight -
      boxRef.current.clientHeight -
      boxRef.current.scrollTop;
    if (diff === 24) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [chat]);

  const onSubmit = () => {
    if (message === "") return;
    sendJsonMessage({ text: message });
    setMessage("");
    if (inputRef.current) inputRef.current.innerHTML = "";
  };

  return (
    <section className="bg-complement flex flex-col p-4 flex-1 min-h-full">
      <div className="overflow-y-scroll flex-1 basis-0" ref={boxRef}>
        <div className="flex flex-col justify-end flex-1">
          {chat.map((m, i) =>
            m.type === "Message" ? (
              <TextEntry
                key={i}
                message={m.data}
                showName={
                  m.data.userName != (chat[i - 1]?.data as Message)?.userName
                }
              />
            ) : (
              <LinkPreviewMessage key={i} {...m.data} />
            )
          )}
        </div>
      </div>
      <div className="flex items-center pt-3">
        <div className="md:min-w-[128px] px-2 text-right text-md">
          {userName}
        </div>
        <div className="mx-1" />
        <InputBar
          submit={onSubmit}
          setInput={setMessage}
          inputRef={inputRef}
          disabled={readyState !== ReadyState.OPEN}
        />
      </div>
    </section>
  );
};

export default ChatBox;

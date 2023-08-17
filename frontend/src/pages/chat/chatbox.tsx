import { userNameAtom } from "../../data/atoms";
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
        <div className="md:min-w-[100px] text-right">
          <b className={`block ${!showName && "md:hidden"}`}>{userName}</b>
        </div>
        <div className="mr-1 md:mx-2">
          <p className="block md:hidden"> : </p>
        </div>
        <Linkify
          componentDecorator={(href, text, key) => (
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

const ChatBox = () => {
  const { "*": room } = useParams();
  const userName = useAtomValue(userNameAtom);
  const [chat, setChat] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const inputRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const { sendJsonMessage, lastJsonMessage, readyState } =
    useWebSocket<WebSocketEvent>(
      `ws://127.0.0.1:8090/ws/${room}?userName=${userName}`,
      {
        share: true,
        retryOnError: true,
        shouldReconnect: () => true,
      }
    );

  useEffect(() => {
    if (lastJsonMessage == null) return;
    if (lastJsonMessage.type === "Message") {
      const message = lastJsonMessage.data as Message;
      if (message?.text !== undefined) setChat((chat) => [...chat, message]);
    }
    if (lastJsonMessage.type === "Room") {
      const messages = (lastJsonMessage.data as Room)?.messages;
      if (messages !== undefined) setChat((chat) => [...chat, ...messages]);
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
    <div className="bg-complement flex flex-col p-4 flex-1">
      <div className="overflow-y-scroll flex-1 basis-0" ref={boxRef}>
        <div className="flex flex-col justify-end flex-1">
          {chat.map((v, i) => (
            <TextEntry
              key={i}
              message={v}
              showName={v.userName != chat[i - 1]?.userName}
            />
          ))}
        </div>
      </div>
      <div className="flex pt-3">
        <div className="md:min-w-[108px] px-2 text-right text-xl">
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
    </div>
  );
};

export default ChatBox;

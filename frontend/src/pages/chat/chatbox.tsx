import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";

const ChatBox = () => {
  const { "*": room } = useParams();
  const [chat, setChat] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLDivElement>(null);
  const { sendJsonMessage, lastJsonMessage, readyState } =
    useWebSocket<WebSocketEvent>(
      `ws://127.0.0.1:8090/ws/${room}?userName=MasterBoth`,
      {
        share: true,
        retryOnError: true,
        shouldReconnect: () => true,
      }
    );

  useEffect(() => {
    if (lastJsonMessage == null) return;
    if (lastJsonMessage.Event === "Message") {
      const message = lastJsonMessage.Data as Message;
      if (message?.text !== undefined) setChat((chat) => [...chat, message]);
    }
    if (lastJsonMessage.Event === "Room") {
      const messages = (lastJsonMessage.Data as Room)?.messages;
      if (messages !== undefined) setChat(messages);
    }
  }, [lastJsonMessage, setChat]);

  const onSubmit = () => {
    if (message === "") return;
    sendJsonMessage({ text: message });
    setMessage("");
    if (inputRef && inputRef.current) inputRef.current.innerHTML = "";
  };

  return (
    <div className="bg-complement flex flex-col p-3 flex-1 shadow-dup">
      <div className="bg-secondary h-full p-2 basis-0 grow overflow-auto min-h-[100px]">
        {chat.map((v, i) => (
          <div key={i} className="flex items-center">
            <p>
              <b>{v.userName}: </b>
              {v.text}
            </p>
            <div className="flex-1" />
            <p className="opacity-50 text-sm">{v.timestamp}</p>
          </div>
        ))}
      </div>
      <div className="flex pt-3">
        <div
          ref={inputRef}
          className="w-full bg-secondary mr-3 p-1 resize-none outline outline-0 outline-primary focus:outline-1"
          contentEditable="true"
          placeholder="Send a message..."
          onInput={(evt) => {
            const content = evt.currentTarget.textContent || "";
            if (content === "") {
              evt.currentTarget.innerHTML = "";
            }
            setMessage(content);
          }}
          onKeyDown={(evt) => evt.key === "Enter" && onSubmit()}
        />
        <div className="flex flex-col">
          <button
            disabled={readyState !== ReadyState.OPEN}
            className="bg-primary text-secondary font-semibold px-5 h-[32px] text-lg hover:bg-accent"
            onClick={onSubmit}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;

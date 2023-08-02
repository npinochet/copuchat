import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";

const ChatBox = () => {
  const { "*": room } = useParams();
  const [chat, setChat] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const { sendJsonMessage, lastJsonMessage, readyState } =
    useWebSocket<WebSocketJson>(`ws://127.0.0.1:8090/${room}`, {
      share: true,
      retryOnError: true,
      shouldReconnect: () => true,
      queryParams: { userName: "MasterBoth" },
    });

  useEffect(() => {
    const message = lastJsonMessage as Message;
    if (message?.text !== undefined && message?.text === null) {
      setChat((chat) => [...chat, message]);
    }
  }, [lastJsonMessage, setChat]);

  return (
    <div className="bg-complement flex flex-col p-3 flex-1 shadow-dup">
      <div className="bg-secondary h-full p-2 basis-0 grow overflow-auto min-h-[100px]">
        {chat.map((v, i) => (
          <div key={i} className="flex">
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
        />
        <div className="flex flex-col">
          <button
            disabled={readyState !== ReadyState.OPEN}
            className="bg-primary text-secondary font-semibold px-5 h-[32px] text-lg hover:bg-accent"
            onClick={() => sendJsonMessage({ text: message })}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;

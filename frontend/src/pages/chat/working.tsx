import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const Room = () => {
  const [chat, setChat] = useState<any[]>([]); // TODO: change to string[]
  const [message, setMessage] = useState<string>("");
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    "ws://127.0.0.1:8090/ws/lol?userName=masterboth"
  );
  useEffect(() => {
    console.log(lastMessage);
    if (lastMessage !== null && lastMessage.data !== "null") {
      setChat((prev) => prev.concat(lastMessage.data));
    }
    console.log(chat);
  }, [lastMessage, setChat]);

  return (
    <>
      {chat.map((m, i) => (
        <div key={i}>{m}</div>
      ))}
      <div className="m-2">
        <input
          className="outline"
          type="input"
          disabled={readyState !== ReadyState.OPEN}
          value={message}
          onChange={(evt) => setMessage(evt.target.value)}
        ></input>
        <button
          className=" bg-blue-700 p-2 m-2"
          onClick={() => sendMessage(JSON.stringify({ text: message }))}
        >
          Send Message
        </button>
      </div>
    </>
  );
};

export default Room;

import ChatBox from "./chatbox";
import SubRooms from "./subrooms";

const Content = () => {
  const title = "ronaldo: dsfsd";

  return (
    <div className="bg-background flex justify-center flex-1">
      <div className="container pb-10 px-4 flex flex-col">
        <p className="text-lg my-3">{title}</p>
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

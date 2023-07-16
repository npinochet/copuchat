import ChatBox from "./chatbox";
import SubRooms from "./subrooms";

const Title = ({ text }: { text: string }) => (
  <p className="text-lg mb-5">{text}</p>
);

const Content = () => {
  const title = "dsfsd";

  return (
    <div className="bg-background flex justify-center flex-1">
      <div className="container p-5 flex flex-col">
        <Title text={title} />
        <div className="flex h-full max-h-[600px]">
          <ChatBox />
          <div className="mx-3"></div>
          <SubRooms />
        </div>
      </div>
    </div>
  );
};

export default Content;

import Content from "./content";
import SideBar from "./sidebar";

const Chat = () => {
  return (
    <div className="flex h-full">
      <SideBar />
      <Content />
    </div>
  );
};

export default Chat;

const ChatBox = () => {
  return (
    <div className="bg-complement flex flex-col p-3 flex-1 shadow-dup">
      <div className="bg-secondary h-full p-2 basis-0 grow overflow-auto min-h-[100px]">
        <div>
          <p>Nico: Hola</p>
        </div>
        <div>
          <p>Nico: Hola</p>
        </div>
        <div>
          <p>Nico: Hola</p>
        </div>
      </div>
      <div className="flex pt-3">
        <div
          className="w-full bg-secondary mr-3 p-1 resize-none outline outline-0 outline-primary focus:outline-1"
          contentEditable="true"
        />
        <div className="flex flex-col">
          <button
            className="bg-primary text-secondary font-semibold px-5 h-[32px] text-lg hover:bg-accent"
            placeholder="Send a message"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;

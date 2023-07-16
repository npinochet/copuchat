const ChatBox = () => {
  return (
    <div className="bg-complement flex flex-col p-3 flex-1">
      <div className="bg-secondary h-full p-2">
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
      <div className="flex flex-col pt-5">
        <textarea className="w-full bg-secondary mb-3 min-h-[30px]"></textarea>
        <div className="flex flex-row-reverse">
          <button className="bg-primary text-secondary font-semibold px-5 text-lg">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;

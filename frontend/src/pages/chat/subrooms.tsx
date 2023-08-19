const SubRooms = () => {
  const rooms = [
    { name: "ronaldo", room: "/futbol/real_madrid/ronaldo", activeMembers: 20 },
    { name: "wena", room: "/country/chile/wena", activeMembers: 2 },
  ];

  return (
    <div className="bg-background flex flex-col flex-[0.3] p-3">
      <h1>Sub Rooms</h1>
      {rooms.map((v, i) => (
        <a
          key={i}
          className="bg-background my-1 p-1 hover:bg-secondary hover:cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="">{v.name}</p>
              <p className="text-xs text-slate-300">{v.room}</p>
            </div>
            <p className="flex items-center text-center">
              <span className="text-green-700 text-sm mr-1">●</span>
              {v.activeMembers}
            </p>
          </div>
        </a>
      ))}
      <div className="flex-1"></div>
      <h1 className="text-sm text-right">© Copuchat 2023</h1>
    </div>
  );
};

export default SubRooms;

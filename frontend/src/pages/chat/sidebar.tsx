import logo from "../../assets/logo.svg";

const SideBar = () => {
  const rooms = [
    { name: "ronaldo", room: "/futbol/real_madrid/ronaldo", activeMembers: 20 },
    { name: "wena", room: "/country/chile/wena", activeMembers: 2 },
  ];

  return (
    <div className="bg-background flex flex-col">
      <div className="mx-auto my-2">
        <a href="">
          <img src={logo} alt="Copuchat logo" width={120} />
        </a>
      </div>
      <h1 className="px-4 pb-2 text-lg">Rooms</h1>
      <div className="overflow flex flex-col flex-1">
        {rooms.map((v, i) => (
          <a
            key={i}
            className="bg-background px-4 py-1 hover:bg-secondary hover:cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div className="w-full overflow-hidden">
                <p
                  className="text-xs text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis text-left"
                  style={{ direction: "rtl" }}
                >
                  <bdi>{v.room}</bdi>
                </p>
                <p className="">{v.name}</p>
              </div>
              <div className="mx-3" />
              <p className="flex items-center text-center">
                <span className="text-green-700 text-sm mr-1">●</span>
                {v.activeMembers}
              </p>
            </div>
          </a>
        ))}
        <div className="flex-1" />
        <h1 className="m-4 text-sm">© Copuchat 2023</h1>
      </div>
    </div>
  );
};

export default SideBar;

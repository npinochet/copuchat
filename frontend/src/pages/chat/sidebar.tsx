import { AddIcon, DrawerIcon, XIcon } from "../../assets/icons";
import logo from "../../assets/logo.svg";
import { drawerAtom, myRoomsAtom, selectedRoomAtom } from "../../data/atoms";
import { useAtom, useAtomValue } from "jotai";

const RoomButton = ({ name, room, activeMembers }: RoomPreview) => {
  const [selectedRoom, setSelectedRoom] = useAtom(selectedRoomAtom);
  const [rooms, setRooms] = useAtom(myRoomsAtom);

  const fresh = rooms.find((r) => r.name === name) === undefined;
  const selected = selectedRoom === name;

  return (
    <a
      className={`px-4 py-1 ${
        selected || fresh
          ? "bg-secondary"
          : "bg-background hover:bg-secondary hover:cursor-pointer "
      }`}
      onClick={() => setSelectedRoom(name)}
    >
      <div className="flex justify-between items-center">
        {fresh && (
          <div
            className="flex items-center w-8 h-8 mr-2"
            onClick={() =>
              setRooms((state) => [...state, { name, room, activeMembers }])
            }
          >
            <AddIcon />
          </div>
        )}
        {!fresh && selected && (
          <div
            className="flex items-center w-8 h-8 mr-2"
            onClick={() =>
              setRooms((state) => state.filter((r) => r.name !== name))
            }
          >
            <XIcon />
          </div>
        )}
        <div className="w-full overflow-hidden">
          <p
            className="text-xs text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis text-left"
            style={{ direction: "rtl" }}
          >
            <bdi>{room}</bdi>
          </p>
          <p className="">{name}</p>
        </div>
        <div className="mx-3" />
        <p className="flex items-center text-center">
          <span className="text-green-700 text-sm mr-1">●</span>
          {activeMembers}
        </p>
      </div>
    </a>
  );
};

const SideBar = () => {
  const [drawerOpen, setDrawer] = useAtom(drawerAtom);
  const rooms = useAtomValue(myRoomsAtom);
  const thisRoom: RoomPreview = {
    room: "ronaldo",
    name: "sds/csc/sdcs",
    activeMembers: 10,
  };
  const fresh = rooms.find((r) => r.name === thisRoom.name) === undefined;

  return (
    <div
      className={`bg-background z-10 h-full md:flex flex flex-col absolute md:relative transition-all duration-200 md:left-0 ${
        drawerOpen ? "left-0" : "-z-10 -left-full"
      }`}
    >
      <div className="flex md:justify-center">
        <button
          id="menuBtn"
          className="p-4 block md:hidden"
          onClick={() => setDrawer(!drawerOpen)}
        >
          <DrawerIcon />
        </button>
        <div className="my-2">
          <a href="/">
            <img src={logo} alt="Copuchat logo" width={120} />
          </a>
        </div>
      </div>
      <h1 className="px-4 pb-2 text-lg">My Rooms</h1>
      <div className="overflow-y-scroll flex flex-col flex-1">
        {rooms.map((v, i) => (
          <RoomButton key={i} {...v} />
        ))}
        {fresh && <RoomButton {...thisRoom} />}
        <div className="flex-1" />
        <h1 className="m-4 text-sm">© Copuchat 2023</h1>
      </div>
    </div>
  );
};

export default SideBar;

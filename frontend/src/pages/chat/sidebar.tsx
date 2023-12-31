import { AddIcon, DrawerIcon } from "../../assets/icons";
import logo from "../../assets/logo.svg";
import { drawerAtom, myRoomsAtom } from "../../data/atoms";
import { RoomPreview } from "../../data/types";
import { useAtom, useSetAtom } from "jotai";
import { NavLink, useParams } from "react-router-dom";

const RoomButton = ({
  name,
  room,
  activeUsersLength,
  fresh,
}: RoomPreview & { fresh?: boolean }) => {
  const setRooms = useSetAtom(myRoomsAtom);

  return (
    <NavLink
      className={({ isActive }) =>
        `px-4 py-1 ${
          isActive || fresh
            ? "bg-secondary"
            : "bg-background hover:bg-secondary hover:cursor-pointer"
        }`
      }
      to={`/chat/${room}`}
      end
    >
      <div className="flex justify-between items-center">
        {fresh && (
          <button
            className="flex items-center w-8 h-8 mr-2"
            onClick={() =>
              setRooms((state) => [...state, { name, room, activeUsersLength }])
            }
          >
            <AddIcon />
          </button>
        )}
        <div className="w-full overflow-hidden">
          <p
            className="text-xs text-slate-300 truncate text-left"
            style={{ direction: "rtl" }}
          >
            <bdi>{room || "home"}</bdi>
          </p>
          <p className="truncate">{name || "home"}</p>
        </div>
        <div className="mx-3" />
        <p className="flex items-center text-center">
          <span className="text-green-700 text-sm mr-1">●</span>
          {activeUsersLength}
        </p>
      </div>
    </NavLink>
  );
};

const SideBar = () => {
  const { "*": thisRoomPath } = useParams();
  const [drawerOpen, setDrawer] = useAtom(drawerAtom);
  const [rooms, setRooms] = useAtom(myRoomsAtom);
  const thisRoom: RoomPreview = {
    room: thisRoomPath || "",
    name: thisRoomPath?.split("/")?.pop() || "",
    activeUsersLength: 10,
  };
  const fresh = rooms.find((r) => r.room === thisRoom.room) === undefined;

  return (
    <aside
      className={`bg-background z-10 h-full flex flex-col max-w-[15rem] absolute md:relative transition-all duration-200 md:left-0 ${
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
        {fresh && <RoomButton fresh {...thisRoom} />}
      </div>
      <div className="m-4">
        {!fresh && (
          <button
            className="bg-primary text-secondary font-semibold px-3 py-1 my-1 text-sm hover:bg-accent cursor-pointer"
            onClick={() =>
              setRooms((state) => state.filter((r) => r.room !== thisRoom.room))
            }
          >
            Remove
          </button>
        )}
      </div>
    </aside>
  );
};

export default SideBar;

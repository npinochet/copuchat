import { Spinner } from "../../assets/icons";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Link, useParams } from "react-router-dom";

type SubRoomEntry = {
  roomName: string;
  activeUsersLength: number;
};

const SubRooms = () => {
  const { "*": room } = useParams();
  const [newSubRoom, setNewSubRoom] = useState("");
  const { isLoading, error, data, refetch } = useQuery<SubRoomEntry[]>({
    queryKey: ["subRooms"],
    queryFn: async () =>
      (await fetch(`http://localhost:8090/sub_rooms/${room}`)).json(),
    refetchInterval: 30000,
  });
  useEffect(() => {
    refetch();
  }, [room]);
  /*const rooms: RoomPreview[] = [
    {
      name: "ronaldo",
      room: "/futbol/real_madrid/ronaldo",
      activeUsersLength: 20,
    },
    { name: "wena", room: "/country/chile/wena", activeUsersLength: 2 },
  ];*/

  let body = <></>;

  if (isLoading) {
    body = (
      <div className="w-12 h-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    console.error(data, error);
    body = <div>Error fetching sub rooms: {JSON.stringify(error)}</div>;
  }

  if ((data && data?.map) || data === null) {
    body = (
      <>
        {data?.map((v, i) => (
          <Link
            key={i}
            className="bg-background px-4 py-1 hover:bg-secondary hover:cursor-pointer max-w-full md:w-[15rem]"
            to={`/chat/${v.roomName}`}
          >
            <div className="flex justify-between items-center">
              <div className="w-full overflow-hidden">
                <p
                  className="text-xs text-slate-300 truncate text-left"
                  style={{ direction: "rtl" }}
                >
                  <bdi>{v.roomName}</bdi>
                </p>
                <p className="truncate">{v.roomName.split("/").pop()}</p>
              </div>
              <div className="mx-3" />
              <p className="flex items-center text-center">
                <span className="text-green-700 text-sm mr-1">●</span>
                {v.activeUsersLength}
              </p>
            </div>
          </Link>
        ))}
        <div className="flex-1"></div>
        <div className="w-full px-4 py-1">
          <label className="text-sm">Create Sub Room</label>
          <div className="flex">
            <input
              className="bg-background w-0 flex-1 outline outline-1 outline-text focus:outline-primary cursor-text"
              type="text"
              onChange={(evt) => setNewSubRoom(evt.currentTarget.value)}
              value={newSubRoom}
            />
            {newSubRoom && (
              <Link
                to={`/chat/${newSubRoom}`}
                className="bg-primary text-secondary h-[24px] flex items-center font-semibold ml-1 px-1 text-xs hover:bg-accent cursor-pointer"
                onClick={() => setNewSubRoom("")}
              >
                Go
              </Link>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <section className="bg-background flex flex-col justify-between items-center md:w-[15rem]">
      <h1 className="py-2">Sub Rooms</h1>
      {body}
      <footer className="p-3 text-sm">© Copuchat 2023</footer>
    </section>
  );
};

export default SubRooms;

import { RoomPreview } from "./types";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const drawerAtom = atom(false);
export const userNameAtom = atomWithStorage("userName", "");
export const myRoomsAtom = atomWithStorage<RoomPreview[]>("myRooms", [
  // TODO: Set as []
  {
    name: "ronaldo",
    room: "futbol/real_madrid/ronaldo",
    activeUsersLength: 20,
  },
  { name: "wena", room: "country/chile/wena", activeUsersLength: 2 },
]);

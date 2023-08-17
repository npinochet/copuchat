import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const drawerAtom = atom(false);
export const userNameAtom = atomWithStorage("userName", "Nico"); // TODO: Set as ""
export const selectedRoomAtom = atom("");
export const myRoomsAtom = atomWithStorage<RoomPreview[]>("myRooms", [
  // TODO: Set as []
  { name: "ronaldo", room: "/futbol/real_madrid/ronaldo", activeMembers: 20 },
  { name: "wena", room: "/country/chile/wena", activeMembers: 2 },
]);

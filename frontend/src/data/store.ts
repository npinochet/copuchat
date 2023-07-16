import { create } from "zustand";

type Store = {
  userName: string | undefined;
};

export const useChatStore = create<Store>((set) => ({
  userName: undefined,
  setUserName: (name: string) => set({ userName: name }),
}));

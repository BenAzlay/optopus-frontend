import Option from "@/app/types/Option";
import { create } from "zustand";

interface StoreState {
  walletDialogOpen: boolean;
  setWalletDialogOpen: (bool: boolean) => void;
  options: Option[];
  setOptions: (arr: Option[]) => void;
}

const useStore = create<StoreState>((set) => ({
  walletDialogOpen: false,
  setWalletDialogOpen: (bool) => set((state) => ({ walletDialogOpen: bool })),
  options: [],
  setOptions: (array) => set((state) => ({ options: array }))
}));

export default useStore;

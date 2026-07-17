import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Address {
  id:        string;
  label:     string; // "Home" | "Work" | "Other"
  fullName:  string;
  phone:     string;
  line1:     string;
  line2?:    string;
  city:      string;
  state:     string;
  pincode:   string;
  isDefault: boolean;
}

interface AddressStore {
  addresses:     Address[];
  selectedId:    string | null;
  addAddress:    (addr: Omit<Address, "id">) => string;
  updateAddress: (id: string, addr: Partial<Omit<Address, "id">>) => void;
  deleteAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  defaultAddress:() => Address | null;
}

let _idCounter = 1;

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses:  [],
      selectedId: null,

      addAddress: (addr) => {
        const id = `addr-${Date.now()}-${_idCounter++}`;
        const newAddr: Address = { ...addr, id };
        set((s) => {
          const addresses = addr.isDefault
            ? [...s.addresses.map((a) => ({ ...a, isDefault: false })), newAddr]
            : [...s.addresses, newAddr];
          return { addresses, selectedId: id };
        });
        return id;
      },

      updateAddress: (id, partial) =>
        set((s) => ({
          addresses: s.addresses.map((a) =>
            a.id === id
              ? { ...a, ...partial }
              : partial.isDefault
              ? { ...a, isDefault: false }
              : a,
          ),
        })),

      deleteAddress: (id) =>
        set((s) => ({
          addresses:  s.addresses.filter((a) => a.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      selectAddress: (id) => set({ selectedId: id }),

      defaultAddress: () => {
        const { addresses, selectedId } = get();
        if (selectedId) return addresses.find((a) => a.id === selectedId) ?? null;
        return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
      },
    }),
    { name: "stylehub-addresses" },
  ),
);

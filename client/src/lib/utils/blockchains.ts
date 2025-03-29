import { BlockchainType } from "@shared/schema";
import { BlockchainIcon } from "@/types";
import { Bitcoin, Coins, Database, Orbit, Dog } from "lucide-react";

export const BLOCKCHAIN_PATHS = {
  BTC: {
    legacy: "m/44'/0'/0'/0/",
    segwit: "m/49'/0'/0'/0/",
    nativeSegwit: "m/84'/0'/0'/0/",
  },
  ETH: "m/44'/60'/0'/0/",
  BSC: "m/44'/60'/0'/0/", // Same as ETH
  SOL: "m/44'/501'/0'/0/",
  DOGE: "m/44'/3'/0'/0/",
};

export const BLOCKCHAIN_ICONS: BlockchainIcon[] = [
  {
    id: "BTC",
    name: "BTC",
    icon: Bitcoin
  },
  {
    id: "ETH",
    name: "ETH",
    icon: Coins
  },
  {
    id: "BSC",
    name: "BSC",
    icon: Coins
  },
  {
    id: "SOL",
    name: "SOL",
    icon: Orbit
  },
  {
    id: "DOGE",
    name: "DOGE",
    icon: Dog
  }
];

export const getBlockchainIcon = (id: BlockchainType) => {
  return BLOCKCHAIN_ICONS.find((icon) => icon.id === id);
};

"use client"

import { createConfig, configureChains, WagmiConfig } from "wagmi"
import { publicProvider } from "wagmi/providers/public"
import { jsonRpcProvider } from "wagmi/providers/jsonRpc"
import { InjectedConnector } from "wagmi/connectors/injected"
import { WalletConnectConnector } from "wagmi/connectors/walletConnect"
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet"
import type { Chain } from "wagmi/chains"
import type { ReactNode } from "react"

// Define Zanjir chain
const zanjirChain: Chain = {
  id: 192837,
  name: "Zanjir",
  network: "zanjir",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.zanjir.xyz"],
    },
    public: {
      http: ["https://rpc.zanjir.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Zanjir Explorer",
      url: "https://zanjir.xyz/explorer",
    },
  },
}

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [zanjirChain],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: chain.rpcUrls.default.http[0],
      }),
    }),
    publicProvider(),
  ],
)

// Set up wagmi config
const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: "Injected",
        shimDisconnect: true,
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: "YOUR_PROJECT_ID", // Replace with your WalletConnect Project ID
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "سازنده میم‌کوین",
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

export function Web3Provider({ children }: { children: ReactNode }) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>
}


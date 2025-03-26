import { ethers } from "ethers"

// Connect to wallet
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("No Ethereum wallet found. Please install MetaMask.")
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found")
    }

    // Get the connected account
    const account = accounts[0]

    // Get the provider
    const provider = new ethers.BrowserProvider(window.ethereum)

    // Get the signer
    const signer = await provider.getSigner()

    return { account, provider, signer }
  } catch (error) {
    console.error("Error connecting to wallet:", error)
    throw error
  }
}

// Get current chain ID
export async function getCurrentChainId() {
  if (!window.ethereum) {
    throw new Error("No Ethereum wallet found")
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    return Number.parseInt(chainId, 16)
  } catch (error) {
    console.error("Error getting chain ID:", error)
    throw error
  }
}

// Setup ethereum event listeners
export function setupEthereumListeners(callbacks: {
  onChainChanged?: (chainId: string) => void
  onAccountsChanged?: (accounts: string[]) => void
  onConnect?: () => void
  onDisconnect?: () => void
}) {
  if (!window.ethereum) return

  if (callbacks.onChainChanged) {
    window.ethereum.on("chainChanged", callbacks.onChainChanged)
  }

  if (callbacks.onAccountsChanged) {
    window.ethereum.on("accountsChanged", callbacks.onAccountsChanged)
  }

  if (callbacks.onConnect) {
    window.ethereum.on("connect", callbacks.onConnect)
  }

  if (callbacks.onDisconnect) {
    window.ethereum.on("disconnect", callbacks.onDisconnect)
  }

  // Return cleanup function
  return () => {
    if (callbacks.onChainChanged) {
      window.ethereum.removeListener("chainChanged", callbacks.onChainChanged)
    }

    if (callbacks.onAccountsChanged) {
      window.ethereum.removeListener("accountsChanged", callbacks.onAccountsChanged)
    }

    if (callbacks.onConnect) {
      window.ethereum.removeListener("connect", callbacks.onConnect)
    }

    if (callbacks.onDisconnect) {
      window.ethereum.removeListener("disconnect", callbacks.onDisconnect)
    }
  }
}

// Check if wallet is connected
export async function isWalletConnected() {
  if (!window.ethereum) {
    return false
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" })
    return accounts && accounts.length > 0
  } catch (error) {
    console.error("Error checking if wallet is connected:", error)
    return false
  }
}


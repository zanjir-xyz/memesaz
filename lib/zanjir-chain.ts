// Zanjir chain configuration
export const zanjirChain = {
  chainId: 192837,
  chainIdHex: "0x2f145", // 192837 in hex
  name: "Zanjir",
  currency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrl: "https://rpc.zanjir.xyz",
  blockExplorer: "https://zanjir.xyz/explorer",
}

// Function to add Zanjir network to MetaMask
export async function addZanjirNetwork() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed")
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: zanjirChain.chainIdHex,
          chainName: zanjirChain.name,
          nativeCurrency: zanjirChain.currency,
          rpcUrls: [zanjirChain.rpcUrl],
          blockExplorerUrls: [zanjirChain.blockExplorer],
        },
      ],
    })
    return true
  } catch (error) {
    console.error("Error adding Zanjir network:", error)
    throw error
  }
}

// Function to switch to Zanjir network
export async function switchToZanjirNetwork() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed")
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: zanjirChain.chainIdHex }],
    })
    return true
  } catch (error: any) {
    // If the chain hasn't been added yet
    if (error.code === 4902) {
      return addZanjirNetwork()
    }
    throw error
  }
}

// Check if current network is Zanjir
export async function isZanjirNetwork() {
  if (!window.ethereum) {
    return false
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    return chainId === zanjirChain.chainIdHex
  } catch (error) {
    console.error("Error checking network:", error)
    return false
  }
}


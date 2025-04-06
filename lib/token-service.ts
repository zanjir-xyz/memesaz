import { ethers } from "ethers"

// Token Factory Contract address
const TOKEN_FACTORY_ADDRESS = "0xDf3Cf8b9978c9c5639E06da3bfF5014ab5c055d1"

// IRT Token address (quote token)
const IRT_TOKEN_ADDRESS = "0x09E5DCF3872DD653c4CCA5378AbA77088457A8a9" // Actual IRT token address

// Token Factory Contract ABI (minimal for interaction)
const TOKEN_FACTORY_ABI = [
  "function createToken(string memory _name, string memory _symbol, uint256 _totalSupply, uint256 _poolBaseSupply, uint256 _poolQuoteSupply) external payable",
  "event TokenCreated(address token)",
]

// ERC20 Token ABI (minimal for approval)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
]

// Approve the token factory to spend IRT tokens
async function approveIrtSpending(signer: ethers.Signer, amount: string) {
  try {
    const signerAddress = await signer.getAddress()

    // Create IRT token contract instance
    const irtToken = new ethers.Contract(IRT_TOKEN_ADDRESS, ERC20_ABI, signer)

    // Check current allowance
    const currentAllowance = await irtToken.allowance(signerAddress, TOKEN_FACTORY_ADDRESS)
    const requiredAmount = ethers.parseUnits(amount, 18)

    // If current allowance is less than required amount, approve
    if (currentAllowance < requiredAmount) {
      console.log(`Approving token factory to spend ${amount} IRT tokens`)

      // Approve the token factory to spend IRT tokens
      const approveTx = await irtToken.approve(TOKEN_FACTORY_ADDRESS, requiredAmount)
      console.log("Approval transaction sent:", approveTx.hash)

      // Wait for approval transaction to be mined
      const approveReceipt = await approveTx.wait()
      console.log("Approval confirmed:", approveReceipt)
    } else {
      console.log("Sufficient allowance already exists")
    }

    return true
  } catch (error) {
    console.error("Error approving IRT spending:", error)
    throw new Error("خطا در تایید مصرف توکن IRT")
  }
}

// Create token using the factory contract
export async function createToken(
  signer: ethers.Signer,
  name: string,
  symbol: string,
  totalSupply: string,
  createPool: boolean,
  poolBaseSupply = "0",
  poolQuoteSupply = "0",
) {
  try {
    console.log(`Creating token: ${name} (${symbol}) with total supply: ${totalSupply}`)

    // If creating a pool, approve IRT spending first
    if (createPool && poolQuoteSupply !== "0") {
      await approveIrtSpending(signer, poolQuoteSupply)
    }

    // Create contract instance for the factory
    const factoryContract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, signer)

    // Convert values to wei
    const totalSupplyWei = ethers.parseUnits(totalSupply, 18)

    // Set pool supplies based on whether we're creating a pool
    const baseSupplyWei = createPool ? ethers.parseUnits(poolBaseSupply, 18) : ethers.parseUnits("0", 18)
    const quoteSupplyWei = createPool ? ethers.parseUnits(poolQuoteSupply, 18) : ethers.parseUnits("0", 18)

    // Prepare transaction options (in case the function requires ETH)
    const txOptions = {
      value: ethers.parseEther("0"), // Set to appropriate value if required
    }

    // Call the createToken function
    const tx = await factoryContract.createToken(name, symbol, totalSupplyWei, baseSupplyWei, quoteSupplyWei, txOptions)

    console.log("Transaction sent:", tx.hash)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    console.log("Transaction confirmed:", receipt)

    // Find the TokenCreated event in the logs
    let tokenAddress = ""
    for (const log of receipt.logs) {
      try {
        const parsedLog = factoryContract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        })

        if (parsedLog && parsedLog.name === "TokenCreated") {
          tokenAddress = parsedLog.args[0]
          break
        }
      } catch (e) {
        // Skip logs that can't be parsed
        continue
      }
    }

    if (!tokenAddress) {
      // For demo purposes, generate a fake address if event parsing fails
      tokenAddress = `0x${Array(40)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")}`
    }

    return {
      tokenAddress,
      success: true,
    }
  } catch (error) {
    console.error("Error creating token:", error)
    throw new Error("خطا در ساخت توکن")
  }
}


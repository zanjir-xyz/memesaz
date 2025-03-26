"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { connectWallet, setupEthereumListeners, isWalletConnected } from "@/lib/wallet-connect"
import { isZanjirNetwork, switchToZanjirNetwork } from "@/lib/zanjir-chain"
import { createToken } from "@/lib/token-service"
import { convertToPersianWords, formatNumber } from "@/lib/number-to-persian"
import {
  Loader2,
  Check,
  AlertCircle,
  TrendingUp,
  Wallet,
  LogOut,
  Type,
  Tag,
  Coins,
  Banknote,
  Droplets,
  RefreshCw,
  Sparkles,
  CheckCircle,
  Info,
  Copy,
  ExternalLink,
  Hash,
  PlusCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function TokenCreator() {
  // Wallet state
  const [account, setAccount] = useState<string | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  // Token form state
  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenSupply, setTokenSupply] = useState("")
  const [irtAmount, setIrtAmount] = useState("")
  const [tokenPercentage, setTokenPercentage] = useState(50)
  const [estimatedPrice, setEstimatedPrice] = useState<string | null>(null)

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentSuccess, setDeploymentSuccess] = useState(false)
  const [deploymentError, setDeploymentError] = useState("")
  const [tokenAddress, setTokenAddress] = useState("")
  const [currentStep, setCurrentStep] = useState<"idle" | "approving" | "creating">("idle")
  const [addressCopied, setAddressCopied] = useState(false)
  const [tokenAddedToWallet, setTokenAddedToWallet] = useState(false)

  // Calculate estimated price when inputs change
  useEffect(() => {
    if (irtAmount && tokenSupply && tokenPercentage) {
      try {
        // Convert to numbers
        const irtValue = Number.parseFloat(irtAmount)
        const totalSupply = Number.parseFloat(tokenSupply)
        const percentage = tokenPercentage / 100

        // Calculate tokens in pool
        const tokensInPool = totalSupply * percentage

        // Calculate price (IRT per token)
        if (tokensInPool > 0) {
          const price = irtValue / tokensInPool

          // Format price based on its magnitude
          let formattedPrice: string
          if (price < 0.000001) {
            formattedPrice = price.toExponential(4)
          } else if (price < 0.001) {
            formattedPrice = price.toFixed(8)
          } else if (price < 1) {
            formattedPrice = price.toFixed(6)
          } else if (price < 1000) {
            formattedPrice = price.toFixed(4)
          } else {
            formattedPrice = price.toLocaleString("fa-IR", { maximumFractionDigits: 2 })
          }

          setEstimatedPrice(formattedPrice)
        } else {
          setEstimatedPrice(null)
        }
      } catch (error) {
        console.error("Error calculating price:", error)
        setEstimatedPrice(null)
      }
    } else {
      setEstimatedPrice(null)
    }
  }, [irtAmount, tokenSupply, tokenPercentage])

  // Check wallet connection and network on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const walletConnected = await isWalletConnected()
        setIsConnected(walletConnected)

        if (walletConnected) {
          const onZanjirNetwork = await isZanjirNetwork()
          setIsCorrectNetwork(onZanjirNetwork)

          // Get account address
          const accounts = await window.ethereum?.request({ method: "eth_accounts" })
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0])

            // Get signer
            const provider = new ethers.BrowserProvider(window.ethereum as any)
            const signerInstance = await provider.getSigner()
            setSigner(signerInstance)
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }

    checkConnection()

    // Setup event listeners
    const cleanup = setupEthereumListeners({
      onChainChanged: (_chainId) => {
        // Refresh page on chain change
        window.location.reload()
      },
      onAccountsChanged: (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          setIsConnected(false)
          setAccount(null)
          setSigner(null)
        } else {
          // Account changed
          setAccount(accounts[0])
          checkConnection()
        }
      },
    })

    return cleanup
  }, [])

  // Connect wallet handler
  const handleConnectWallet = async () => {
    try {
      const { account: connectedAccount, signer: connectedSigner } = await connectWallet()
      setAccount(connectedAccount)
      setSigner(connectedSigner)
      setIsConnected(true)

      // Check if on correct network
      const onZanjirNetwork = await isZanjirNetwork()
      setIsCorrectNetwork(onZanjirNetwork)
    } catch (error) {
      console.error("Error connecting wallet:", error)
    }
  }

  // Switch network handler
  const handleSwitchNetwork = async () => {
    try {
      await switchToZanjirNetwork()
      setIsCorrectNetwork(true)
    } catch (error) {
      console.error("Error switching network:", error)
    }
  }

  // Create token handler
  const handleCreateToken = async () => {
    if (!signer) {
      setDeploymentError("کیف پول متصل نیست")
      return
    }

    if (!tokenName || !tokenSymbol || !tokenSupply) {
      setDeploymentError("لطفا تمام فیلدها را پر کنید")
      return
    }

    if (!irtAmount) {
      setDeploymentError("لطفا مقدار IRT را وارد کنید")
      return
    }

    setIsDeploying(true)
    setDeploymentError("")

    try {
      // Calculate token amount for pool (tokenPercentage% of total supply)
      const tokenForPool = (Number(tokenSupply) * tokenPercentage) / 100
      const poolBaseSupply = tokenForPool.toString()
      const poolQuoteSupply = irtAmount

      // Set step to approving
      setCurrentStep("approving")

      // Create token using factory (includes approval step)
      setCurrentStep("creating")
      const result = await createToken(
        signer,
        tokenName,
        tokenSymbol,
        tokenSupply,
        true, // Always create pool
        poolBaseSupply,
        poolQuoteSupply,
      )

      setTokenAddress(result.tokenAddress)
      setDeploymentSuccess(true)
      setTokenAddedToWallet(false) // Reset token added state
    } catch (error) {
      console.error("Deployment error:", error)
      setDeploymentError(error instanceof Error ? error.message : "خطا در ساخت توکن")
    } finally {
      setIsDeploying(false)
      setCurrentStep("idle")
    }
  }

  // Disconnect wallet (for UI only, MetaMask doesn't actually support programmatic disconnect)
  const handleDisconnectWallet = () => {
    setIsConnected(false)
    setAccount(null)
    setSigner(null)
  }

  // Copy address to clipboard
  const copyAddressToClipboard = async () => {
    if (tokenAddress) {
      try {
        await navigator.clipboard.writeText(tokenAddress)
        setAddressCopied(true)
        setTimeout(() => setAddressCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy address:", err)
      }
    }
  }

  // Add token to MetaMask
  const addTokenToMetaMask = async () => {
    if (!window.ethereum || !tokenAddress || !tokenSymbol) {
      return
    }

    try {
      // Request to add the token to MetaMask
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: 18,
            // Optional image URL
            // image: 'https://example.com/token-image.png',
          },
        },
      })

      if (wasAdded) {
        setTokenAddedToWallet(true)
        setTimeout(() => setTokenAddedToWallet(false), 3000)
      }
    } catch (error) {
      console.error("Error adding token to MetaMask:", error)
    }
  }

  // Get button text based on current step
  const getButtonText = () => {
    if (!isDeploying) return "ساخت توکن"

    switch (currentStep) {
      case "approving":
        return "در حال تایید مصرف IRT..."
      case "creating":
        return "در حال ساخت توکن..."
      default:
        return "در حال پردازش..."
    }
  }

  return (
    <TooltipProvider>
      <Card className="shadow-lg border-purple-800 bg-gray-900">
        <CardHeader className="border-b border-purple-900/50">
          <CardTitle className="text-2xl text-center text-purple-300 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            ساخت توکن جدید
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            توکن ERC20 خود را در شبکه زنجیر ایجاد کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {!isConnected ? (
            <div className="text-center py-3">
              <div className="flex justify-center">
              <Button
                onClick={handleConnectWallet}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                اتصال کیف پول
              </Button>
              </div>
              <p className="mt-6 text-sm text-gray-400">برای ساخت توکن، ابتدا کیف پول خود را متصل کنید</p>
              
            </div>
          ) : !isCorrectNetwork ? (
            <div className="text-center py-6">
              <Alert variant="warning" className="mb-4 bg-amber-950 border-amber-800 text-amber-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>شبکه اشتباه</AlertTitle>
                <AlertDescription>لطفا به شبکه زنجیر متصل شوید</AlertDescription>
              </Alert>
              <Button
                onClick={handleSwitchNetwork}
                className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                تغییر به شبکه زنجیر
              </Button>
            </div>
          ) : deploymentSuccess ? (
            <div className="text-center py-6">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-green-900/50 p-3">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-green-400 mb-2">توکن با موفقیت ساخته شد!</h3>
              <p className="mb-4 text-gray-300">
                توکن {tokenName} ({tokenSymbol}) با موفقیت در شبکه زنجیر ایجاد شد.
              </p>
              <div className="bg-gray-800 p-3 rounded-md mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />
                    آدرس قرارداد:
                  </p>
                  <p className="text-sm text-gray-400 break-all">{tokenAddress}</p>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={copyAddressToClipboard}
                          className="text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          {addressCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{addressCopied ? "کپی شد!" : "کپی آدرس"}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`https://zanjir.xyz/explorer/address/${tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>مشاهده در اکسپلورر</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
              </div>
              <p className="text-green-400 text-sm flex items-center justify-center gap-1 mb-4">
                <Droplets className="h-4 w-4" />
                استخر نقدینگی نیز با موفقیت ایجاد شد!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={addTokenToMetaMask}
                      className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
                      disabled={tokenAddedToWallet}
                    >
                      {tokenAddedToWallet ? (
                        <>
                          <Check className="h-4 w-4" />
                          توکن به کیف پول اضافه شد!
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4" />
                          افزودن به متامسک
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>افزودن توکن به کیف پول متامسک</p>
                  </TooltipContent>
                </Tooltip>

                <Button
                  onClick={() => {
                    setDeploymentSuccess(false)
                    setTokenName("")
                    setTokenSymbol("")
                    setTokenSupply("")
                    setIrtAmount("")
                    setTokenPercentage(50)
                  }}
                  className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  ساخت توکن جدید
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  آدرس کیف پول: {account?.slice(0, 6)}...{account?.slice(-4)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectWallet}
                  className="text-xs bg-gray-1000 border-gray-700 text-gray-300 hover:bg-gray-800 flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" />
                  قطع اتصال
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenName" className="text-gray-300 flex items-center gap-1">
                    <Type className="h-3.5 w-3.5" />
                    نام توکن
                  </Label>
                  <Input
                    id="tokenName"
                    placeholder="مثال: توکن زنجیر"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tokenSymbol" className="text-gray-300 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    نماد توکن
                  </Label>
                  <Input
                    id="tokenSymbol"
                    placeholder="مثال: ZNJ"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value)}
                    className="uppercase bg-gray-800 border-gray-700 text-gray-200"
                    maxLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tokenSupply" className="text-gray-300 flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" />
                    تعداد کل توکن
                  </Label>
                  <Input
                    id="tokenSupply"
                    placeholder="مثال: 1000000"
                    value={tokenSupply}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, "")
                      setTokenSupply(value)
                    }}
                    type="text"
                    inputMode="numeric"
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                  {tokenSupply && (
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Hash className="h-3 w-3 mr-1 text-gray-600" />
                      <span>{formatNumber(tokenSupply)}</span>
                      <span className="mx-1">-</span>
                      <span className="text-gray-400">{convertToPersianWords(tokenSupply)} واحد</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4 bg-purple-950/50 rounded-md border border-purple-900/50">
                  <h3 className="font-medium text-purple-300 mb-2 flex items-center gap-1">
                    <Droplets className="h-4 w-4 text-purple-400" />
                    استخر نقدینگی
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="irtAmount" className="text-gray-300 flex items-center gap-1">
                      <Banknote className="h-3.5 w-3.5" />
                      مقدار IRT برای نقدینگی
                    </Label>
                    <Input
                      id="irtAmount"
                      placeholder="مقدار IRT"
                      value={irtAmount}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/[^0-9]/g, "")
                        setIrtAmount(value)
                      }}
                      type="text"
                      inputMode="numeric"
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                    {irtAmount && (
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Hash className="h-3 w-3 mr-1 text-gray-600" />
                        <span>{formatNumber(irtAmount)}</span>
                        <span className="mx-1">-</span>
                        <span className="text-gray-400">{convertToPersianWords(irtAmount)} تومان</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="tokenPercentage" className="text-gray-300 flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" />
                        درصد توکن برای استخر نقدینگی
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{tokenPercentage}%</span>
                        {estimatedPrice && (
                          <Badge
                            variant="outline"
                            className="bg-gray-800 text-green-400 border-green-800 flex items-center gap-1"
                          >
                            <TrendingUp className="h-3 w-3" />
                            <span>قیمت: {estimatedPrice} IRT</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Slider
                      id="tokenPercentage"
                      min={1}
                      max={100}
                      step={1}
                      value={[tokenPercentage]}
                      onValueChange={(value) => setTokenPercentage(value[0])}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>۱٪</span>
                      <span>۵۰٪</span>
                      <span>۱۰۰٪</span>
                    </div>

                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Hash className="h-3 w-3 mr-1 text-gray-600" />
                      <span>{tokenPercentage}%</span>
                      <span className="mx-1">-</span>
                      <span className="text-gray-400">{convertToPersianWords(tokenPercentage)} درصد</span>
                    </div>

                    {estimatedPrice && (
                      <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-700/50 flex items-center">
                        <p className="text-sm text-gray-300">
                          قیمت تخمینی هر توکن: <span className="text-green-400 font-medium">{estimatedPrice} IRT</span>
                        </p>
                        <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                      </div>
                    )}
                  </div>

                  <Alert className="bg-blue-950/50 border-blue-900/50 text-blue-300">
                    <Info className="h-4 w-4 text-blue-300" />
                    <AlertTitle >نکته</AlertTitle>
                    <AlertDescription className="text-blue-400">
                      برای ایجاد استخر مبادله، نیاز به افزودن مقداری نقدینگی از توکن IRT خواهید داشت.
                    </AlertDescription>
                  </Alert>
                </div>

                {deploymentError && (
                  <Alert variant="destructive" className="bg-red-950/50 border-red-900/50 text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>خطا</AlertTitle>
                    <AlertDescription className="text-red-400">{deploymentError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {isConnected && isCorrectNetwork && !deploymentSuccess && (
          <CardFooter className="border-t border-purple-900/50 bg-gray-900/50">
            <Button
              onClick={handleCreateToken}
              disabled={isDeploying}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {getButtonText()}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  ساخت توکن
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  )
}


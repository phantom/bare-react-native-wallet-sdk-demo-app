const SUPPORTED_CHAINS = {
  'ethereum': {
    chainId: 1,
    hexChainId: '0x1'
  },
  'goerli': {
    chainId: 5,
    hexChainId: '0x5'
  }
} as const;

type SupportedEVMChainIds = keyof typeof SUPPORTED_CHAINS;

/**
 * Converts a decimal string representation of ETH into wei (bigint)
 * @param value The decimal string (e.g. "1.5")
 * @returns The value in wei as a bigint
 */
export function parseEther(value: string): bigint {
  // Split on decimal point
  const [whole, fraction = ""] = value.split(".");

  // Convert whole number part
  let result = BigInt(whole) * BigInt("1000000000000000000");

  // Handle decimal part if it exists
  if (fraction !== "") {
    // Pad with zeros to 18 decimals
    const paddedFraction = fraction.padEnd(18, "0").slice(0, 18);
    // Add fractional part
    result += BigInt(paddedFraction);
  }

  return result;
}

/**
 * Converts a number to a hex string with '0x' prefix
 */
function toHex(num: number | bigint): string {
  return '0x' + num.toString(16);
}

async function sendTransactionPhantomProvider(provider: any, to: string, chainId: string, address: string) {
  try {
    const chain = SUPPORTED_CHAINS[chainId as SupportedEVMChainIds];
    if (!chain) {
      throw new Error("Unsupported chain id");
    }
    const destination = to ? to : address;

    const transactionParameters = {
      to: destination,
      from: address,
      chainId: toHex(chain.chainId),
      value: toHex(parseEther("0.0000001")),
      // Optional fields
      data: "0x", // Empty data field instead of the previous long hex string
      type: "0x0", // Legacy transaction type
    } as const;
    console.log(transactionParameters);
    return provider.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export default sendTransactionPhantomProvider; 
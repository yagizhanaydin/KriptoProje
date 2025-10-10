import xrpl from "xrpl";

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  const wallet = xrpl.Wallet.generate();
  const fundedWallet = await client.fundWallet(wallet);

  console.log("HOLDER_ADDRESS:", fundedWallet.wallet.address);
  console.log("HOLDER_SEED:", fundedWallet.wallet.seed);

  await client.disconnect();
}

main();

import xrpl from "xrpl";

async function enableDefaultRipple() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  // Kendi issuer SEED'ini buraya yaz
  const wallet = xrpl.Wallet.fromSeed("sEdSoxPoJHkUVmNdiWPiVahLcyAYMzb");

  const tx = {
    TransactionType: "AccountSet",
    Account: wallet.address,
    SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
  };

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log("Sonuç:", result.result.meta.TransactionResult);
  console.log("✅ DefaultRipple başarıyla açıldı!");
  await client.disconnect();
}

enableDefaultRipple();

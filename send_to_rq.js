import xrpl from "xrpl";
import dotenv from "dotenv";
dotenv.config();

const RECEIVER = "rqERAV169V1ja1JiQHu8sBjPcjhY2Kpxb";

async function main() {
  const client = new xrpl.Client(process.env.XRPL_WS_URL);
  await client.connect();

  const issuer = xrpl.Wallet.fromSeed(process.env.ISSUER_SEED);
  const TOKEN = process.env.TOKEN_CODE;
  const AMOUNT = process.env.PAYMENT_AMOUNT;

  console.log("Issuer:", issuer.address);
  console.log("Receiver:", RECEIVER);

  // 1) Alıcı hesabı var mı kontrol
  try {
    await client.request({
      command: "account_info",
      account: RECEIVER,
      ledger_index: "validated"
    });
    console.log("Receiver account found on ledger.");
  } catch (err) {
    if (err.data && err.data.error === "actNotFound") {
      console.log("Receiver account NOT found on ledger. Testnet için fonlanması gerekir.");
      await client.disconnect();
      return;
    } else {
      console.error(err);
      await client.disconnect();
      return;
    }
  }

  // 2) Alıcı trustline var mı kontrol
  const lines = await client.request({
    command: "account_lines",
    account: RECEIVER,
    ledger_index: "validated"
  });

  const donLine = lines.result.lines.find(l => l.currency === TOKEN && l.account === issuer.address);

  if (!donLine) {
    console.log(`ALERT: Receiver does NOT have a trustline for ${TOKEN}. Önce açtır.`);
    await client.disconnect();
    return;
  }

  // 3) Payment
  const paymentTx = {
    TransactionType: "Payment",
    Account: issuer.address,
    Destination: RECEIVER,
    Amount: {
      currency: TOKEN,
      value: AMOUNT,
      issuer: issuer.address
    }
  };

  const prepared = await client.autofill(paymentTx);
  const signed = issuer.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log("Transaction result:", result.result.meta.TransactionResult);
  console.log("Tx hash:", result.result.tx_json.hash);

  await client.disconnect();
}

main();

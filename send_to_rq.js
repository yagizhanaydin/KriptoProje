import xrpl from "xrpl";
import dotenv from "dotenv";
dotenv.config();

const RECEIVER = "rqERAV169V1ja1JiQHu8sBjPcjhY2Kpxb"; // ege abi

async function main() {
  const client = new xrpl.Client(process.env.XRPL_WS_URL);
  await client.connect();
  console.log("Connected to XRPL Testnet");

  const issuer = xrpl.Wallet.fromSeed(process.env.ISSUER_SEED);
  const TOKEN = process.env.TOKEN_CODE;
  const AMOUNT = process.env.PAYMENT_AMOUNT;

  console.log("Issuer:", issuer.address);
  console.log("Receiver:", RECEIVER);
  console.log("Token:", TOKEN, "Amount:", AMOUNT);

  
  try {
    await client.request({
      command: "account_info",
      account: RECEIVER,
      ledger_index: "validated"
    });
    console.log("Receiver account found on ledger.");
  } catch (err) {
    console.error("Receiver account NOT found:", err);
    await client.disconnect();
    return;
  }

  
  const lines = await client.request({
    command: "account_lines",
    account: RECEIVER,
    ledger_index: "validated"
  });

  const donLine = lines.result.lines.find(
    l => l.currency === TOKEN && l.account === issuer.address
  );

  if (!donLine) {
    console.log(`ALERT: Receiver does NOT have a trustline for ${TOKEN}. Önce açtır.`);
    console.log("Existing trustlines:", lines.result.lines);
    await client.disconnect();
    return;
  } else {
    console.log("Trustline found:", donLine);
  }

  
  const paymentTx = {
    TransactionType: "Payment",
    Account: issuer.address,
    Destination: RECEIVER,
    Amount: {
      currency: TOKEN,
      value: AMOUNT.toString(),
      issuer: issuer.address
    }
  };

  console.log("Prepared payment transaction:", paymentTx);

  try {
    const prepared = await client.autofill(paymentTx);
    console.log("Autofilled transaction:", prepared);

    const signed = issuer.sign(prepared);
    console.log("Signed transaction:", signed.tx_blob);

    const result = await client.submitAndWait(signed.tx_blob);
    console.log("Submit result object:", result);
    console.log("Transaction result:", result.result.meta.TransactionResult);
    console.log("Transaction hash:", result.result.tx_json.hash);
  } catch (err) {
    console.error("Payment error:", err);
  }

  await client.disconnect();
  console.log("Disconnected from XRPL.");
}

main();

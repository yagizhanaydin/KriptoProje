import xrpl from "xrpl";
import dotenv from "dotenv";
dotenv.config();

async function sendToken() {
  const client = new xrpl.Client(process.env.XRPL_WS_URL || "wss://s.altnet.rippletest.net:51233");
  await client.connect();

  const issuerWallet = xrpl.Wallet.fromSeed(process.env.ISSUER_SEED); 

  const receiverAddress = "rLgjyuuc6TuAXzrN5VLttNoTL4ANb38pf2"; 
  const amountToSend = process.env.PAYMENT_AMOUNT || "10000"; 

  const paymentTx = {
    TransactionType: "Payment",
    Account: issuerWallet.address,
    Destination: receiverAddress,
    Amount: {
      currency: process.env.TOKEN_CODE || "DON",
      issuer: issuerWallet.address,
      value: amountToSend
    }
  };

  try {
    const prepared = await client.autofill(paymentTx);
    const signed = issuerWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    console.log("Transaction result:", result.result.meta.TransactionResult);
    console.log(`${amountToSend} ${process.env.TOKEN_CODE || "DON"} gönderildi --> ${receiverAddress}`);
    console.log("Transaction hash:", result.result.tx_json.hash);
  } catch (err) {
    console.error("Hata gönderirken:", err);
  } finally {
    await client.disconnect();
  }
}

sendToken();

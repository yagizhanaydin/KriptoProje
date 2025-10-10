
import xrpl from "xrpl";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const client = new xrpl.Client(process.env.XRPL_WS_URL);

  try {
    await client.connect();
    console.log(" Testnet'e bağlandı!");


    const issuer = xrpl.Wallet.fromSeed(process.env.ISSUER_SEED);
    const holder = xrpl.Wallet.fromSeed(process.env.HOLDER_SEED);

    console.log("Issuer Address:", issuer.address);
    console.log("Holder Address:", holder.address);

   
    await client.fundWallet(issuer).catch(() => {});
    await client.fundWallet(holder).catch(() => {});
    console.log(" Wallet'lar fonlandı (varsa)!");

  
    const TOKEN = process.env.TOKEN_CODE || "DON"; 
    const TRUST_LIMIT = process.env.TRUST_LIMIT || "1000000";
    const PAYMENT_AMOUNT = process.env.PAYMENT_AMOUNT || "10000";

 
    const trustSetTx = {
      TransactionType: "TrustSet",
      Account: holder.address,
      LimitAmount: {
        currency: TOKEN,
        issuer: issuer.address,
        value: TRUST_LIMIT
      }
    };

    console.log(` Trustline oluşturuluyor: ${holder.address} -> ${TOKEN}`);
    await client.submitAndWait(trustSetTx, { wallet: holder });
    console.log(" Trustline oluşturuldu!");

   
    const paymentTx = {
      TransactionType: "Payment",
      Account: issuer.address,
      Destination: holder.address,
      Amount: {
        currency: TOKEN,
        value: PAYMENT_AMOUNT,
        issuer: issuer.address
      }
    };

    console.log(` ${PAYMENT_AMOUNT} ${TOKEN} gönderiliyor: ${issuer.address} -> ${holder.address}`);
    await client.submitAndWait(paymentTx, { wallet: issuer });
    console.log(" Coin başarıyla gönderildi!");

    await client.disconnect();
    console.log(" Bağlantı kapandı.");
  } catch (err) {
    console.error(" Hata:", err);
  }
}

main();

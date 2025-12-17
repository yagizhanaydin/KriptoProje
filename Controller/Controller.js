import pool from '../Database.js/DB.js';
import xrpl from 'xrpl';
import dotenv from 'dotenv';

dotenv.config();

async function connectXRPL() {
  const client = new xrpl.Client(process.env.XRPL_WS_URL, { connectionTimeout: 15000 });
  await client.connect();
  console.log(" XRPL testnet'e bağlandı.");
  return client;
}

export const PostClient = async (req, res) => {
  try {
    const holderAddress = req.body.address;
    if (!holderAddress) {
      console.log(" Adres girilmedi.");
      return res.status(400).json({ success: false, message: 'Adres girilmedi' });
    }

    const TOKEN = process.env.TOKEN_CODE || "DON";
    const PAYMENT_AMOUNT = process.env.PAYMENT_AMOUNT || "5000";

    console.log(` İşlem başlıyor: ${holderAddress} adresine ${PAYMENT_AMOUNT} ${TOKEN} gönderilecek.`);

    
    await pool.query(
      `INSERT INTO tokens (token, created_at) VALUES ($1, NOW()) ON CONFLICT (token) DO UPDATE SET created_at = NOW()`,
      [holderAddress]
    );
    console.log(" DB kaydı yapıldı.");

    const client = await connectXRPL();
    const issuer = xrpl.Wallet.fromSeed(process.env.ISSUER_SEED);
    console.log(` Issuer cüzdanı: ${issuer.address}`);

   
    const lines = await client.request({ command: "account_lines", account: holderAddress });
    const hasTrustline = lines.result.lines.some(line => line.currency === TOKEN && line.account === issuer.address);

    if (!hasTrustline) {
      console.log(` Trustline yok, açılıyor...`);
      const trustTx = {
        TransactionType: "TrustSet",
        Account: holderAddress,
        LimitAmount: { currency: TOKEN, issuer: issuer.address, value: process.env.TRUST_LIMIT || "1000000" }
      };
      try { 
        const trustPrepared = await client.autofill(trustTx);
        const trustSigned = issuer.sign(trustPrepared);
        const trustResult = await client.submitAndWait(trustSigned.tx_blob);
        console.log("Trustline açıldı. Result:", trustResult.result.meta.TransactionResult);
      } catch (err) {
        console.log(" Trustline açılamadı veya zaten mevcut.", err.message);
      }
    } else {
      console.log("Trustline zaten mevcut.");
    }

   
    const paymentTx = {
      TransactionType: "Payment",
      Account: issuer.address,
      Destination: holderAddress,
      Amount: { currency: TOKEN, value: PAYMENT_AMOUNT, issuer: issuer.address }
    };

    console.log(" Payment transaction hazırlanıyor:", paymentTx);

    const prepared = await client.autofill(paymentTx);
    const signed = issuer.sign(prepared);
    const submitResult = await client.submitAndWait(signed.tx_blob);
    console.log(" Payment submit edildi.");
    console.log(" TransactionResult:", submitResult.result.meta.TransactionResult);


    let txHash;
    try {
      const txInfo = await client.getTransaction(submitResult.result.hash);
      txHash = txInfo.hash;
    } catch {
      txHash = submitResult.result?.tx_json?.hash || 'hash bulunamadı';
    }
    console.log(" Transaction hash:", txHash);

    await client.disconnect();
    console.log(" XRPL bağlantısı kapatıldı.");

    return res.status(201).json({
      success: true,
      message: `${PAYMENT_AMOUNT} ${TOKEN} başarıyla gönderildi: ${issuer.address} -> ${holderAddress}`,
      hash: txHash
    });

  } catch (err) {
    console.error(" Sunucu hatası:", err);
    return res.status(500).json({ success: false, message: 'Sunucu hatası', error: err.message });
  }
};

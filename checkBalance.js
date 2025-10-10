import xrpl from "xrpl";

async function check() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  const address = "rLgjyuuc6TuAXzrN5VLttNoTL4ANb38pf2"; // alıcı adres
  const balances = await client.getBalances(address);

  console.log("💰 Bu adresteki bakiyeler:");
  console.log(balances);

  await client.disconnect();
}

check();

require('dotenv').config()
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { CLIENT_ID, APP_SECRET } = process.env;
const base = "https://api-m.sandbox.paypal.com";


module.exports = {
  /* --------------------------- create paypal order -------------------------- */
  createOrder: async (total) => {
    try {
      total = Math.round(total * 0.013)
      const accessToken = await generateAccessToken();
      const url = `${base}/v2/checkout/orders`;
      const response = await fetch(url, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: total,
              },
            },
          ],
        }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return err;
    }
  },

  /* ----------------------------- capture payment ---------------------------- */
  capturePayment: async (orderId) => {
    try {
      const accessToken = await generateAccessToken();
      const url = `${base}/v2/checkout/orders/${orderId}/capture`;
      const response = await fetch(url, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return err
    }
  }

}

/* --------------------- accessToken generator function --------------------- */
async function generateAccessToken() {
  try {
    const response = await fetch(base + "/v1/oauth2/token", {
      method: "post",
      body: "grant_type=client_credentials",
      headers: {
        Authorization:
          "Basic " + Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64"),
      },
    });
    const data = await response.json();
    return data.access_token;
  } catch (err) {
    return err;
  }
}
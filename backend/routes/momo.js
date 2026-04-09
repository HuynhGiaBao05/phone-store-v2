const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

const momoConfig = require("../config/momo");

router.post("/payment", async (req, res) => {
  try {
    const { amount, orderInfo } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Missing amount" });
    }

    const requestId = momoConfig.partnerCode + Date.now();
    const orderId = requestId;

    const rawSignature =
      `accessKey=${momoConfig.accessKey}` +
      `&amount=${amount}` +
      `&extraData=` +
      `&ipnUrl=${momoConfig.ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${momoConfig.partnerCode}` +
      `&redirectUrl=${momoConfig.redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=payWithMethod`;

    const signature = crypto
      .createHmac("sha256", momoConfig.secretKey)
      .update(rawSignature)
      .digest("hex");

    const response = await axios.post(momoConfig.endpoint, {
      partnerCode: momoConfig.partnerCode,
      accessKey: momoConfig.accessKey,
      requestId,
      amount: amount.toString(),
      orderId,
      orderInfo,
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
      extraData: "",
      requestType: "payWithMethod",
      signature,
      lang: "vi"
    });

    console.log("👉 MOMO RESPONSE:", response.data);

    res.json({ payUrl: response.data.payUrl });

  } catch (err) {
    console.log("❌ MOMO ERROR:", err.response?.data || err.message);
    res.status(500).json(err.response?.data || err.message);
  }
});

module.exports = router;
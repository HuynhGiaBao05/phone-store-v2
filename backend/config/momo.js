module.exports = {
  partnerCode: "MOMO",
  accessKey: "F8BBA842ECF85",
  secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",

  // ✅ redirect về frontend
  redirectUrl: "http://localhost:5173",

  // ✅ backend nhận callback
  ipnUrl: "http://localhost:5000/ipn"
};
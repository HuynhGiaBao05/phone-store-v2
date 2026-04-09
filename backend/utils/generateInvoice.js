const PDFDocument = require("pdfkit");
const path = require("path");
const QRCode = require("qrcode");

const formatMoney = (num) => num.toLocaleString("vi-VN") + " đ";

const generateInvoice = async (order) => {
  return new Promise(async (resolve) => {

    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // ================= FONT =================
    const font = path.join(__dirname, "fonts/Roboto-VariableFont_wdth,wght.ttf");

    // ================= LOGO =================
    const logo = path.join(__dirname, "logo.png");

    // ================= QR =================
    const qr = await QRCode.toDataURL(`Order:${order.orderCode}`);

    // =====================================================
    // 🔥 HEADER
    // =====================================================
    doc.image(logo, 40, 30, { width: 60 });

    doc
      .font(font)
      .fontSize(18)
      .text("HÓA ĐƠN  ", 0, 40, { align: "center" });

    doc.moveDown(2);

    // =====================================================
    // 🔥 COMPANY INFO
    // =====================================================
    doc.fontSize(10);
    doc.text("Công ty: PHONESTORE");
    doc.text("Địa chỉ: 123 Nguyễn Huệ, TP.HCM");
    doc.text("MST: 0123456789");
    doc.text("Hotline: 0999999999");

    doc.moveDown();

    // =====================================================
    // 🔥 CUSTOMER INFO
    // =====================================================
    doc.text(`Mã đơn: ${order.orderCode}`);
    doc.text(`Ngày đặt: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Ngày giao: ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : "—"}`);
    doc.text(`Khách hàng: ${order.user?.fullName}`);
    doc.text(`Email: ${order.user?.email}`);
    doc.text(`Địa chỉ: ${order.shippingInfo?.address}`);

    doc.moveDown();

    // line
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // =====================================================
    // 🔥 TABLE HEADER
    // =====================================================
    const startY = doc.y;

    doc.text("STT", 40, startY);
    doc.text("Sản phẩm", 70, startY);
    doc.text("SL", 300, startY, { width: 40, align: "center" });
    doc.text("Đơn giá", 350, startY, { width: 80, align: "right" });
    doc.text("Thành tiền", 430, startY, { width: 100, align: "right" });

    doc.moveDown();

    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();

    // =====================================================
    // 🔥 ITEMS
    // =====================================================
    let y = doc.y + 5;

    order.items.forEach((item, index) => {

      doc.text(index + 1, 40, y);
      doc.text(item.product?.name, 70, y, { width: 220 });

      doc.text(item.quantity, 300, y, {
        width: 40,
        align: "center"
      });

      doc.text(formatMoney(item.price), 350, y, {
        width: 80,
        align: "right"
      });

      doc.text(formatMoney(item.price * item.quantity), 430, y, {
        width: 100,
        align: "right"
      });

      y += 25;
    });

    // =====================================================
    // 🔥 VAT CALCULATION
    // =====================================================
    const subtotal = order.totalAmount;
    const vat = subtotal * 0.1;
    const total = subtotal + vat;

    doc.moveTo(40, y).lineTo(550, y).stroke();
    y += 10;

    doc.text(`Tạm tính: ${formatMoney(subtotal)}`, 350, y, { align: "right" });
    y += 20;

    doc.text(`VAT (10%): ${formatMoney(vat)}`, 350, y, { align: "right" });
    y += 20;

    doc.fontSize(14).text(`Tổng thanh toán: ${formatMoney(total)}`, 350, y, {
      align: "right"
    });

    // =====================================================
    // 🔥 QR
    // =====================================================
    doc.image(qr, 430, y + 20, { width: 100 });

    // =====================================================
    // 🔥 SIGNATURE
    // =====================================================
    y += 120;

    doc.fontSize(11);

    doc.text("Khách hàng", 80, y);
    doc.text("Đại diện hệ thống", 350, y);

    y += 60;

    doc.text("(Ký, ghi rõ họ tên)", 70, y);
    doc.text("huynh gia bao", 350, y);
    doc.textAlign = "center";

    // =====================================================
    // 🔥 FOOTER
    // =====================================================
    doc.moveDown();

    doc.fontSize(10).text("Cảm ơn quý khách ", { align: "center" });

    doc.end();
  });
};

module.exports = generateInvoice;
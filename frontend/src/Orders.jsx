import { useEffect, useState } from "react";
import axios from "axios";
import "./Orders.css";
import { toast } from "react-toastify";

function Orders() {

  const [reviewModal, setReviewModal] = useState(null);
const [rating, setRating] = useState(0);
const [comment, setComment] = useState("");
const [images, setImages] = useState([]);
  const [orders,setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
// 🔥 FILTER TAB
const [filter, setFilter] = useState("ALL");
  useEffect(()=>{

    const token = localStorage.getItem("token");

    axios.get(
      "http://localhost:5000/api/orders/my-orders",
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    )
    .then(res=>{
      setOrders(res.data);
    });

  },[]);
 const submitReview = async () => {
  try {
    if (rating === 0) {
  toast.error("Vui lòng chọn số sao");
  return;
}
    const token = localStorage.getItem("token");

    const formData = new FormData();

    formData.append("rating", rating);
    formData.append("comment", comment);

    // 🔥 thêm ảnh
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }
    // 🔥 lấy product đầu tiên (có thể cải tiến sau)
    const productId = selectedProduct._id;

    await axios.post(
      `http://localhost:5000/api/products/${productId}/review`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
        
      }
      
    );

    toast.success("Đánh giá thành công");
    // ✅ UPDATE UI NGAY (KHÔNG F5)
    setOrders(prev =>
      prev.map(order => ({
        ...order,
        items: order.items.map(item => {
      if (item.product?._id === selectedProduct._id) {
        return {
          ...item,
          product: {
            ...item.product,
            reviews: [
              ...(item.product.reviews || []),
              {
                user: localStorage.getItem("userId")
              }
            ]
          }
        };
      }
      return item;
    })
  }))
);


    // reset
    setReviewModal(null);
    setComment("");
    setImages([]);
    setRating(5);

  } catch (err) {
  console.log("REVIEW ERROR:", err.response?.data || err);
  toast.error(err.response?.data?.message || "Lỗi đánh giá");
}
};

  
  const handleCancel = async (orderId) => {
  const confirmCancel = window.confirm("Bạn có chắc muốn hủy đơn?");

  if (!confirmCancel) return;

  const token = localStorage.getItem("token");

  try {
    await axios.put(
      `http://localhost:5000/api/orders/${orderId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    toast.success("Đã hủy đơn thành công");

    // reload lại list
    setOrders(prev =>
      prev.map(o =>
        o._id === orderId ? { ...o, status: "CANCELLED" } : o
      )
    );

  } catch (err) {
    toast.error(err.response?.data?.message || "Không thể hủy đơn");
  }
};

  const steps = ["PENDING","CONFIRMED","SHIPPING","DELIVERED"];
const hasReviewed = (product) => {
  if (!product) return false;
  const userId = localStorage.getItem("userId");

  return product.reviews?.some(
    r => r.user?._id === userId || r.user === userId
  );
};
  return(

    <div className="orders-page">

      <h2>Đơn hàng của tôi</h2>
      {/* 🔥 TAB FILTER */}
<div style={{ marginBottom: 20 }}>
  {["ALL","PENDING","CONFIRMED","SHIPPING","DELIVERED","CANCELLED"].map(s => (
    <span
      key={s}
      onClick={() => setFilter(s)}
      style={{
        marginRight: 15,
        cursor: "pointer",
        color: filter === s ? "red" : "black",
        borderBottom: filter === s ? "2px solid red" : "none"
      }}
    >
      {s}
    </span>
  ))}
</div>

      {orders
  .filter(order => filter === "ALL" || order.status === filter)
  .map(order=>{
        const allReviewed = order.items?.every(
  item => item.product && hasReviewed(item.product)
);
        const currentStep = steps.indexOf(order.status);

        return(

          <div className="order-card" key={order._id}>
            {/* 🔥 SHOP + STATUS */}
<div style={{ display: "flex", marginBottom: 10 }}>
  <b>🏪 BaoPhone</b>

  <span style={{ marginLeft: "auto", color: "green" }}>
    {order.status === "DELIVERED" && "Giao hàng thành công"}
    {order.status === "PENDING" && "Chờ xác nhận"}
    {order.status === "SHIPPING" && "Đang giao"}
    {order.status === "CONFIRMED" && "Đã xác nhận"}
    {order.status === "CANCELLED" && "Đã hủy"}
  </span>
</div>

            <div className="order-header">

              <div>
                <b>Mã đơn:</b> {order._id}
              </div>

              <div className="status">
                {
  {
    PENDING: "Chờ xử lý",
    CONFIRMED: "Đã xác nhận",
    SHIPPING: "Đang giao",
    DELIVERED: "Đã giao",
    CANCELLED: "Đã hủy"
  }[order.status]
}
              </div>
              {/* 🔥 PAYMENT STATUS */}
<div style={{ marginTop: 5 }}>
  {order.paymentStatus === "PAID" ? (
    <span style={{ color: "green", fontWeight: "bold" }}>
      ✅ Đã thanh toán
    </span>
  ) : (
    <span style={{ color: "red", fontWeight: "bold" }}>
      ❌ Chưa thanh toán
    </span>
  )}
</div>
            <div className="shipping-info">
  <div><b>Người nhận:</b> {order.shippingInfo?.fullName}</div>
  <div><b>SĐT:</b> {order.shippingInfo?.phone}</div>
  <div><b>Địa chỉ:</b> {order.shippingInfo?.address}</div>
</div>
            </div>

            {/* PRODUCTS */}
{order.items?.map(item => {
  
  return (
    <div key={item._id}>

      <div className="order-item" style={{ display: "flex", gap: 10 }}>
        <img src={`http://localhost:5000/uploads/${item.product?.image}`} style={{ width: 80 }} />

        <div style={{ flex: 1 }}>
          <div>{item.product?.name}</div>
          <div>x{item.quantity}</div>
        </div>

        <div style={{ color: "red" }}>
          {(item.price * item.quantity).toLocaleString()}đ
        </div>
      </div>

      {/* 🔥 BUTTON ĐÚNG CHỖ */}
      {order.status === "DELIVERED" && item.product && (
        item.product && hasReviewed(item.product)? (
          <span style={{ color: "green" }}>✔ Đã đánh giá</span>
        ) : (
          <button onClick={() => {
            if (!item.product) return;
            setReviewModal(order);
            setSelectedProduct(item.product);
            setRating(0);
          }}>
            Đánh giá sản phẩm này
          </button>
        )
      )}

    </div>
  );
})}

            {/* TIMELINE */}

            <div className="timeline">

              {steps.map((step,index)=>{

                const active = index <= currentStep;

                return(

                  <div className="timeline-step" key={step}>

                    <div className={`circle ${active?"active":""}`}>
                      {index+1}
                    </div>

                    <div className={`label ${active?"active":""}`}>
                      {step}
                    </div>

                  </div>

                );

              })}

            </div>

            <div style={{ textAlign: "right", marginTop: 10 }}>
  Tổng tiền: {order.totalAmount.toLocaleString()} đ

  {/* 🔥 PAYMENT TAG */}
  <div>
    {order.paymentStatus === "PAID" ? (
      <span style={{ color: "green" }}>Đã thanh toán</span>
    ) : (
      <span style={{ color: "red" }}>Chưa thanh toán</span>
    )}
  </div>
</div>
{/* 🔥 ACTION BUTTON */}
<div style={{ marginTop: 10, textAlign: "right" }}>

  {/* MUA LẠI */}
  <button
    onClick={() => {
      const items = order.items.map(i => ({
        product: i.product,
        quantity: i.quantity
      }));

      sessionStorage.setItem("checkoutItems", JSON.stringify(items));
      window.location.href = "/checkout";
    }}
  >
    Mua lại
  </button>

  {/* ĐÁNH GIÁ */}
  {order.status === "DELIVERED" && (
  allReviewed ? (
    <span style={{ color: "green" }}>✔ Đã đánh giá</span>
  ) : (
    <>
      <button onClick={() => {
        const firstNotReviewed = order.items.find(
          item => item.product && !hasReviewed(item.product)
        )?.product;

        if (!firstNotReviewed) return;

        setReviewModal(order);
        setSelectedProduct(firstNotReviewed);
        setRating(0);
      }}>
        Đánh giá
      </button>

      <div style={{ color: "#999" }}>Chưa đánh giá</div>
    </>
  )
)}

</div>

{/* 🔥 NÚT HỦY ĐƠN */}
{order.status === "PENDING" && (
  <button
    style={{ background: "red", color: "white", marginTop: 10 }}
    onClick={() => handleCancel(order._id)}
  >
    Hủy đơn
  </button>
)}

          </div>

        )

      })}

      {orders.length===0 &&(
        <div className="no-orders">
          Bạn chưa có đơn hàng nào
        </div>
      )}
{reviewModal && (
  <div className="modal-overlay">

    <div className="modal"
    onClick={(e) => e.stopPropagation()}>

      <h3>Đánh giá sản phẩm</h3>

      {/* ⭐ CHỌN SAO */}
      <div style={{ marginBottom: 10 }}>
  {[1,2,3,4,5].map(star => (
    <span
  key={star}
  onClick={() => setRating(star)}
  style={{
    cursor: "pointer",
    color: star <= rating ? "orange" : "#ccc",
    fontSize: 30
  }}
>
  ★
</span>
  ))}
</div>

      {/* COMMENT */}
      <textarea
        placeholder="Nhập đánh giá..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {/* UPLOAD */}
      <input
        type="file"
        multiple
        onChange={(e) => setImages(Array.from(e.target.files))}
      />

      {/* BUTTON */}
      <div style={{ marginTop: 10 }}>
        <button onClick={submitReview}>Gửi</button>
        <button onClick={() => setReviewModal(null)}>Hủy</button>
      </div>

    </div>

  </div>
)}
    </div>

  )

}

export default Orders;
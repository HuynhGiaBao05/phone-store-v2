import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function IphonePage() {
  const [products, setProducts] = useState([]);

 useEffect(() => {
  fetch("http://localhost:5000/api/products?category=PHONE")
    .then(res => res.json())
    .then(data => {
      setProducts(data);
    })
    .catch(err => console.error(err));
}, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>📱 iPhone Products</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginTop: "30px"
      }}>
        {products.map(product => (
          <div key={product._id} style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px"
          }}>
            <img
              src={product.image}
              alt={product.name}
              style={{ width: "100%", height: "200px", objectFit: "cover" }}
            />
            <h3>{product.name}</h3>
            <p>Giá: {product.price.toLocaleString()}đ</p>
            <p>Còn: {product.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IphonePage;

import { useEffect, useState } from "react";
import axios from "axios";

function TopProducts() {

  const [products, setProducts] = useState([]);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {

    const fetchProducts = async () => {
      try {

        const res = await axios.get(
          "http://localhost:5000/api/orders/top-products",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setProducts(res.data);

      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();

  }, []);

  return (
    <div>
      <h3>🔥 Top Products</h3>

      {products.length === 0 ? (
        <p>Chưa có đơn hàng</p>
      ) : (
        products.map((p, index) => (
          <div key={index} className="top-product-item">

            <span>{p.name}</span>

            <b>{p.sold} sold</b>

          </div>
        ))
      )}
    </div>
  );
}

export default TopProducts;
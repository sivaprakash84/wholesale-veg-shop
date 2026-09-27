import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../api/productApi";
import { useLanguage } from "../i18n/LanguageContext";

function Products() {
  const { t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = [
    {
      value: "All",
      label: t("all"),
    },
    {
      value: "Vegetables",
      label: t("products"),
    },
  ];

  // ===============================
  // LOAD PRODUCTS
  // ===============================
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const data = await getProducts();

        setProducts(data);
        setError("");
      } catch (error) {
        console.error(
          "Failed to load products:",
          error
        );

        setError(
          t("unableToLoadVegetables")
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [t]);


  // ===============================
  // FILTER PRODUCTS
  // ===============================
  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        product.category === category;

      return (
        matchesSearch &&
        matchesCategory &&
        product.isAvailable
      );
    }
  );


  return (
    <div className="page-container">

      {/* ================================= */}
      {/* PAGE HEADER */}
      {/* ================================= */}

      <div className="page-header">

        <p className="section-label">
          {t("wholesaleProducts")}
        </p>

        <h1>
          {t("freshVegetables")}
        </h1>

        <p>
          {t("chooseFreshVegetables")}
        </p>

      </div>


      {/* ================================= */}
      {/* SEARCH + CATEGORY */}
      {/* ================================= */}

      <div className="shop-controls">

        <input
          type="text"
          placeholder={`🔍 ${t("searchVegetables")}`}
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="search-box"
        />


        <div className="category-buttons">

          {categories.map((item) => (
            <button
              key={item.value}
              className={
                category === item.value
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() =>
                setCategory(item.value)
              }
            >
              {item.label}
            </button>
          ))}

        </div>

      </div>


      {/* ================================= */}
      {/* LOADING */}
      {/* ================================= */}

      {loading && (

        <div className="no-products">

          <h2>
            {t("loadingVegetables")}
          </h2>

          <p>
            {t("pleaseWait")}
          </p>

        </div>

      )}


      {/* ================================= */}
      {/* ERROR */}
      {/* ================================= */}

      {error && (

        <div className="no-products">

          <h2>
            ⚠️ {t("somethingWentWrong")}
          </h2>

          <p>
            {error}
          </p>

        </div>

      )}


      {/* ================================= */}
      {/* PRODUCTS */}
      {/* ================================= */}

      {!loading && !error && (

        <>

          <div className="product-result">

            <p>
              {t("showing")}{" "}

              <strong>
                {filteredProducts.length}
              </strong>{" "}

              {t("products")}
            </p>

          </div>


          {filteredProducts.length > 0 ? (

            <div className="product-grid">

              {filteredProducts.map(
                (product) => (

                  <ProductCard
                    key={product._id}
                    product={product}
                  />

                )
              )}

            </div>

          ) : (

            <div className="no-products">

              <div>
                🥕
              </div>

              <h2>
                {t("noVegetablesFound")}
              </h2>

              <p>
                {t("tryAnotherSearch")}
              </p>

            </div>

          )}

        </>

      )}

    </div>
  );
}

export default Products;
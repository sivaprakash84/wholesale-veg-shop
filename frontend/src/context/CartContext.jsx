import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext();

const getProductId = (product) => {
  return product?._id || product?.id;
};

export function CartProvider({ children }) {

  // --------------------------------------------------
  // RESTORE CART FROM LOCAL STORAGE
  // --------------------------------------------------

  const [cart, setCart] = useState(() => {
    try {
      const savedCart =
        localStorage.getItem("wholesaleCart");

      if (!savedCart) {
        return [];
      }

      const parsedCart =
        JSON.parse(savedCart);

      return Array.isArray(parsedCart)
        ? parsedCart
        : [];

    } catch (error) {
      console.error(
        "Failed to restore cart:",
        error
      );

      return [];
    }
  });


  // --------------------------------------------------
  // SAVE CART TO LOCAL STORAGE
  // --------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        "wholesaleCart",
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        "Failed to save cart:",
        error
      );
    }
  }, [cart]);


  // --------------------------------------------------
  // ADD PRODUCT TO CART
  // --------------------------------------------------

  const addToCart = (product) => {
    const productId =
      getProductId(product);

    if (!productId) {
      console.error(
        "Product ID is missing:",
        product
      );

      return;
    }

    setCart((currentCart) => {

      const existingProduct =
        currentCart.find(
          (item) =>
            getProductId(item) ===
            productId
        );

      // Product already exists
      // Increase selling-unit quantity
      if (existingProduct) {
        return currentCart.map(
          (item) =>
            getProductId(item) ===
            productId
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
        );
      }

      // New product
      return [
        ...currentCart,
        {
          ...product,

          // Quantity means selling units
          // Example:
          // 1 Moodai = quantity 1
          // 2 Moodai = quantity 2
          quantity: 1,

          // Keep the admin-defined weight
          // Example:
          // Moodai = 55 kg
          weightPerUnitKg:
            Number(
              product.weightPerUnitKg ||
                1
            ),
        },
      ];
    });
  };


  // --------------------------------------------------
  // INCREASE QUANTITY
  // --------------------------------------------------

  const increaseQuantity = (
    productId
  ) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        getProductId(item) ===
        productId
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  };


  // --------------------------------------------------
  // DECREASE QUANTITY
  // --------------------------------------------------

  const decreaseQuantity = (
    productId
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          getProductId(item) ===
          productId
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  };


  // --------------------------------------------------
  // REMOVE PRODUCT
  // --------------------------------------------------

  const removeFromCart = (
    productId
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          getProductId(item) !==
          productId
      )
    );
  };


  // --------------------------------------------------
  // CLEAR CART
  // --------------------------------------------------

  const clearCart = () => {
    setCart([]);
  };


  // --------------------------------------------------
  // TOTAL PRICE
  // --------------------------------------------------
  // Price is the price of ONE selling unit.
  //
  // Example:
  // ₹1,485 / Moodai
  //
  // 2 Moodai:
  // ₹1,485 × 2 = ₹2,970
  // --------------------------------------------------

  const cartTotal =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.price || 0
        ) *
          Number(
            item.quantity || 0
          ),
      0
    );


  // --------------------------------------------------
  // TOTAL WEIGHT
  // --------------------------------------------------
  // Example:
  //
  // 1 Moodai × 55 kg = 55 kg
  // 2 Moodai × 55 kg = 110 kg
  //
  // Used for delivery vehicle selection.
  // --------------------------------------------------

  const cartTotalWeight =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.weightPerUnitKg ||
            1
        ) *
          Number(
            item.quantity || 0
          ),
      0
    );


  // --------------------------------------------------
  // TOTAL NUMBER OF SELLING UNITS
  // --------------------------------------------------

  const cartUnitCount =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );


  // --------------------------------------------------
  // NUMBER OF DIFFERENT VEGETABLES
  // --------------------------------------------------

  const cartCount =
    cart.length;


  return (
    <CartContext.Provider
      value={{
        cart,

        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,

        // Price
        cartTotal,

        // Weight
        cartTotalWeight,

        // Total Moodai/Bag/Box/etc. quantity
        cartUnitCount,

        // Number of different products
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}


export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
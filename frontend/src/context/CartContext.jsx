import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();
const CART_STORAGE_KEY = 'mypick-commerce-cart';
const SESSION_STORAGE_KEY = 'sessionId';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

function readStoredCart() {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = rawCart ? JSON.parse(rawCart) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readOrCreateSessionId() {
  let sid = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sid);
  }
  return sid;
}

function parseJsonList(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getCartLineId(productId, color) {
  return `${productId}:${color || 'default'}`;
}

function normalizeCartItem(product, quantity, color) {
  const selectedColor = color || parseJsonList(product.colors)[0] || null;
  const productId = String(product.id);

  return {
    id: getCartLineId(productId, selectedColor),
    product_id: productId,
    name: product.name,
    price: Number(product.price) || 0,
    quantity,
    color: selectedColor,
    image_url: product.image_url || null,
    stock: Number(product.stock) || 0,
    sku: product.sku || null,
  };
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => readStoredCart());
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(readOrCreateSessionId());
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, color = null) => {
    const nextQuantity = Number(quantity) || 1;
    const cartItem = normalizeCartItem(product, nextQuantity, color);

    if (!cartItem.product_id) {
      alert('Sản phẩm không hợp lệ.');
      return false;
    }

    if (cartItem.stock <= 0) {
      alert('Sản phẩm đã hết hàng.');
      return false;
    }

    const existingItem = cartItems.find((item) => item.id === cartItem.id);
    if (!existingItem) {
      if (nextQuantity > cartItem.stock) {
        alert(`Chỉ còn ${cartItem.stock} sản phẩm trong kho.`);
        return false;
      }

      setCartItems((currentItems) => [...currentItems, cartItem]);
      return true;
    }

    const mergedQuantity = existingItem.quantity + nextQuantity;
    if (mergedQuantity > existingItem.stock) {
      alert(`Chỉ còn ${existingItem.stock} sản phẩm trong kho.`);
      return false;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === cartItem.id ? { ...item, quantity: mergedQuantity } : item
      )
    );
    return true;
  };

  const updateQuantity = (itemId, quantity) => {
    const nextQuantity = Number(quantity);
    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (nextQuantity > item.stock) {
          alert(`Chỉ còn ${item.stock} sản phẩm trong kho.`);
          return item;
        }

        return { ...item, quantity: nextQuantity };
      })
    );
  };

  const removeFromCart = (itemId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        sessionId,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

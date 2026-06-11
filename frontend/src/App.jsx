import './App.css';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Footer from './components/Footer';
import Header from './components/Header';
import Cart from './pages/customers/Cart';
import Checkout from './pages/customers/Checkout';
import Home from './pages/customers/Home';
import OrderComplete from './pages/customers/OrderComplete';
import { POS } from './pages/customers/POS';
import ProductDetail from './pages/customers/ProductDetail';
import Shop from './pages/customers/Shop';

function App() {
  const location = useLocation();
  const isPos = location.pathname === '/pos';

  return (
    <div className="app">
      {!isPos && <Header />}
      <main className={`main-content ${isPos ? 'main-content--admin' : ''}`}>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-complete/:orderCode" element={<OrderComplete />} />
          <Route path="/pos" element={<POS />} />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </main>
      {!isPos && <Footer />}
    </div>
  );
}

export default App;

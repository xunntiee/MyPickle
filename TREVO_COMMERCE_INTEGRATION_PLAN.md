# MyPick Commerce to Trevo Integration Plan

This document is the implementation brief for migrating the commerce surface of MyPick to Trevo. The goal is to make Trevo the source of truth for products, categories, stock, commerce customers, and orders while keeping the MyPick user experience and storefront/POS screens.

Out of scope: court booking, event tickets, shifts, employees, internal account management, and other pickleball-specific operations. Those domains can continue to use the existing MyPick database until a separate migration is planned.

## 1. Target Outcome

- MyPick keeps its commerce UI: shop, product detail, cart, checkout, POS, order complete.
- Trevo owns commerce data: products, categories, inventory, customers, and orders.
- MyPick backend becomes a backend-for-frontend bridge that calls Trevo.
- MyPick frontend never stores or sends the Trevo API key directly.
- Existing MyPick frontend changes should be minimized by mapping Trevo responses into the current MyPick data shape.

## 2. Target Architecture

```text
MyPick Frontend
  -> MyPick Backend /api/client/*
  -> Trevo External API
  -> MyPick Backend maps response shape
  -> MyPick Frontend renders existing UI
```

Checkout and POS:

```text
MyPick Cart or POS
  -> POST /api/client/orders
  -> MyPick Backend validates and maps payload
  -> Trevo creates the order
  -> Trevo handles stock and payment-related state
  -> MyPick displays order completion
```

## 3. Source of Truth Rules

Trevo becomes the source of truth for:

- Products
- Categories
- Inventory/stock
- Commerce customers
- Product orders
- POS product sales

MyPick local database should no longer be used for:

- Product catalog reads
- Product/category writes
- Product stock checks
- Product stock decrement
- Product order creation
- Product order item creation
- Backend cart persistence

MyPick local database may still be used for non-commerce domains that are explicitly out of scope.

## 4. Environment Variables

Add these to `D:\MyPick\backend\.env`:

```env
TREVO_API_URL=https://api.trevo.studio/api/external
TREVO_API_KEY=trv_xxx
TREVO_ORIGIN=https://mypick.example.com
TREVO_CATALOG_FETCH_LIMIT=100
```

Notes:

- `TREVO_API_KEY` must be generated inside Trevo for the target MyPick organization.
- `TREVO_API_URL` points to Trevo external API, not the internal dashboard API.
- `TREVO_ORIGIN` is only needed if the Trevo API key has allowed origin restrictions. It must match exactly.
- `TREVO_CATALOG_FETCH_LIMIT` controls the maximum Trevo product window that MyPick fetches for local filtering/sorting. Trevo caps this at 100 per request.
- MyPick does not need `TREVO_ORG_SLUG` for server-to-server integration. Trevo resolves the organization from the API key.
- The frontend should only use `VITE_API_URL` pointing to the MyPick backend.
- Do not add `TREVO_API_KEY` to frontend `.env` files.

## 5. Backend Bridge Layer

Create:

- `backend/lib/trevo-client.js`
- `backend/lib/trevo-mapper.js`

`trevo-client.js` responsibilities:

- Centralize all Trevo HTTP calls.
- Attach `x-api-key`.
- Attach `Origin` if required by Trevo.
- Normalize Trevo errors.
- Provide small client methods:
  - `listProducts(params)`
  - `getProduct(id)`
  - `listCategories()`
  - `createOrder(payload)`
  - `getOrder(idOrCode)`
  - `listOrders(params)`

`trevo-mapper.js` responsibilities:

- Convert Trevo response objects into the MyPick frontend's current data shape.
- Convert MyPick checkout/POS payloads into Trevo order payloads.
- Keep field mapping isolated so frontend refactors can be incremental.

## 6. Product Mapping

Trevo product to MyPick product:

```js
{
  id: product.id,
  name: product.name,
  description: product.description || product.shortDescription || "",
  price: product.currentSellingPrice ?? product.salePrice,
  original_price: product.listPrice,
  image_url: product.imageUrl,
  stock: product.availableStock ?? product.currentStock ?? 0,
  category_name: product.categoryName,
  category_slug: slugify(product.categoryName),
  sku: product.sku,
  is_new: false,
  rating: 5,
  reviews_count: 0,
}
```

Important compatibility notes:

- MyPick currently expects `price`, `image_url`, `stock`, `category_name`, and `category_slug`.
- Trevo product IDs are strings/UUIDs. Do not parse them as numbers.
- If MyPick needs prettier product URLs later, introduce `sku` or a generated slug separately.

## 7. Order Mapping

MyPick order payload to Trevo order payload:

```js
{
  recipientName: fullName,
  recipientPhone: phone,
  recipientAddress: address,
  notes,
  paymentMethod,
  items: [
    {
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: item.price,
    },
  ],
}
```

Trevo order response to MyPick order response:

```js
{
  success: true,
  message: "Order created successfully",
  orderCode: trevoOrder.orderNumber || trevoOrder.id,
  order: trevoOrder,
}
```

## 8. Backend Routes to Refactor

### Products

Target files:

- `backend/api/client/products/getAllProducts.js`
- `backend/api/client/products/getProductById.js`
- `backend/api/client/products/getFeaturedNewArrivals.js`
- `backend/api/client/products/getFeaturedOnSale.js`

Migration rule:

- Replace MySQL queries with Trevo calls.
- Return the existing MyPick response shape.

Expected list response:

```js
{
  products,
  totalCount
}
```

Query support:

- `search`
- `category`
- `page`
- `limit`
- `sort`
- `status`
- `minPrice`
- `maxPrice`

If Trevo does not support a filter directly, apply it in the MyPick backend after fetching a reasonable page/window. Keep this explicit and easy to remove later.

### Categories

Target files:

- `backend/api/client/categories/getAllCategories.js`
- `backend/api/client/categories/getCategoryBySlug.js`

Migration rule:

- Replace MySQL category queries with Trevo category calls.
- Generate stable slugs from category names if Trevo does not provide slugs.

### Orders

Target files:

- `backend/api/client/orders/postOrder.js`
- `backend/api/client/orders/getOrderByCode.js`
- `backend/api/client/orders/getOrderHistory.js`
- `backend/api/client/orders/getOrdersByCustomerId.js`

Migration rule:

- `postOrder.js` must stop inserting into local `orders`.
- `postOrder.js` must stop inserting into local `order_items`.
- `postOrder.js` must stop decrementing local product stock.
- Create the order in Trevo instead.

### Cart

Target files:

- `backend/api/client/cart/*`
- `frontend/src/context/CartContext.jsx`

Recommended direction:

- Remove backend cart persistence from the commerce flow.
- Store cart state in browser localStorage.
- Only create a real order when the user submits checkout.

## 9. Frontend Refactor Points

### Shop

Target file:

- `frontend/src/pages/customers/Shop.jsx`

Keep API calls to:

- `GET /api/client/categories`
- `GET /api/client/products`

If backend mapping is correct, this component should require minimal changes.

### Product Detail

Target file:

- `frontend/src/pages/customers/ProductDetail.jsx`

Required changes:

- Treat product `id` as a string.
- Avoid `parseInt(id)`.
- Use `[image_url]` as fallback if the product does not have an `images` array.
- Keep related product lookup through mapped `category_slug`.

### Cart

Target file:

- `frontend/src/context/CartContext.jsx`

Required changes:

- Replace backend cart calls with localStorage.
- Keep the exposed context API stable:
  - `cartItems`
  - `addToCart`
  - `updateQuantity`
  - `removeFromCart`
  - `clearCart`
  - `getCartTotal`
  - `getCartCount`

### Checkout

Target file:

- `frontend/src/pages/customers/Checkout.jsx`

Required changes:

- Ensure `item.product_id` is the Trevo product ID.
- Submit the current MyPick order payload to `POST /api/client/orders`.
- Let the backend map to Trevo.
- Navigate with the returned Trevo order number/id.

### POS

Target file:

- `frontend/src/pages/customers/POS.jsx`

Required changes:

- Fetch products from `GET /api/client/products`, not `GET /api/admin/products`.
- Use mapped `stock`.
- Create POS order through `POST /api/client/orders`.
- Send `orderType: "pos"` or equivalent metadata if Trevo supports it.

## 10. Admin Commerce Decision

If Trevo owns commerce, MyPick admin commerce should not keep editing local products/categories/orders.

Recommended first version:

- Hide or disable MyPick local product/category/order CRUD.
- Add a link or notice that commerce is managed in Trevo.

Alternative:

- Convert admin commerce pages to read-only Trevo dashboards.

Avoid:

- Editing local products while public shop reads Trevo products.
- Creating orders locally while POS/checkout also creates Trevo orders.

## 11. Implementation Order

1. Add backend env variables. Status: ready, needs local/prod `.env` values.
2. Create `backend/lib/trevo-client.js`. Status: done.
3. Create `backend/lib/trevo-mapper.js`. Status: done.
4. Refactor `GET /api/client/categories`. Status: done.
5. Refactor `GET /api/client/products`. Status: done.
6. Verify `/shop` renders Trevo products. Status: pending runtime env.
7. Refactor `GET /api/client/products/:id`. Status: done.
8. Verify `/product/:id`.
9. Move cart state to localStorage. Status: done.
10. Refactor `POST /api/client/orders`. Status: done.
11. Verify `/checkout`. Status: build verified, runtime env still required.
12. Refactor POS product fetch and order creation. Status: done for product fetch + order creation path.
13. Disable or redirect MyPick admin commerce mutations. Status: done for product/category/order mutation paths; admin order UI is read-only.
14. Remove or archive unused backend cart and local commerce endpoints.

## 12. Risks to Watch

- Product IDs change from numeric IDs to Trevo string IDs.
- Old cart items may contain local product IDs and should be cleared after migration.
- Local product images may not be publicly reachable once products come from Trevo.
- Local stock decrement must be removed to avoid double inventory logic.
- Existing order history pages may expect local order codes.
- Admin pages may still mutate local commerce tables unless explicitly disabled.
- Trevo API key origin restrictions can break server calls if `TREVO_ORIGIN` is not configured correctly.

## 13. Verification Checklist

Shop:

- `/shop` shows Trevo products.
- Category filter works.
- Search works.
- Sort does not crash.
- Pagination does not crash.

Product detail:

- `/product/:id` opens with a Trevo product ID.
- Product image, price, stock, category, and description render correctly.
- Add to cart works.

Cart:

- Cart survives page refresh.
- Quantity update works.
- Remove item works.
- Clear cart works.

Checkout:

- Order is created in Trevo.
- MyPick local `orders` and `order_items` are not written for product checkout.
- Trevo stock changes correctly.
- Order complete page can display the created order.

POS:

- POS reads products from Trevo.
- POS prevents selling above mapped stock.
- POS creates Trevo orders.

Known remaining work:

- Runtime verification still needs real `TREVO_API_URL`, `TREVO_API_KEY`, and optional `TREVO_ORIGIN` in `backend/.env`.
- Admin order UI is read-only, but labels/tabs can be polished later to use Trevo-native wording instead of legacy MyPick status names.
- Backend `/api/client/cart/*` files are now unused by the storefront cart and can be archived after runtime verification.
- Cart items created before this migration may contain local numeric product IDs. Ask users to clear cart once after switching to Trevo.

Admin commerce:

- Product/category CRUD is disabled in the MyPick admin UI and should be managed in Trevo.
- Admin order listing reads from Trevo and displays read-only status badges.
- Admin order status update, bulk status update, and delete routes return `409` to prevent local DB divergence.

## 14. Final Decision

For the commerce scope:

- Source of truth: Trevo.
- MyPick backend role: bridge/BFF.
- MyPick frontend role: custom commerce UI.
- Cart storage: frontend localStorage.
- Local MyPick database: not used for commerce after migration.
- API key location: backend only.

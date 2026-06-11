export function slugify(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function pickImageUrl(entity) {
    return entity?.imageUrl || entity?.image_url || entity?.logo || null;
}

function pickDescription(entity) {
    return entity?.description || entity?.shortDescription || entity?.short_description || '';
}

export function buildCategoryMaps(categories = []) {
    const mappedCategories = categories.map(mapTrevoCategory);
    const byId = new Map();
    const bySlug = new Map();

    mappedCategories.forEach((category) => {
        byId.set(category.id, category);
        bySlug.set(category.slug, category);
    });

    return { mappedCategories, byId, bySlug };
}

export function mapTrevoCategory(category) {
    const name = category?.name || 'Uncategorized';
    const slug = category?.slug || slugify(name);

    return {
        id: String(category?.id ?? slug),
        name,
        slug,
        description: category?.description || '',
        image_url: pickImageUrl(category),
        created_at: category?.createdAt || category?.created_at || null,
        updated_at: category?.updatedAt || category?.updated_at || null,
    };
}

export function mapTrevoProduct(product, categoryById = new Map()) {
    const category = product?.categoryId ? categoryById.get(product.categoryId) : null;
    const categoryName = product?.categoryName || category?.name || product?.category || 'Uncategorized';
    const categorySlug = product?.categorySlug || category?.slug || slugify(categoryName);
    const price = toNumber(product?.currentSellingPrice ?? product?.salePrice ?? product?.price);
    const listPrice = toNumber(product?.listPrice ?? product?.originalPrice ?? product?.original_price ?? price, price);
    const originalPrice = listPrice > price ? listPrice : null;
    const stock = toNumber(product?.availableStock ?? product?.currentStock ?? product?.stock);
    const imageUrl = pickImageUrl(product);
    const createdAt = product?.createdAt || product?.created_at || null;
    const discountPercent = originalPrice
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    return {
        id: String(product?.id ?? ''),
        name: product?.name || '',
        description: pickDescription(product),
        short_description: product?.shortDescription || product?.short_description || pickDescription(product),
        price,
        original_price: originalPrice,
        image_url: imageUrl,
        images: imageUrl ? JSON.stringify([imageUrl]) : null,
        stock,
        category_id: product?.categoryId || category?.id || null,
        category: categoryName,
        category_name: categoryName,
        category_slug: categorySlug,
        sku: product?.sku || null,
        barcode: product?.barcode || null,
        unit: product?.unit || null,
        is_new: Boolean(product?.isFeatured),
        is_active: product?.isActive ?? true,
        discount_percent: discountPercent,
        rating: toNumber(product?.rating, 5),
        reviews_count: toNumber(product?.reviewsCount ?? product?.reviews_count),
        total_sold: toNumber(product?.totalSold ?? product?.total_sold),
        created_at: createdAt,
        updated_at: product?.updatedAt || product?.updated_at || null,
    };
}

export function applyMyPickProductFilters(products, filters = {}) {
    const search = String(filters.search ?? '').trim().toLowerCase();
    const category = String(filters.category ?? '').trim();
    const minPrice = filters.minPrice !== undefined && filters.minPrice !== ''
        ? Number(filters.minPrice)
        : null;
    const maxPrice = filters.maxPrice !== undefined && filters.maxPrice !== ''
        ? Number(filters.maxPrice)
        : null;

    return products.filter((product) => {
        if (category && product.category_slug !== category) {
            return false;
        }

        if (search) {
            const haystack = [
                product.name,
                product.description,
                product.short_description,
                product.sku,
                product.category_name,
            ].join(' ').toLowerCase();
            if (!haystack.includes(search)) {
                return false;
            }
        }

        if (minPrice !== null && product.price < minPrice) {
            return false;
        }

        if (maxPrice !== null && product.price > maxPrice) {
            return false;
        }

        if (filters.status === 'new' && !product.is_new) {
            return false;
        }

        if (filters.status === 'sale' && !(product.original_price && product.price < product.original_price)) {
            return false;
        }

        return true;
    });
}

export function sortMyPickProducts(products, sort) {
    const sorted = [...products];

    sorted.sort((a, b) => {
        if (sort === 'best_selling') {
            return b.total_sold - a.total_sold || a.name.localeCompare(b.name);
        }
        if (sort === 'price_asc') {
            return a.price - b.price;
        }
        if (sort === 'price_desc') {
            return b.price - a.price;
        }
        if (sort === 'name_asc') {
            return a.name.localeCompare(b.name);
        }
        if (sort === 'name_desc') {
            return b.name.localeCompare(a.name);
        }
        if (sort === 'newest') {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }

        return a.category_name.localeCompare(b.category_name) || a.name.localeCompare(b.name);
    });

    return sorted;
}

export function paginate(items, page = 1, limit = 12) {
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 12;
    const offset = (safePage - 1) * safeLimit;

    return items.slice(offset, offset + safeLimit);
}

function normalizePaymentMethod(value) {
    const method = String(value ?? '').trim().toLowerCase();
    if (!method || method === 'cod') {
        return 'cod';
    }
    if (method.includes('ti') || method.includes('cash')) {
        return 'cash';
    }
    if (method.includes('kho') || method.includes('bank')) {
        return 'bank_transfer';
    }

    return method;
}

export function mapMyPickOrderToTrevo(payload) {
    const customer = payload?.customer || {};
    const orderType = payload?.orderType || 'online';
    const recipientName = customer.name || payload?.fullName;
    const recipientPhone = customer.phone || payload?.phone;
    const recipientAddress = customer.address || payload?.address;
    const items = Array.isArray(payload?.items) ? payload.items : [];

    return {
        customerId: payload?.trevoCustomerId || payload?.customer?.trevoCustomerId || undefined,
        paymentMethod: normalizePaymentMethod(payload?.paymentMethod),
        paymentStatus: orderType === 'pos' ? 'paid' : 'pending',
        shippingStatus: orderType === 'pos' ? 'completed' : 'pending',
        shippingFee: toNumber(payload?.shippingCost),
        notes: payload?.notes || null,
        recipientName: recipientName || null,
        recipientPhone: recipientPhone || null,
        recipientAddress: recipientAddress || null,
        items: items.map((item) => ({
            productId: String(item.product_id || item.productId || item.id || ''),
            quantity: toNumber(item.quantity, 1),
            unitPrice: toNumber(item.price ?? item.unitPrice),
        })),
    };
}

export function extractMyPickCustomerIdentity(payload) {
    const customer = payload?.customer || {};
    const name = customer.name || payload?.fullName || payload?.customerName || '';
    const phone = customer.phone || payload?.phone || '';
    const email = customer.email || payload?.email || '';
    const address = customer.address || payload?.address || '';

    return {
        name: String(name || '').trim(),
        phone: String(phone || '').trim() || null,
        email: String(email || '').trim() || null,
        address: String(address || '').trim() || null,
    };
}

export function buildTrevoCustomerPayload(identity) {
    return {
        name: identity.name,
        customerType: 'retail',
        phone: identity.phone,
        email: identity.email,
        address: identity.address,
        notes: 'Created from MyPick commerce bridge',
    };
}

export function validateTrevoOrderPayload(orderPayload) {
    if (!orderPayload.recipientName) {
        return 'Customer name is required.';
    }

    if (!orderPayload.recipientPhone) {
        return 'Customer phone is required.';
    }

    if (!orderPayload.items.length) {
        return 'Order must have at least one item.';
    }

    const invalidItem = orderPayload.items.find((item) => !item.productId || item.quantity < 1);
    if (invalidItem) {
        return 'Order contains an invalid product item.';
    }

    return null;
}

export function mapTrevoOrderToMyPick(order) {
    const deliveryInfo = order?.deliveryInfo || {};
    const customer = order?.customer || {};
    const items = Array.isArray(order?.items) ? order.items : [];

    return {
        id: order?.id,
        order_code: order?.orderNumber || order?.id,
        orderCode: order?.orderNumber || order?.id,
        customer_id: order?.customerId || null,
        customer_name: deliveryInfo.recipientName || customer.name || '',
        customer_email: customer.email || '',
        customer_phone: deliveryInfo.recipientPhone || customer.phone || '',
        shipping_address: deliveryInfo.recipientAddress || customer.address || '',
        notes: order?.notes || '',
        payment_method: order?.paymentMethod || '',
        payment_status: order?.paymentStatus || '',
        shipping_status: order?.shippingStatus || '',
        order_type: order?.salesChannel === 'external_api' ? 'online' : 'pos',
        source: order?.source || '',
        sales_channel: order?.salesChannel || '',
        total_amount: toNumber(order?.total),
        subtotal: toNumber(order?.subtotal),
        shipping_cost: toNumber(order?.shippingFee),
        status: order?.status || '',
        created_at: order?.createdAt || order?.created_at || null,
        updated_at: order?.updatedAt || order?.updated_at || null,
        items: items.map((item) => ({
            id: item.id,
            order_id: item.orderId || order?.id,
            product_id: item.productId,
            quantity: toNumber(item.quantity, 1),
            price: toNumber(item.unitPrice ?? item.sellingPrice),
            color: null,
            product_name: item.productName,
            name: item.productName,
            image_url: item.productImageUrl || null,
        })),
        trevo_order: order,
    };
}

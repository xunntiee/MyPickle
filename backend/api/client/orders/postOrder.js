import express from 'express';
import {
    createTrevoCustomer,
    createTrevoOrder,
    listTrevoCustomers,
    TrevoApiError,
} from '../../../lib/trevo-client.js';
import {
    buildTrevoCustomerPayload,
    extractMyPickCustomerIdentity,
    mapMyPickOrderToTrevo,
    mapTrevoOrderToMyPick,
    validateTrevoOrderPayload,
} from '../../../lib/trevo-mapper.js';

const router = express.Router();

async function findTrevoCustomer(identity) {
    const searchTerms = [identity.phone, identity.email].filter(Boolean);

    for (const search of searchTerms) {
        const response = await listTrevoCustomers({ search, page: 1, limit: 20 });
        const match = response.customers.find((customer) => {
            const samePhone = identity.phone && customer.phone === identity.phone;
            const sameEmail = identity.email && customer.email === identity.email;
            return samePhone || sameEmail;
        });

        if (match) {
            return match;
        }
    }

    return null;
}

async function resolveTrevoCustomer(payload) {
    const identity = extractMyPickCustomerIdentity(payload);
    if (!identity.name || (!identity.phone && !identity.email)) {
        return null;
    }

    const existingCustomer = await findTrevoCustomer(identity);
    if (existingCustomer) {
        return existingCustomer;
    }

    return createTrevoCustomer(buildTrevoCustomerPayload(identity));
}

router.post('/', async (req, res) => {
    try {
        const trevoPayload = mapMyPickOrderToTrevo(req.body);
        const validationError = validateTrevoOrderPayload(trevoPayload);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const customer = await resolveTrevoCustomer(req.body);
        if (customer?.id) {
            trevoPayload.customerId = customer.id;
        }

        const createdOrder = await createTrevoOrder(trevoPayload);
        const mappedOrder = mapTrevoOrderToMyPick(createdOrder);

        res.status(201).json({
            success: true,
            message: 'Order created successfully in Trevo.',
            orderCode: createdOrder?.id,
            orderNumber: createdOrder?.orderNumber,
            order: mappedOrder,
        });
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error('Error creating Trevo order:', error);
        res.status(500).json({ error: 'Unable to create order in Trevo.' });
    }
});

export default router;

import 'dotenv/config';
import { db } from './config/db.js';

async function updateImageUrls() {
    try {
        console.log('Starting image URL migration...');

        // Update categories table
        console.log('Updating categories...');
        const [categories] = await db.query('SELECT id, image_url FROM categories WHERE image_url LIKE "http://localhost:3000/%"');

        for (const category of categories) {
            const relativeUrl = category.image_url.replace('http://localhost:3000', '');
            await db.query('UPDATE categories SET image_url = ? WHERE id = ?', [relativeUrl, category.id]);
            console.log(`Updated category ${category.id}: ${category.image_url} -> ${relativeUrl}`);
        }

        // Update products table
        console.log('Updating products...');
        const [products] = await db.query('SELECT id, image_url FROM products WHERE image_url LIKE "http://localhost:3000/%"');

        for (const product of products) {
            const relativeUrl = product.image_url.replace('http://localhost:3000', '');
            await db.query('UPDATE products SET image_url = ? WHERE id = ?', [relativeUrl, product.id]);
            console.log(`Updated product ${product.id}: ${product.image_url} -> ${relativeUrl}`);
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

updateImageUrls();

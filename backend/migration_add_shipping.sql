-- Migration to add shipping_method and shipping_cost columns to orders table
ALTER TABLE orders ADD COLUMN shipping_method VARCHAR(50) DEFAULT 'standard';
ALTER TABLE orders ADD COLUMN shipping_cost INT DEFAULT 0;

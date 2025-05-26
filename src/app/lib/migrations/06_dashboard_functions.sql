-- Function to count orders by status
CREATE OR REPLACE FUNCTION count_orders_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY 
  SELECT o.status, COUNT(*) as count
  FROM orders o
  GROUP BY o.status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_selling_products(limit_count INT DEFAULT 5)
RETURNS TABLE(
  product_id UUID, 
  product_name TEXT, 
  total_quantity NUMERIC
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    oi.product_id, 
    p.name_en as product_name, 
    SUM(oi.quantity) as total_quantity
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  GROUP BY oi.product_id, p.name_en
  ORDER BY total_quantity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql; 
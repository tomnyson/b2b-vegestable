-- Create a function to get product order summary
CREATE OR REPLACE FUNCTION get_product_order_summary(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  unit TEXT,
  sku TEXT,
  total_quantity NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      p.id,
      p.name_en,
      p.unit,
      p.sku,
      SUM(oi.quantity) AS total_quantity
    FROM 
      products p
    JOIN 
      order_items oi ON p.id = oi.product_id
    JOIN 
      orders o ON oi.order_id = o.id
    WHERE 
      o.order_date >= start_date::timestamp AND 
      o.order_date <= (end_date::timestamp + interval '1 day' - interval '1 second') AND
      (o.status = 'pending' OR o.status = 'processing')
    GROUP BY 
      p.id, p.name_en, p.unit, p.sku
    ORDER BY 
      p.name_en;
END;
$$; 
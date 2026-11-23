-- =====================================================================
-- Datos de demostración
--
-- Reinicia categorias, productos y movimientos con datos de ejemplo.
-- NO toca la tabla usuarios.
--
-- Requisito: deben existir las cuentas admin@demo.test y
-- empleado@demo.test (créalas desde la pantalla de registro de la app
-- y convierte la primera en admin con un UPDATE).
--
-- Se puede ejecutar las veces que haga falta para restaurar la demo.
-- ATENCIÓN: borra todos los productos, categorías y movimientos
-- existentes. No lo ejecutes sobre una base de datos con datos reales.
-- =====================================================================

BEGIN;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM usuarios
        WHERE email IN ('admin@demo.test', 'empleado@demo.test')) < 2 THEN
        RAISE EXCEPTION 'Faltan las cuentas admin@demo.test y/o empleado@demo.test. Créalas primero desde la app.';
    END IF;
END $$;

TRUNCATE movimientos, productos, categorias RESTART IDENTITY;

INSERT INTO categorias (nombre) VALUES
    ('Bebidas'),
    ('Aseo'),
    ('Snacks'),
    ('Lácteos'),
    ('Papelería');

-- Los productos nacen con stock 0: el stock se calcula más abajo
-- a partir de los movimientos, igual que en la aplicación.
INSERT INTO productos (nombre, categoria_id, precio, stock, stock_minimo)
SELECT v.nombre, c.id, v.precio, 0, v.stock_minimo
FROM (VALUES
    ('Gaseosa 1.5L',          'Bebidas',   4500, 10),
    ('Agua 600ml',            'Bebidas',   2000, 20),
    ('Jugo de naranja 1L',    'Bebidas',   6500,  8),
    ('Jabón líquido 500ml',   'Aseo',      8900, 10),
    ('Detergente 1kg',        'Aseo',     12500,  5),
    ('Papel higiénico x4',    'Aseo',      9800, 12),
    ('Papas fritas 150g',     'Snacks',    3500, 10),
    ('Galletas de vainilla',  'Snacks',    2800, 15),
    ('Leche entera 1L',       'Lácteos',   4200,  6),
    ('Cuaderno rayado',       'Papelería', 5500,  8)
) AS v(nombre, categoria, precio, stock_minimo)
JOIN categorias c ON c.nombre = v.categoria;

-- Entradas registradas por el admin y salidas registradas por el empleado.
INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, nota, fecha)
SELECT p.id, u.id, v.tipo, v.cantidad, v.nota, NOW() - v.hace
FROM (VALUES
    ('Gaseosa 1.5L',         'admin@demo.test',    'entrada', 40, 'Compra inicial',  INTERVAL '7 days'),
    ('Agua 600ml',           'admin@demo.test',    'entrada', 60, 'Compra inicial',  INTERVAL '7 days'),
    ('Jugo de naranja 1L',   'admin@demo.test',    'entrada', 24, 'Compra inicial',  INTERVAL '7 days'),
    ('Jabón líquido 500ml',  'admin@demo.test',    'entrada', 30, 'Compra inicial',  INTERVAL '7 days'),
    ('Detergente 1kg',       'admin@demo.test',    'entrada', 15, 'Compra inicial',  INTERVAL '7 days'),
    ('Papel higiénico x4',   'admin@demo.test',    'entrada', 50, 'Compra inicial',  INTERVAL '7 days'),
    ('Papas fritas 150g',    'admin@demo.test',    'entrada', 30, 'Compra inicial',  INTERVAL '7 days'),
    ('Galletas de vainilla', 'admin@demo.test',    'entrada', 45, 'Compra inicial',  INTERVAL '7 days'),
    ('Leche entera 1L',      'admin@demo.test',    'entrada', 36, 'Compra inicial',  INTERVAL '7 days'),
    ('Cuaderno rayado',      'admin@demo.test',    'entrada', 20, 'Compra inicial',  INTERVAL '7 days'),

    ('Gaseosa 1.5L',         'empleado@demo.test', 'salida',  12, 'Venta mostrador', INTERVAL '5 days'),
    ('Agua 600ml',           'empleado@demo.test', 'salida',  25, 'Venta mostrador', INTERVAL '5 days'),
    ('Cuaderno rayado',      'empleado@demo.test', 'salida',   6, 'Venta mostrador', INTERVAL '5 days'),
    ('Jugo de naranja 1L',   'empleado@demo.test', 'salida',   6, 'Venta mostrador', INTERVAL '4 days'),
    ('Detergente 1kg',       'empleado@demo.test', 'salida',  10, 'Venta mostrador', INTERVAL '4 days'),
    ('Leche entera 1L',      'empleado@demo.test', 'salida',  14, 'Venta mostrador', INTERVAL '4 days'),
    ('Jabón líquido 500ml',  'empleado@demo.test', 'salida',   8, 'Venta mostrador', INTERVAL '3 days'),
    ('Papel higiénico x4',   'empleado@demo.test', 'salida',  20, 'Venta mostrador', INTERVAL '3 days'),
    ('Galletas de vainilla', 'empleado@demo.test', 'salida',  12, 'Venta mostrador', INTERVAL '3 days'),
    ('Gaseosa 1.5L',         'empleado@demo.test', 'salida',  15, 'Venta mostrador', INTERVAL '2 days'),
    ('Papel higiénico x4',   'empleado@demo.test', 'salida',  14, 'Venta mostrador', INTERVAL '2 days'),
    ('Papas fritas 150g',    'empleado@demo.test', 'salida',  22, 'Venta mostrador', INTERVAL '2 days'),
    ('Agua 600ml',           'empleado@demo.test', 'salida',  18, 'Venta mostrador', INTERVAL '1 day'),
    ('Detergente 1kg',       'empleado@demo.test', 'salida',   5, 'Venta mostrador', INTERVAL '1 day'),
    ('Leche entera 1L',      'empleado@demo.test', 'salida',  10, 'Venta mostrador', INTERVAL '1 day')
) AS v(producto, email, tipo, cantidad, nota, hace)
JOIN productos p ON p.nombre = v.producto
JOIN usuarios u ON u.email = v.email;

-- Stock actual = entradas - salidas.
UPDATE productos p
SET stock = COALESCE((
    SELECT SUM(CASE WHEN m.tipo = 'entrada' THEN m.cantidad ELSE -m.cantidad END)
    FROM movimientos m
    WHERE m.producto_id = p.id
), 0);

COMMIT;

-- Comprobación: deben quedar 10 productos y 3 con stock bajo
-- (Agua 600ml, Detergente 1kg y Papas fritas 150g).
SELECT nombre, stock, stock_minimo, (stock <= stock_minimo) AS stock_bajo
FROM productos
ORDER BY nombre;
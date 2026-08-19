USE transport;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Master data required by the New Booking dropdowns.
IF NOT EXISTS (SELECT 1 FROM dbo.branches WHERE name = 'Pune Main Branch')
    INSERT INTO dbo.branches (name, address, city, state)
    VALUES ('Pune Main Branch', 'Hadapsar Industrial Estate', 'Pune', 'Maharashtra');

IF NOT EXISTS (SELECT 1 FROM dbo.branches WHERE name = 'Delhi North Branch')
    INSERT INTO dbo.branches (name, address, city, state)
    VALUES ('Delhi North Branch', 'Rohini Logistics Park', 'Delhi', 'Delhi');

IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Pune' AND state = 'Maharashtra')
    INSERT INTO dbo.cities (name, state) VALUES ('Pune', 'Maharashtra');

IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Mumbai' AND state = 'Maharashtra')
    INSERT INTO dbo.cities (name, state) VALUES ('Mumbai', 'Maharashtra');

IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Delhi' AND state = 'Delhi')
    INSERT INTO dbo.cities (name, state) VALUES ('Delhi', 'Delhi');

IF NOT EXISTS (SELECT 1 FROM dbo.cities WHERE name = 'Bengaluru' AND state = 'Karnataka')
    INSERT INTO dbo.cities (name, state) VALUES ('Bengaluru', 'Karnataka');

IF NOT EXISTS (SELECT 1 FROM dbo.parties WHERE name = 'Acme Retail')
    INSERT INTO dbo.parties (name, type, email, phone, address, city, state, gstin, status)
    VALUES ('Acme Retail', 'both', 'dispatch@acme.demo', '9876500001', 'Kharadi Business Park', 'Pune', 'Maharashtra', '27ABCDE1234F1Z5', 'active');

IF NOT EXISTS (SELECT 1 FROM dbo.parties WHERE name = 'Northstar Traders')
    INSERT INTO dbo.parties (name, type, email, phone, address, city, state, gstin, status)
    VALUES ('Northstar Traders', 'both', 'ops@northstar.demo', '9876500002', 'Rohini Sector 18', 'Delhi', 'Delhi', '07ABCDE1234F1Z5', 'active');

IF NOT EXISTS (SELECT 1 FROM dbo.parties WHERE name = 'Southline Stores')
    INSERT INTO dbo.parties (name, type, email, phone, address, city, state, gstin, status)
    VALUES ('Southline Stores', 'both', 'sales@southline.demo', '9876500003', 'Whitefield Industrial Area', 'Bengaluru', 'Karnataka', '29ABCDE1234F1Z5', 'active');

IF NOT EXISTS (SELECT 1 FROM dbo.routes WHERE pickup_location = 'Pune' AND destination = 'Mumbai')
    INSERT INTO dbo.routes (pickup_location, destination, via, stoppage, status)
    VALUES ('Pune', 'Mumbai', 'Lonavala', 'Navi Mumbai', 'active');

IF NOT EXISTS (SELECT 1 FROM dbo.routes WHERE pickup_location = 'Pune' AND destination = 'Delhi')
    INSERT INTO dbo.routes (pickup_location, destination, via, stoppage, status)
    VALUES ('Pune', 'Delhi', 'Indore', 'Gwalior', 'active');

IF NOT EXISTS (SELECT 1 FROM dbo.routes WHERE pickup_location = 'Delhi' AND destination = 'Bengaluru')
    INSERT INTO dbo.routes (pickup_location, destination, via, stoppage, status)
    VALUES ('Delhi', 'Bengaluru', 'Nagpur', 'Hyderabad', 'active');

DECLARE @driver_one INT;
DECLARE @driver_two INT;
DECLARE @vehicle_one INT;
DECLARE @vehicle_two INT;

IF NOT EXISTS (SELECT 1 FROM dbo.drivers WHERE email = 'ravi.kumar@demo.local')
BEGIN
    INSERT INTO dbo.drivers (full_name, email, phone, password, experience, license_number)
    VALUES ('Ravi Kumar', 'ravi.kumar@demo.local', '9876543210', 'demo123', 6, 'DL-RAVI-2026');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.drivers WHERE email = 'arjun.singh@demo.local')
BEGIN
    INSERT INTO dbo.drivers (full_name, email, phone, password, experience, license_number)
    VALUES ('Arjun Singh', 'arjun.singh@demo.local', '9876543211', 'demo123', 4, 'DL-ARJUN-2026');
END;

SELECT @driver_one = id FROM dbo.drivers WHERE email = 'ravi.kumar@demo.local';
SELECT @driver_two = id FROM dbo.drivers WHERE email = 'arjun.singh@demo.local';

IF NOT EXISTS (SELECT 1 FROM dbo.vehicles WHERE license_plate = 'MH12AB1234')
BEGIN
    INSERT INTO dbo.vehicles (vehicle_id, type, company_name, year, license_plate, puc_certificate_number)
    VALUES ('TRK-1001', 'Container Truck', 'CargoMax Logistics', '2024', 'MH12AB1234', 'PUC-1001');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.vehicles WHERE license_plate = 'DL01CD5678')
BEGIN
    INSERT INTO dbo.vehicles (vehicle_id, type, company_name, year, license_plate, puc_certificate_number)
    VALUES ('TRK-1002', 'Open Truck', 'CargoMax Logistics', '2023', 'DL01CD5678', 'PUC-1002');
END;

SELECT @vehicle_one = id FROM dbo.vehicles WHERE license_plate = 'MH12AB1234';
SELECT @vehicle_two = id FROM dbo.vehicles WHERE license_plate = 'DL01CD5678';

IF NOT EXISTS (SELECT 1 FROM dbo.shipments WHERE lr_number = 'LR-DEMO-001')
BEGIN
    INSERT INTO dbo.shipments (
        lr_number, tracking_id, booking_date, destination, client, weight,
        driver_id, vehicle_id, eta, status, pickup_location, delivery_location,
        freight_charge, payment_mode, goods_desc, packages, weight_type
    ) VALUES (
        'LR-DEMO-001', 'TRK-DEMO-001', CAST(GETDATE() AS DATE), 'Mumbai', 'Acme Retail', 1250,
        @driver_one, @vehicle_one, DATEADD(DAY, 2, GETDATE()), 'in-transit', 'Pune Warehouse', 'Mumbai Hub',
        18500, 'paid', 'Consumer electronics', 24, 'kg'
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.shipments WHERE lr_number = 'LR-DEMO-002')
BEGIN
    INSERT INTO dbo.shipments (
        lr_number, tracking_id, booking_date, destination, client, weight,
        driver_id, vehicle_id, eta, status, pickup_location, delivery_location,
        freight_charge, payment_mode, goods_desc, packages, weight_type
    ) VALUES (
        'LR-DEMO-002', 'TRK-DEMO-002', CAST(GETDATE() AS DATE), 'Delhi', 'Northstar Traders', 850,
        @driver_two, @vehicle_two, DATEADD(DAY, 3, GETDATE()), 'pending', 'Jaipur Depot', 'Delhi Distribution Centre',
        14200, 'topay', 'Packaged textiles', 18, 'kg'
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.shipments WHERE lr_number = 'LR-DEMO-003')
BEGIN
    INSERT INTO dbo.shipments (
        lr_number, tracking_id, booking_date, destination, client, weight,
        driver_id, vehicle_id, eta, status, pickup_location, delivery_location,
        freight_charge, payment_mode, goods_desc, packages, weight_type
    ) VALUES (
        'LR-DEMO-003', 'TRK-DEMO-003', CAST(GETDATE() AS DATE), 'Bengaluru', 'Southline Stores', 2100,
        @driver_one, @vehicle_one, DATEADD(DAY, -1, GETDATE()), 'delivered', 'Chennai Port', 'Bengaluru Warehouse',
        26800, 'paid', 'Industrial components', 32, 'kg'
    );
END;

-- Exceptions shown in Booking > Delayed Shipments.
IF NOT EXISTS (SELECT 1 FROM dbo.shipments WHERE lr_number = 'LR-DELAY-001')
    INSERT INTO dbo.shipments (lr_number, tracking_id, booking_date, destination, client, weight, driver_id, vehicle_id, eta, status, notes, pickup_location, delivery_location, freight_charge, payment_mode, goods_desc, packages, weight_type)
    VALUES ('LR-DELAY-001', 'TRK-DEMO-DELAY-001', CAST(GETDATE() AS DATE), 'Mumbai', 'Acme Retail', 780, @driver_one, @vehicle_one, DATEADD(DAY, -1, GETDATE()), 'delayed', 'critical mechanical issue: engine inspection in progress', 'Pune Warehouse', 'Mumbai Hub', 12600, 'topay', 'Automotive spare parts', 14, 'kg');

IF NOT EXISTS (SELECT 1 FROM dbo.shipments WHERE lr_number = 'LR-DELAY-002')
    INSERT INTO dbo.shipments (lr_number, tracking_id, booking_date, destination, client, weight, driver_id, vehicle_id, eta, status, notes, pickup_location, delivery_location, freight_charge, payment_mode, goods_desc, packages, weight_type)
    VALUES ('LR-DELAY-002', 'TRK-DEMO-DELAY-002', CAST(GETDATE() AS DATE), 'Delhi', 'Northstar Traders', 960, @driver_two, @vehicle_two, DATEADD(DAY, -1, GETDATE()), 'alert', 'urgent traffic congestion near Jaipur bypass', 'Jaipur Depot', 'Delhi Distribution Centre', 15800, 'paid', 'Retail inventory', 20, 'kg');

IF NOT EXISTS (SELECT 1 FROM dbo.shipments WHERE lr_number = 'LR-DELAY-003')
    INSERT INTO dbo.shipments (lr_number, tracking_id, booking_date, destination, client, weight, driver_id, vehicle_id, eta, status, notes, pickup_location, delivery_location, freight_charge, payment_mode, goods_desc, packages, weight_type)
    VALUES ('LR-DELAY-003', 'TRK-DEMO-DELAY-003', CAST(GETDATE() AS DATE), 'Bengaluru', 'Southline Stores', 640, @driver_one, @vehicle_one, CAST(GETDATE() AS DATE), 'delayed', 'weather conditions causing highway closure', 'Chennai Port', 'Bengaluru Warehouse', 10400, 'cash', 'Packaged machinery parts', 11, 'kg');

COMMIT TRANSACTION;
GO

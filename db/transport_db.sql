-- =============================================
-- Table: admins
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[admins]') AND type in (N'U'))
BEGIN
    CREATE TABLE admins (
        id INT IDENTITY(1,1) NOT NULL,
        email VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(15) NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_picture VARCHAR(255) NULL,
        is_active BIT DEFAULT 1,
        last_login DATETIME NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_admins PRIMARY KEY (id),
        CONSTRAINT UQ_admins_email UNIQUE (email)
    );
    PRINT 'Table admins created successfully';
END
ELSE
BEGIN
    PRINT 'Table admins already exists';
END
GO

-- =============================================
-- Table: users
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) NOT NULL,
        email VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        phone VARCHAR(15) NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_picture VARCHAR(255) NULL,
        is_active BIT DEFAULT 1,
        email_verified BIT DEFAULT 0,
        last_login DATETIME NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_users PRIMARY KEY (id),
        CONSTRAINT UQ_users_email UNIQUE (email),
        CONSTRAINT CK_users_role CHECK (role IN ('super_admin', 'admin', 'manager', 'driver', 'user'))
    );
    PRINT 'Table users created successfully';
END
ELSE
BEGIN
    PRINT 'Table users already exists';
END
GO

-- =============================================
-- Table: drivers
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[drivers]') AND type in (N'U'))
BEGIN
    CREATE TABLE drivers (
        id INT IDENTITY(1,1) NOT NULL,
        full_name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(20) NULL,
        password NVARCHAR(255) NULL,
        dob DATE NULL,
        experience INT DEFAULT 0,
        license_number NVARCHAR(100) NULL,
        bank_name NVARCHAR(255) NULL,
        account_number NVARCHAR(50) NULL,
        ifsc_code NVARCHAR(20) NULL,
        bank_branch NVARCHAR(255) NULL,
        emergency_contact NVARCHAR(20) NULL,
        address_proof NVARCHAR(255) NULL,
        aadhar_card NVARCHAR(20) NULL,
        pan_card NVARCHAR(20) NULL,
        medical_report NVARCHAR(50) DEFAULT 'Pending',
        police_verification NVARCHAR(50) DEFAULT 'Pending',
        license_file_path NVARCHAR(500) NULL,
        police_file_path NVARCHAR(500) NULL,
        bank_file_path NVARCHAR(500) NULL,
        medical_file_path NVARCHAR(500) NULL,
        aadhar_file_path NVARCHAR(500) NULL,
        wallet_balance DECIMAL(10,2) DEFAULT 0.00,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_drivers PRIMARY KEY (id),
        CONSTRAINT UQ_drivers_email UNIQUE (email)
    );
    PRINT 'Table drivers created successfully';
END
ELSE
BEGIN
    PRINT 'Table drivers already exists';
END
GO

-- =============================================
-- Table: vehicles
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[vehicles]') AND type in (N'U'))
BEGIN
    CREATE TABLE vehicles (
        id INT IDENTITY(1,1) NOT NULL,
        vehicle_id NVARCHAR(50) NULL,
        type NVARCHAR(100) NULL,
        company_name NVARCHAR(255) NULL,
        year NVARCHAR(10) NULL,
        license_plate NVARCHAR(50) NULL,
        puc_certificate_number NVARCHAR(100) NULL,
        puc_expiry_date DATE NULL,
        upload_puc_document_copy_file_path NVARCHAR(500) NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_vehicles PRIMARY KEY (id),
        CONSTRAINT UQ_vehicles_vehicle_id UNIQUE (vehicle_id),
        CONSTRAINT UQ_vehicles_license_plate UNIQUE (license_plate)
    );
    PRINT 'Table vehicles created successfully';
END
ELSE
BEGIN
    PRINT 'Table vehicles already exists';
END
GO

-- =============================================
-- Table: shipments
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[shipments]') AND type in (N'U'))
BEGIN
    CREATE TABLE shipments (
        id INT IDENTITY(1,1) NOT NULL,
        lr_number NVARCHAR(50) NULL,
        tracking_id NVARCHAR(50) NULL,
        challan_number NVARCHAR(50) NULL,
        booking_date DATE NULL,
        destination NVARCHAR(255) NULL,
        client NVARCHAR(255) NULL,
        consignor_id INT NULL,
        consignee_id INT NULL,
        weight DECIMAL(10,2) NULL,
        driver_id INT NULL,
        vehicle_id INT NULL,
        eta DATE NULL,
        status NVARCHAR(50) DEFAULT 'pending',
        notes NVARCHAR(MAX) NULL,
        pickup_location NVARCHAR(255) NULL,
        delivery_location NVARCHAR(255) NULL,
        freight_charge DECIMAL(10,2) NULL,
        loading_charges DECIMAL(10,2) DEFAULT 0,
        unloading_charges DECIMAL(10,2) DEFAULT 0,
        other_charges DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        gst DECIMAL(5,2) NULL,
        payment_mode NVARCHAR(50) NULL,
        goods_desc NVARCHAR(MAX) NULL,
        packages INT NULL,
        weight_type NVARCHAR(20) NULL,
        invoice_no NVARCHAR(100) NULL,
        invoice_value DECIMAL(10,2) NULL,
        eway_bill NVARCHAR(100) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_shipments PRIMARY KEY (id),
        CONSTRAINT UQ_shipments_lr_number UNIQUE (lr_number),
        CONSTRAINT FK_shipments_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
        CONSTRAINT FK_shipments_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );
    PRINT 'Table shipments created successfully';
END
ELSE
BEGIN
    PRINT 'Table shipments already exists';
END
GO

-- =============================================
-- Table: parties
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[parties]') AND type in (N'U'))
BEGIN
    CREATE TABLE parties (
        id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        type NVARCHAR(50) DEFAULT 'both',
        email NVARCHAR(255) NULL,
        phone NVARCHAR(20) NULL,
        address NVARCHAR(500) NULL,
        city NVARCHAR(100) NULL,
        state NVARCHAR(100) NULL,
        gstin NVARCHAR(15) NULL,
        status NVARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_parties PRIMARY KEY (id)
    );
    PRINT 'Table parties created successfully';
END
ELSE
BEGIN
    PRINT 'Table parties already exists';
END
GO

-- =============================================
-- Table: cities
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cities]') AND type in (N'U'))
BEGIN
    CREATE TABLE cities (
        id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        state NVARCHAR(100) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_cities PRIMARY KEY (id)
    );
    PRINT 'Table cities created successfully';
END
ELSE
BEGIN
    PRINT 'Table cities already exists';
END
GO

-- =============================================
-- Table: clients
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[clients]') AND type in (N'U'))
BEGIN
    CREATE TABLE clients (
        id INT IDENTITY(1,1) NOT NULL,
        company_name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NULL,
        phone NVARCHAR(20) NULL,
        address NVARCHAR(500) NULL,
        status NVARCHAR(50) DEFAULT 'Active',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_clients PRIMARY KEY (id)
    );
    PRINT 'Table clients created successfully';
END
ELSE
BEGIN
    PRINT 'Table clients already exists';
END
GO

-- =============================================
-- Table: routes
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[routes]') AND type in (N'U'))
BEGIN
    CREATE TABLE routes (
        id INT IDENTITY(1,1) NOT NULL,
        pickup_location NVARCHAR(255) NULL,
        destination NVARCHAR(255) NULL,
        via NVARCHAR(255) NULL,
        stoppage NVARCHAR(255) NULL,
        status NVARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_routes PRIMARY KEY (id)
    );
    PRINT 'Table routes created successfully';
END
ELSE
BEGIN
    PRINT 'Table routes already exists';
END
GO

-- =============================================
-- Table: branches
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[branches]') AND type in (N'U'))
BEGIN
    CREATE TABLE branches (
        id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        address NVARCHAR(500) NULL,
        city NVARCHAR(100) NULL,
        state NVARCHAR(100) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_branches PRIMARY KEY (id)
    );
    PRINT 'Table branches created successfully';
END
ELSE
BEGIN
    PRINT 'Table branches already exists';
END
GO

-- =============================================
-- Table: maintenance_logs
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[maintenance_logs]') AND type in (N'U'))
BEGIN
    CREATE TABLE maintenance_logs (
        id INT IDENTITY(1,1) NOT NULL,
        vehicle_id INT NOT NULL,
        maintenance_type NVARCHAR(100) NULL,
        category NVARCHAR(100) NULL,
        description NVARCHAR(MAX) NULL,
        service_date DATE NULL,
        cost DECIMAL(10,2) NULL,
        status NVARCHAR(50) DEFAULT 'In Progress',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_maintenance_logs PRIMARY KEY (id),
        CONSTRAINT FK_maintenance_logs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );
    PRINT 'Table maintenance_logs created successfully';
END
ELSE
BEGIN
    PRINT 'Table maintenance_logs already exists';
END
GO

-- =============================================
-- Schema Fixups: Existing Databases
-- Ensures procedure dependencies exist on older DB versions.
-- =============================================
IF OBJECT_ID(N'[dbo].[shipments]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.shipments', 'lr_number') IS NULL
        ALTER TABLE dbo.shipments ADD lr_number NVARCHAR(50) NULL;

    IF COL_LENGTH('dbo.shipments', 'booking_date') IS NULL
        ALTER TABLE dbo.shipments ADD booking_date DATE NULL;

    IF COL_LENGTH('dbo.shipments', 'loading_charges') IS NULL
        ALTER TABLE dbo.shipments ADD loading_charges DECIMAL(10,2) NULL;

    IF COL_LENGTH('dbo.shipments', 'unloading_charges') IS NULL
        ALTER TABLE dbo.shipments ADD unloading_charges DECIMAL(10,2) NULL;

    IF COL_LENGTH('dbo.shipments', 'other_charges') IS NULL
        ALTER TABLE dbo.shipments ADD other_charges DECIMAL(10,2) NULL;

    IF COL_LENGTH('dbo.shipments', 'discount') IS NULL
        ALTER TABLE dbo.shipments ADD discount DECIMAL(10,2) NULL;
END
GO

-- =============================================
-- Procedures: Master Get APIs (All Tables)
-- =============================================

CREATE OR ALTER PROCEDURE dbo.usp_GetAdmins
    @id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM admins
    WHERE (@id IS NULL OR id = @id)
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetUsers
    @id INT = NULL,
    @role VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM users
    WHERE (@id IS NULL OR id = @id)
      AND (@role IS NULL OR role = @role)
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetDrivers
    @id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM drivers
    WHERE (@id IS NULL OR id = @id)
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetVehicles
    @id INT = NULL,
    @vehicle_id NVARCHAR(50) = NULL,
    @license_plate NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vehicles
    WHERE (@id IS NULL OR id = @id)
      AND (@vehicle_id IS NULL OR vehicle_id = @vehicle_id)
      AND (@license_plate IS NULL OR license_plate = @license_plate)
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetShipments
    @id INT = NULL,
    @status NVARCHAR(50) = NULL,
    @from_date DATE = NULL,
    @to_date DATE = NULL,
    @driver_id INT = NULL,
    @vehicle_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @sql NVARCHAR(MAX) = N'SELECT
        s.id,';

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'lr_number') IS NOT NULL THEN N' s.lr_number,'
        ELSE N' CAST(NULL AS NVARCHAR(50)) AS lr_number,'
    END;

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'tracking_id') IS NOT NULL THEN N' s.tracking_id,'
        ELSE N' CAST(NULL AS NVARCHAR(50)) AS tracking_id,'
    END;

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'booking_date') IS NOT NULL THEN N' s.booking_date,'
        ELSE N' CAST(NULL AS DATE) AS booking_date,'
    END;

    SET @sql += N'
        s.client,
        s.pickup_location,
        s.delivery_location,
        s.destination,
        s.status,
        s.driver_id,
        d.full_name AS driver_name,
        s.vehicle_id,
        v.license_plate,
        s.weight,
        s.freight_charge,';

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'loading_charges') IS NOT NULL THEN N' s.loading_charges,'
        ELSE N' CAST(0 AS DECIMAL(10,2)) AS loading_charges,'
    END;

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'unloading_charges') IS NOT NULL THEN N' s.unloading_charges,'
        ELSE N' CAST(0 AS DECIMAL(10,2)) AS unloading_charges,'
    END;

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'other_charges') IS NOT NULL THEN N' s.other_charges,'
        ELSE N' CAST(0 AS DECIMAL(10,2)) AS other_charges,'
    END;

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'discount') IS NOT NULL THEN N' s.discount,'
        ELSE N' CAST(0 AS DECIMAL(10,2)) AS discount,'
    END;

    SET @sql += N'
        s.gst,
        (
            ISNULL(s.freight_charge, 0)
            + ISNULL(';

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'loading_charges') IS NOT NULL THEN N's.loading_charges'
        ELSE N'0'
    END;

    SET @sql += N', 0)
            + ISNULL(';

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'unloading_charges') IS NOT NULL THEN N's.unloading_charges'
        ELSE N'0'
    END;

    SET @sql += N', 0)
            + ISNULL(';

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'other_charges') IS NOT NULL THEN N's.other_charges'
        ELSE N'0'
    END;

    SET @sql += N', 0)
            - ISNULL(';

    SET @sql += CASE
        WHEN COL_LENGTH('dbo.shipments', 'discount') IS NOT NULL THEN N's.discount'
        ELSE N'0'
    END;

    SET @sql += N', 0)
        ) AS net_amount,
        s.created_at,
        s.updated_at
    FROM shipments s
    LEFT JOIN drivers d ON d.id = s.driver_id
    LEFT JOIN vehicles v ON v.id = s.vehicle_id
    WHERE (@id IS NULL OR s.id = @id)
      AND (@status IS NULL OR s.status = @status)
      AND (@driver_id IS NULL OR s.driver_id = @driver_id)
      AND (@vehicle_id IS NULL OR s.vehicle_id = @vehicle_id)';

    IF COL_LENGTH('dbo.shipments', 'booking_date') IS NOT NULL
    BEGIN
        SET @sql += N'
      AND (@from_date IS NULL OR s.booking_date >= @from_date)
      AND (@to_date IS NULL OR s.booking_date <= @to_date)';
    END;

    SET @sql += N'
    ORDER BY s.created_at DESC;';

    EXEC sp_executesql
        @sql,
        N'@id INT, @status NVARCHAR(50), @from_date DATE, @to_date DATE, @driver_id INT, @vehicle_id INT',
        @id = @id,
        @status = @status,
        @from_date = @from_date,
        @to_date = @to_date,
        @driver_id = @driver_id,
        @vehicle_id = @vehicle_id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetParties
    @id INT = NULL,
    @type NVARCHAR(50) = NULL,
    @status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM parties
    WHERE (@id IS NULL OR id = @id)
      AND (@type IS NULL OR type = @type)
      AND (@status IS NULL OR status = @status)
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetCities
    @id INT = NULL,
    @state NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM cities
    WHERE (@id IS NULL OR id = @id)
      AND (@state IS NULL OR state = @state)
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetClients
    @id INT = NULL,
    @status NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM clients
    WHERE (@id IS NULL OR id = @id)
      AND (@status IS NULL OR status = @status)
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetRoutes
    @id INT = NULL,
    @status NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM routes
    WHERE (@id IS NULL OR id = @id)
      AND (@status IS NULL OR status = @status)
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetBranches
    @id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM branches
    WHERE (@id IS NULL OR id = @id)
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetMaintenanceLogs
    @id INT = NULL,
    @vehicle_id INT = NULL,
    @status NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ml.*, v.vehicle_id, v.license_plate
    FROM maintenance_logs ml
    LEFT JOIN vehicles v ON v.id = ml.vehicle_id
    WHERE (@id IS NULL OR ml.id = @id)
      AND (@vehicle_id IS NULL OR ml.vehicle_id = @vehicle_id)
      AND (@status IS NULL OR ml.status = @status)
    ORDER BY ml.created_at DESC;
END
GO
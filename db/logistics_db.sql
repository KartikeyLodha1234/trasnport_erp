-- =============================================
-- Table: admins
-- =============================================
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
GO

CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);
GO

-- =============================================
-- Table: users
-- =============================================
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
GO

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
GO

-- =============================================
-- Table: drivers
-- =============================================
CREATE TABLE drivers (
    id INT IDENTITY(1,1) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    dob DATE NULL,
    experience INT NOT NULL DEFAULT 0,
    license_number VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100) NULL,
    account_number VARCHAR(50) NULL,
    ifsc_code VARCHAR(20) NULL,
    bank_branch VARCHAR(100) NULL,
    emergency_contact VARCHAR(20) NULL,
    address_proof VARCHAR(255) NULL,
    aadhar_card VARCHAR(20) NULL,
    pan_card VARCHAR(20) NULL,
    medical_report VARCHAR(255) NULL,
    police_verification VARCHAR(255) NULL,
    license_file_path VARCHAR(255) NULL,
    police_file_path VARCHAR(255) NULL,
    bank_file_path VARCHAR(255) NULL,
    medical_file_path VARCHAR(255) NULL,
    aadhar_file_path VARCHAR(255) NULL,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_drivers PRIMARY KEY (id),
    CONSTRAINT UQ_drivers_email UNIQUE (email)
);
GO

-- =============================================
-- Table: vehicles
-- =============================================
CREATE TABLE vehicles (
    id INT IDENTITY(1,1) NOT NULL,
    vehicle_id VARCHAR(100) NOT NULL,
    type VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    year VARCHAR(4) NOT NULL,
    license_plate VARCHAR(50) NOT NULL,
    puc_certificate_number VARCHAR(100) NOT NULL,
    puc_expiry_date DATE NULL,
    upload_puc_document_copy_file_path VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_vehicles PRIMARY KEY (id)
);
GO

-- =============================================
-- Table: shipments
-- =============================================
CREATE TABLE shipments (
    id INT IDENTITY(1,1) NOT NULL,
    tracking_id VARCHAR(50) NULL,
    destination VARCHAR(255) NOT NULL,
    client VARCHAR(255) NULL,
    weight VARCHAR(50) NULL,
    driver_id INT NULL,
    vehicle_id INT NULL,
    eta DATETIME NULL,
    status VARCHAR(50) DEFAULT 'Loading',
    notes TEXT NULL,
    challan_number VARCHAR(50) NULL,
    pickup_location VARCHAR(255) NULL,
    delivery_location VARCHAR(255) NULL,
    freight_charge DECIMAL(10,2) DEFAULT 0.00,
    gst DECIMAL(5,2) DEFAULT 0.00,
    payment_mode VARCHAR(50) DEFAULT 'cash',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_shipments PRIMARY KEY (id),
    CONSTRAINT FK_shipments_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    CONSTRAINT FK_shipments_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);
GO

CREATE INDEX idx_shipments_tracking_id ON shipments(tracking_id);
CREATE INDEX idx_shipments_status ON shipments(status);
GO

-- =============================================
-- Table: transactions
-- =============================================
CREATE TABLE transactions (
    id INT IDENTITY(1,1) NOT NULL,
    transaction_id VARCHAR(50) NOT NULL,
    user_id INT NULL,
    driver_id INT NULL,
    shipment_id INT NULL,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255) NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20) NULL,
    reference VARCHAR(100) NULL,
    metadata NVARCHAR(MAX) NULL,  -- JSON support
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_transactions PRIMARY KEY (id),
    CONSTRAINT UQ_transactions_transaction_id UNIQUE (transaction_id),
    CONSTRAINT CK_transactions_type CHECK (type IN ('credit', 'debit', 'refund', 'payment')),
    CONSTRAINT CK_transactions_status CHECK (status IN ('pending', 'completed', 'failed', 'processing')),
    CONSTRAINT CK_transactions_payment_method CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'wallet')),
    CONSTRAINT FK_transactions_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    CONSTRAINT FK_transactions_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL
);
GO

CREATE INDEX idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
GO

-- =============================================
-- Table: payments
-- =============================================
CREATE TABLE payments (
    id INT IDENTITY(1,1) NOT NULL,
    driver_id INT NOT NULL,
    shipment_id INT NULL,
    amount DECIMAL(10,2) NOT NULL,
    [checkpoint] VARCHAR(255) NULL,
    upi_id VARCHAR(255) NULL,
    upi_ref VARCHAR(255) NULL,
    note TEXT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paid_by VARCHAR(255) DEFAULT 'admin',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_payments PRIMARY KEY (id),
    CONSTRAINT CK_payments_status CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT FK_payments_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    CONSTRAINT FK_payments_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL
);
GO

-- =============================================
-- Table: company_profiles
-- =============================================
CREATE TABLE company_profiles (
    id INT IDENTITY(1,1) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    owner_name VARCHAR(100) NULL,
    phone VARCHAR(15) NULL,
    gstin VARCHAR(15) NULL,
    pan_number VARCHAR(10) NULL,
    address TEXT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_company_profiles PRIMARY KEY (id)
);
GO

CREATE INDEX idx_company_profiles_company_name ON company_profiles(company_name);
CREATE INDEX idx_company_profiles_city ON company_profiles(city);
CREATE INDEX idx_company_profiles_state ON company_profiles(state);
GO

-- =============================================
-- Table: maintenance_logs
-- =============================================
CREATE TABLE maintenance_logs (
    id INT IDENTITY(1,1) NOT NULL,
    vehicle_id INT NOT NULL,
    maintenance_type VARCHAR(50) NULL,
    category VARCHAR(50) NULL,
    description TEXT NULL,
    service_date DATE NULL,
    cost DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'In Progress',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_maintenance_logs PRIMARY KEY (id),
    CONSTRAINT FK_maintenance_logs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
GO

-- =============================================
-- Table: system_logs
-- =============================================
CREATE TABLE system_logs (
    id INT IDENTITY(1,1) NOT NULL,
    type VARCHAR(50) NULL,
    title VARCHAR(255) NULL,
    description TEXT NULL,
    time VARCHAR(50) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_system_logs PRIMARY KEY (id)
);
GO

-- =============================================
-- Table: admin_activities
-- =============================================
CREATE TABLE admin_activities (
    id INT IDENTITY(1,1) NOT NULL,
    admin_id INT NOT NULL,
    activity_type VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    details NVARCHAR(MAX) NULL,  -- JSON support
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_admin_activities PRIMARY KEY (id),
    CONSTRAINT CK_admin_activities_type CHECK (activity_type IN ('login', 'logout', 'profile_update', 'password_change', 'login_failed')),
    CONSTRAINT FK_admin_activities_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_admin_activities_admin_id ON admin_activities(admin_id);
CREATE INDEX idx_admin_activities_created_at ON admin_activities(created_at);
GO
CREATE PROCEDURE sp_GetAdminActivities
    @admin_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id,
        admin_id,
        activity_type,
        ip_address,
        user_agent,
        details,
        created_at
    FROM admin_activities
    WHERE @admin_id IS NULL
       OR admin_id = @admin_id
    ORDER BY created_at DESC;
END;
GO
-- =============================================
-- Table: admin_sessions
-- =============================================
CREATE TABLE admin_sessions (
    id INT IDENTITY(1,1) NOT NULL,
    admin_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_admin_sessions PRIMARY KEY (id),
    CONSTRAINT UQ_admin_sessions_token UNIQUE (token),
    CONSTRAINT FK_admin_sessions_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
GO

-- =============================================
-- Table: admin_password_resets
-- =============================================
CREATE TABLE admin_password_resets (
    id INT IDENTITY(1,1) NOT NULL,
    admin_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_admin_password_resets PRIMARY KEY (id),
    CONSTRAINT UQ_admin_password_resets_token UNIQUE (token),
    CONSTRAINT FK_admin_password_resets_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_admin_password_resets_token ON admin_password_resets(token);
CREATE INDEX idx_admin_password_resets_admin_id ON admin_password_resets(admin_id);
CREATE INDEX idx_admin_password_resets_expires_at ON admin_password_resets(expires_at);
GO

-- =============================================
-- Table: operators
-- =============================================
CREATE TABLE operators (
    operator_id INT IDENTITY(1,1) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'operator',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_operators PRIMARY KEY (operator_id),
    CONSTRAINT UQ_operators_username UNIQUE (username),
    CONSTRAINT UQ_operators_email UNIQUE (email)
);
GO

-- =============================================
-- Table: lrs (Loading Receipts)
-- =============================================
CREATE TABLE lrs (
    id BIGINT IDENTITY(1,1) NOT NULL,
    lr_number VARCHAR(50) NOT NULL,
    booking_date VARCHAR(15) NOT NULL,
    branch_id BIGINT NULL,
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    consignor_id BIGINT NOT NULL,
    consignee_id BIGINT NOT NULL,
    goods_desc VARCHAR(255) NOT NULL,
    packages INT DEFAULT 0,
    weight DECIMAL(10,2) DEFAULT 0.00,
    weight_type VARCHAR(10) DEFAULT 'kg',
    invoice_no VARCHAR(100) NULL,
    invoice_value DECIMAL(12,2) DEFAULT 0.00,
    eway_bill VARCHAR(12) NULL,
    payment_type VARCHAR(10) NOT NULL,
    freight_amount DECIMAL(10,2) NOT NULL,
    loading_charges DECIMAL(10,2) DEFAULT 0.00,
    unloading_charges DECIMAL(10,2) DEFAULT 0.00,
    other_charges DECIMAL(10,2) DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    gst_applicable BIT DEFAULT 0,
    gst_type VARCHAR(20) DEFAULT 'igst',
    cgst_amount DECIMAL(10,2) DEFAULT 0.00,
    sgst_amount DECIMAL(10,2) DEFAULT 0.00,
    igst_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    remarks TEXT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_lrs PRIMARY KEY (id),
    CONSTRAINT UQ_lrs_lr_number UNIQUE (lr_number),
    CONSTRAINT CK_lrs_weight_type CHECK (weight_type IN ('kg', 'ton')),
    CONSTRAINT CK_lrs_payment_type CHECK (payment_type IN ('paid', 'topay', 'tbb')),
    CONSTRAINT CK_lrs_gst_type CHECK (gst_type IN ('igst', 'cgst_sgst'))
);
GO

CREATE INDEX idx_lrs_lr_number ON lrs(lr_number);
CREATE INDEX idx_lrs_booking_date ON lrs(booking_date);
GO

-- =============================================
-- Table: city
-- =============================================
CREATE TABLE city (
    city_id INT IDENTITY(1,1) NOT NULL,
    city_name VARCHAR(255) NOT NULL,
    state VARCHAR(255) NULL,
    country VARCHAR(255) NULL,
    pin_code VARCHAR(20) NULL,
    CONSTRAINT PK_city PRIMARY KEY (city_id)
);
GO

-- =============================================
-- Table: client
-- =============================================
CREATE TABLE client (
    client_id INT IDENTITY(1,1) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    contact_person VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    vehicles INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active',
    CONSTRAINT PK_client PRIMARY KEY (client_id)
);
GO

-- =============================================
-- Table: admin_wallet
-- =============================================
CREATE TABLE admin_wallet (
    id INT IDENTITY(1,1) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_admin_wallet PRIMARY KEY (id)
);
GO

-- =============================================
-- Table: password_reset_tokens
-- =============================================
CREATE TABLE password_reset_tokens (
    id INT IDENTITY(1,1) NOT NULL,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_password_reset_tokens PRIMARY KEY (id),
    CONSTRAINT UQ_password_reset_tokens_token UNIQUE (token),
    CONSTRAINT FK_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
GO

-- =============================================
-- Table: user_activities
-- =============================================
CREATE TABLE user_activities (
    id INT IDENTITY(1,1) NOT NULL,
    user_id INT NOT NULL,
    activity_type VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    details NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_user_activities PRIMARY KEY (id),
    CONSTRAINT CK_user_activities_type CHECK (activity_type IN ('login', 'logout', 'profile_update', 'password_change', 'login_failed')),
    CONSTRAINT FK_user_activities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);
GO

-- =============================================
-- Table: user_sessions
-- =============================================
CREATE TABLE user_sessions (
    id INT IDENTITY(1,1) NOT NULL,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_user_sessions PRIMARY KEY (id),
    CONSTRAINT UQ_user_sessions_token UNIQUE (token),
    CONSTRAINT FK_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
GO

-- =============================================
-- Driver stored procedures
-- =============================================

IF OBJECT_ID('dbo.sp_GetAllDrivers', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAllDrivers;
GO
CREATE PROCEDURE dbo.sp_GetAllDrivers
    @Page INT = 1,
    @PageSize INT = 50,
    @Search NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, aadhar_card,
           pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE (@Search IS NULL OR @Search = '' OR
           full_name LIKE '%' + @Search + '%' OR
           email LIKE '%' + @Search + '%' OR
           phone LIKE '%' + @Search + '%' OR
           license_number LIKE '%' + @Search + '%')
    ORDER BY id ASC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

IF OBJECT_ID('dbo.sp_GetDriverById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDriverById;
GO
CREATE PROCEDURE dbo.sp_GetDriverById
    @DriverId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, emergency_contact, address_proof,
           aadhar_card, pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE id = @DriverId;
END
GO

IF OBJECT_ID('dbo.sp_GetDriverByEmail', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDriverByEmail;
GO
CREATE PROCEDURE dbo.sp_GetDriverByEmail
    @Email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, emergency_contact, address_proof, aadhar_card,
           pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE email = @Email;
END
GO

IF OBJECT_ID('dbo.sp_GetDriverByPhone', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDriverByPhone;
GO
CREATE PROCEDURE dbo.sp_GetDriverByPhone
    @Phone NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, emergency_contact, address_proof, aadhar_card,
           pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE phone = @Phone;
END
GO

IF OBJECT_ID('dbo.sp_CreateDriver', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CreateDriver;
GO
CREATE PROCEDURE dbo.sp_CreateDriver
    @FullName NVARCHAR(255),
    @Email NVARCHAR(255),
    @Phone NVARCHAR(50),
    @Password NVARCHAR(255),
    @Dob DATE = NULL,
    @Experience INT = 0,
    @LicenseNumber NVARCHAR(100) = NULL,
    @BankName NVARCHAR(100) = NULL,
    @AccountNumber NVARCHAR(50) = NULL,
    @IfscCode NVARCHAR(20) = NULL,
    @BankBranch NVARCHAR(100) = NULL,
    @EmergencyContact NVARCHAR(20) = NULL,
    @AddressProof NVARCHAR(255) = NULL,
    @AadharCard NVARCHAR(20) = NULL,
    @PanCard NVARCHAR(20) = NULL,
    @MedicalReport NVARCHAR(255) = NULL,
    @PoliceVerification NVARCHAR(255) = NULL,
    @LicenseFilePath NVARCHAR(255) = NULL,
    @PoliceFilePath NVARCHAR(255) = NULL,
    @BankFilePath NVARCHAR(255) = NULL,
    @MedicalFilePath NVARCHAR(255) = NULL,
    @AadharFilePath NVARCHAR(255) = NULL,
    @WalletBalance DECIMAL(10,2) = 0.00,
    @NewDriverId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO drivers (
        full_name, email, phone, password, dob, experience, license_number,
        bank_name, account_number, ifsc_code, bank_branch, emergency_contact, address_proof, aadhar_card,
        pan_card, medical_report, police_verification, license_file_path,
        police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
        wallet_balance, created_at
    )
    VALUES (
        @FullName, @Email, @Phone, @Password, @Dob, @Experience, @LicenseNumber,
        @BankName, @AccountNumber, @IfscCode, @BankBranch, @EmergencyContact, @AddressProof, @AadharCard,
        @PanCard, @MedicalReport, @PoliceVerification, @LicenseFilePath,
        @PoliceFilePath, @BankFilePath, @MedicalFilePath, @AadharFilePath,
        @WalletBalance, GETDATE()
    );

    SET @NewDriverId = SCOPE_IDENTITY();
    SELECT @NewDriverId AS NewDriverId;
END
GO

IF OBJECT_ID('dbo.sp_UpdateDriver', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateDriver;
GO
CREATE PROCEDURE dbo.sp_UpdateDriver
    @DriverId INT,
    @FullName NVARCHAR(255) = NULL,
    @Email NVARCHAR(255) = NULL,
    @Phone NVARCHAR(50) = NULL,
    @Password NVARCHAR(255) = NULL,
    @Dob DATE = NULL,
    @Experience INT = NULL,
    @LicenseNumber NVARCHAR(100) = NULL,
    @BankName NVARCHAR(100) = NULL,
    @AccountNumber NVARCHAR(50) = NULL,
    @IfscCode NVARCHAR(20) = NULL,
    @BankBranch NVARCHAR(100) = NULL,
    @EmergencyContact NVARCHAR(20) = NULL,
    @AddressProof NVARCHAR(255) = NULL,
    @AadharCard NVARCHAR(20) = NULL,
    @PanCard NVARCHAR(20) = NULL,
    @MedicalReport NVARCHAR(255) = NULL,
    @PoliceVerification NVARCHAR(255) = NULL,
    @LicenseFilePath NVARCHAR(255) = NULL,
    @PoliceFilePath NVARCHAR(255) = NULL,
    @BankFilePath NVARCHAR(255) = NULL,
    @MedicalFilePath NVARCHAR(255) = NULL,
    @AadharFilePath NVARCHAR(255) = NULL,
    @WalletBalance DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE drivers
    SET full_name = COALESCE(@FullName, full_name),
        email = COALESCE(@Email, email),
        phone = COALESCE(@Phone, phone),
        password = COALESCE(@Password, password),
        dob = COALESCE(@Dob, dob),
        experience = COALESCE(@Experience, experience),
        license_number = COALESCE(@LicenseNumber, license_number),
        bank_name = COALESCE(@BankName, bank_name),
        account_number = COALESCE(@AccountNumber, account_number),
        ifsc_code = COALESCE(@IfscCode, ifsc_code),
        bank_branch = COALESCE(@BankBranch, bank_branch),
        emergency_contact = COALESCE(@EmergencyContact, emergency_contact),
        address_proof = COALESCE(@AddressProof, address_proof),
        aadhar_card = COALESCE(@AadharCard, aadhar_card),
        pan_card = COALESCE(@PanCard, pan_card),
        medical_report = COALESCE(@MedicalReport, medical_report),
        police_verification = COALESCE(@PoliceVerification, police_verification),
        license_file_path = COALESCE(@LicenseFilePath, license_file_path),
        police_file_path = COALESCE(@PoliceFilePath, police_file_path),
        bank_file_path = COALESCE(@BankFilePath, bank_file_path),
        medical_file_path = COALESCE(@MedicalFilePath, medical_file_path),
        aadhar_file_path = COALESCE(@AadharFilePath, aadhar_file_path),
        wallet_balance = COALESCE(@WalletBalance, wallet_balance)
    WHERE id = @DriverId;

    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, aadhar_card,
           pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE id = @DriverId;
END
GO

IF OBJECT_ID('dbo.sp_DeleteDriver', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_DeleteDriver;
GO
CREATE PROCEDURE dbo.sp_DeleteDriver
    @DriverId INT,
    @ForceDelete BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM drivers WHERE id = @DriverId;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

IF OBJECT_ID('dbo.sp_SearchDrivers', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SearchDrivers;
GO
CREATE PROCEDURE dbo.sp_SearchDrivers
    @Search NVARCHAR(255),
    @Page INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, emergency_contact, address_proof, aadhar_card,
           pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE full_name LIKE '%' + @Search + '%'
       OR email LIKE '%' + @Search + '%'
       OR phone LIKE '%' + @Search + '%'
       OR license_number LIKE '%' + @Search + '%'
    ORDER BY id ASC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

IF OBJECT_ID('dbo.sp_GetDriverStats', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDriverStats;
GO
CREATE PROCEDURE dbo.sp_GetDriverStats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM drivers) AS TotalDrivers,
        (SELECT COUNT(*) FROM drivers WHERE medical_report = 'Approved') AS MedicalApproved,
        (SELECT COUNT(*) FROM drivers WHERE medical_report = 'Pending') AS MedicalPending,
        (SELECT COUNT(*) FROM drivers WHERE police_verification = 'Approved') AS PoliceApproved,
        (SELECT COUNT(*) FROM drivers WHERE police_verification = 'Pending') AS PolicePending,
        (SELECT ISNULL(SUM(wallet_balance), 0) FROM drivers) AS TotalWalletBalance,
        (SELECT ISNULL(AVG(wallet_balance), 0) FROM drivers) AS AvgWalletBalance,
        (SELECT COUNT(*) FROM drivers WHERE experience >= 5) AS ExperiencedDrivers,
        (SELECT COUNT(*) FROM drivers WHERE experience < 5) AS NewDrivers;
END
GO

IF OBJECT_ID('dbo.sp_UpdateDriverWallet', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateDriverWallet;
GO
CREATE PROCEDURE dbo.sp_UpdateDriverWallet
    @DriverId INT,
    @Amount DECIMAL(10,2),
    @Operation NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF @Operation = 'credit'
    BEGIN
        UPDATE drivers
        SET wallet_balance = wallet_balance + @Amount
        WHERE id = @DriverId;
    END
    ELSE IF @Operation = 'debit'
    BEGIN
        UPDATE drivers
        SET wallet_balance = wallet_balance - @Amount
        WHERE id = @DriverId;
    END
    ELSE
    BEGIN
        RAISERROR('Invalid wallet operation', 16, 1);
        RETURN;
    END

    SELECT id, wallet_balance FROM drivers WHERE id = @DriverId;
END
GO

IF OBJECT_ID('dbo.sp_GetDriverWithHistory', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDriverWithHistory;
GO
CREATE PROCEDURE dbo.sp_GetDriverWithHistory
    @DriverId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, aadhar_card,
           pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE id = @DriverId;

    SELECT id, tracking_id, destination, client, weight, driver_id, vehicle_id,
           eta, status, notes, challan_number, pickup_location, delivery_location,
           freight_charge, gst, payment_mode, created_at, updated_at
    FROM shipments
    WHERE driver_id = @DriverId
    ORDER BY created_at DESC;

    SELECT id, transaction_id, user_id, driver_id, shipment_id, type, amount,
           description, status, payment_method, reference, metadata, created_at, updated_at
    FROM transactions
    WHERE driver_id = @DriverId
    ORDER BY created_at DESC;
END
GO

IF OBJECT_ID('dbo.sp_BulkInsertDrivers', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_BulkInsertDrivers;
GO
CREATE PROCEDURE dbo.sp_BulkInsertDrivers
    @JsonData NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO drivers (
        full_name, email, phone, password, dob, experience, license_number,
        bank_name, account_number, ifsc_code, bank_branch, aadhar_card,
        pan_card, medical_report, police_verification, license_file_path,
        police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
        wallet_balance, created_at
    )
    SELECT
        JSON_VALUE(value, '$.full_name'),
        JSON_VALUE(value, '$.email'),
        JSON_VALUE(value, '$.phone'),
        JSON_VALUE(value, '$.password'),
        TRY_CAST(JSON_VALUE(value, '$.dob') AS DATE),
        TRY_CAST(JSON_VALUE(value, '$.experience') AS INT),
        JSON_VALUE(value, '$.license_number'),
        JSON_VALUE(value, '$.bank_name'),
        JSON_VALUE(value, '$.account_number'),
        JSON_VALUE(value, '$.ifsc_code'),
        JSON_VALUE(value, '$.bank_branch'),
        JSON_VALUE(value, '$.aadhar_card'),
        JSON_VALUE(value, '$.pan_card'),
        JSON_VALUE(value, '$.medical_report'),
        JSON_VALUE(value, '$.police_verification'),
        JSON_VALUE(value, '$.license_file_path'),
        JSON_VALUE(value, '$.police_file_path'),
        JSON_VALUE(value, '$.bank_file_path'),
        JSON_VALUE(value, '$.medical_file_path'),
        JSON_VALUE(value, '$.aadhar_file_path'),
        TRY_CAST(JSON_VALUE(value, '$.wallet_balance') AS DECIMAL(10,2)),
        GETDATE()
    FROM OPENJSON(@JsonData);

    SELECT @@ROWCOUNT AS RowsInserted;
END
GO

IF OBJECT_ID('dbo.sp_GetDriversByStatus', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDriversByStatus;
GO
CREATE PROCEDURE dbo.sp_GetDriversByStatus
    @MedicalStatus NVARCHAR(255) = NULL,
    @PoliceStatus NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, aadhar_card,
           pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE (@MedicalStatus IS NULL OR medical_report = @MedicalStatus)
      AND (@PoliceStatus IS NULL OR police_verification = @PoliceStatus)
    ORDER BY id ASC;
END
GO

IF OBJECT_ID('dbo.sp_GetDriverWalletTransactions', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDriverWalletTransactions;
GO
CREATE PROCEDURE dbo.sp_GetDriverWalletTransactions
    @DriverId INT,
    @Page INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, transaction_id, user_id, driver_id, shipment_id, type, amount,
           description, status, payment_method, reference, metadata, created_at, updated_at
    FROM transactions
    WHERE driver_id = @DriverId
    ORDER BY created_at DESC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

IF OBJECT_ID('dbo.sp_UpdateDriverStatus', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateDriverStatus;
GO
CREATE PROCEDURE dbo.sp_UpdateDriverStatus
    @DriverId INT,
    @MedicalStatus NVARCHAR(255) = NULL,
    @PoliceStatus NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE drivers
    SET medical_report = COALESCE(@MedicalStatus, medical_report),
        police_verification = COALESCE(@PoliceStatus, police_verification)
    WHERE id = @DriverId;

    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, aadhar_card,
           pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE id = @DriverId;
END
GO

IF OBJECT_ID('dbo.sp_GetDriverSummary', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDriverSummary;
GO
CREATE PROCEDURE dbo.sp_GetDriverSummary
    @DriverId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, full_name, email, phone, dob, experience, license_number,
           bank_name, account_number, ifsc_code, bank_branch, aadhar_card,
           pan_card, medical_report, police_verification, license_file_path,
           police_file_path, bank_file_path, medical_file_path, aadhar_file_path,
           wallet_balance, created_at
    FROM drivers
    WHERE id = @DriverId;

    SELECT COUNT(*) AS TotalShipments,
           SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS DeliveredShipments,
           SUM(CASE WHEN status = 'Loading' THEN 1 ELSE 0 END) AS InProgressShipments,
           SUM(freight_charge) AS TotalFreight
    FROM shipments
    WHERE driver_id = @DriverId;

    SELECT COUNT(*) AS TotalTransactions,
           SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS TotalCredit,
           SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS TotalDebit
    FROM transactions
    WHERE driver_id = @DriverId;
END
GO

IF OBJECT_ID('dbo.sp_CheckDriverAvailability', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CheckDriverAvailability;
GO
CREATE PROCEDURE dbo.sp_CheckDriverAvailability
    @DriverId INT,
    @FromDate DATE = NULL,
    @ToDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, tracking_id, destination, driver_id, status, created_at
    FROM shipments
    WHERE driver_id = @DriverId
      AND (@FromDate IS NULL OR created_at >= @FromDate)
      AND (@ToDate IS NULL OR created_at <= @ToDate)
    ORDER BY created_at DESC;
END
GO

IF OBJECT_ID('dbo.sp_GetDriversWithLowBalance', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDriversWithLowBalance;
GO
CREATE PROCEDURE dbo.sp_GetDriversWithLowBalance
    @Threshold DECIMAL(10,2) = 100.00
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, full_name, email, phone, wallet_balance, created_at
    FROM drivers
    WHERE wallet_balance < @Threshold
    ORDER BY wallet_balance ASC;
END
GO
-- =============================================
-- Table: branches
-- =============================================
CREATE TABLE branches (
    id INT IDENTITY(1,1) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(500) NULL,
    city NVARCHAR(100) NULL,
    state NVARCHAR(100) NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT PK_branches PRIMARY KEY (id)
);
GO
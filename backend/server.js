// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { S3Client } from '@aws-sdk/client-s3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================================
// CORS Configuration
// ==========================================
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 1. AWS S3 Setup (Cloud Storage)
// ==========================================
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'DUMMY_KEY',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'DUMMY_SECRET'
    }
});

// ==========================================
// 2. MySQL Database Connection
// ==========================================
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'logistics_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
});

// Test Database Connection
const testConnection = async () => {
    try {
        const conn = await db.getConnection();
        console.log('✅ Connected successfully to MySQL Database!');
        conn.release();
        return true;
    } catch (err) {
        console.error('❌ MySQL database connection failed:', err.message);
        return false;
    }
};

testConnection();

// ==========================================
// 3. Web3 / Polygon Blockchain Setup
// ==========================================
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology';
const PRIVATE_KEY = process.env.BACKEND_API_PRIVATE_KEY || '0x0000000000000000000000000000000000000000';
const VAULT_ADDRESS = process.env.COMPLIANCE_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000';

const VaultABI = [
    "function storeDocument(string calldata entityId, string calldata docType, string calldata documentHash, uint256 expiryTime) external"
];

let provider = null;
let wallet = null;
let complianceVault = null;
try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    complianceVault = new ethers.Contract(VAULT_ADDRESS, VaultABI, wallet);
    console.log("✅ Web3 Blockchain Components Initialized.");
} catch (bcInitError) {
    console.log("⚠️ Web3 Initialization Alert: Running in Local Mock Mode.");
}

// ==========================================
// 4. Multer Memory Storage Configuration
// ==========================================
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Driver upload with multiple files
const driverUpload = upload.fields([
    { name: 'licenseFile', maxCount: 1 },
    { name: 'policeFile', maxCount: 1 },
    { name: 'bankFile', maxCount: 1 },
    { name: 'medicalFile', maxCount: 1 },
    { name: 'aadharFile', maxCount: 1 }
]);

// ==========================================
// 5. Helper Functions
// ==========================================
const generateTrackingId = (id) => {
    const prefix = 'TRK';
    const year = new Date().getFullYear();
    const paddedId = String(id).padStart(4, '0');
    return `${prefix}-${year}-${paddedId}`;
};

const generateChallanNumber = () => {
    const prefix = 'CHL';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${prefix}-${year}${month}${day}-${random}`;
};

const generateLRNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `LR${year}${month}${day}${random}`;
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this', (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ==========================================
// 6. LOGIN ROUTE
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`🔐 Login attempt for: ${email}`);

        // 1️⃣ CHECK: Admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@cargomax.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (email === adminEmail && password === adminPassword) {
            const token = jwt.sign(
                { email: email, role: 'admin', name: 'Admin' },
                process.env.JWT_SECRET || 'your-secret-key-change-this',
                { expiresIn: '24h' }
            );
            return res.json({
                success: true,
                message: 'Admin login successful',
                token: token,
                role: 'admin',
                user: { name: 'Admin', email: email, role: 'admin' }
            });
        }

        // 2️⃣ CHECK: Drivers
        const [drivers] = await db.query('SELECT * FROM drivers WHERE email = ?', [email]);
        
        if (drivers.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const driver = drivers[0];
        const isMatch = (password === driver.password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const role = 'driver';
        const token = jwt.sign(
            { 
                id: driver.id, 
                email: driver.email, 
                role: role, 
                name: driver.full_name 
            },
            process.env.JWT_SECRET || 'your-secret-key-change-this',
            { expiresIn: '24h' }
        );
        
        return res.json({
            success: true,
            message: 'Driver login successful',
            token: token,
            role: role,
            user: { 
                id: driver.id, 
                name: driver.full_name, 
                email: driver.email, 
                phone: driver.phone, 
                role: role 
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// ==========================================
// 7. SHIPMENT / LR ROUTES
// ==========================================

// GET all shipments (LRs)
app.get('/api/shipments', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, 
                   d.full_name as driver_name,
                   d.phone as driver_phone,
                   d.email as driver_email,
                   v.vehicle_id as vehicle_code,
                   v.license_plate,
                   v.type as vehicle_type
            FROM shipments s
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            ORDER BY s.id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single shipment with details
app.get('/api/shipments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT s.*, 
                   d.full_name as driver_name,
                   d.phone as driver_phone,
                   d.email as driver_email,
                   v.vehicle_id as vehicle_code,
                   v.license_plate,
                   v.type as vehicle_type
            FROM shipments s
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching shipment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE shipment (LR)
app.post('/api/shipments', authenticateToken, async (req, res) => {
    try {
        const { 
            destination, 
            client, 
            weight, 
            driver_id, 
            vehicle_id, 
            eta, 
            status, 
            notes,
            pickup_location,
            delivery_location,
            freight_charge,
            gst,
            payment_mode,
            goods_desc,
            packages,
            weight_type,
            invoice_no,
            invoice_value,
            eway_bill,
            lr_number,
            booking_date
        } = req.body;

        // Generate LR number if not provided
        const lrNum = lr_number || generateLRNumber();
        const challanNumber = generateChallanNumber();

        // Check if LR number already exists
        const [existingLR] = await db.query('SELECT id FROM shipments WHERE lr_number = ?', [lrNum]);
        if (existingLR.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'LR number already exists. Please refresh and try again.'
            });
        }

        const [result] = await db.query(
            `INSERT INTO shipments 
             (lr_number, booking_date, destination, client, weight, driver_id, vehicle_id, 
              eta, status, notes, pickup_location, delivery_location, freight_charge, 
              gst, payment_mode, goods_desc, packages, weight_type, invoice_no, 
              invoice_value, eway_bill, challan_number)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                lrNum,
                booking_date || new Date().toISOString().split('T')[0],
                destination, 
                client, 
                weight || 0, 
                driver_id || null, 
                vehicle_id || null, 
                eta || null, 
                status || 'pending', 
                notes || '',
                pickup_location || destination,
                delivery_location || '',
                freight_charge || 0,
                gst || 0,
                payment_mode || 'cash',
                goods_desc || '',
                packages || 0,
                weight_type || 'kg',
                invoice_no || null,
                invoice_value || 0,
                eway_bill || null,
                challanNumber
            ]
        );

        const trackingId = generateTrackingId(result.insertId);
        await db.query(`UPDATE shipments SET tracking_id = ? WHERE id = ?`, [trackingId, result.insertId]);

        const [shipment] = await db.query(`
            SELECT s.*, 
                   d.full_name as driver_name,
                   d.phone as driver_phone,
                   v.vehicle_id as vehicle_code,
                   v.license_plate
            FROM shipments s
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'LR/Shipment created successfully',
            data: shipment[0]
        });
    } catch (error) {
        console.error('Error creating shipment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE shipment (LR)
app.put('/api/shipments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            destination, 
            client, 
            weight, 
            driver_id, 
            vehicle_id, 
            eta, 
            status, 
            notes,
            pickup_location,
            delivery_location,
            freight_charge,
            gst,
            payment_mode,
            goods_desc,
            packages,
            weight_type,
            invoice_no,
            invoice_value,
            eway_bill
        } = req.body;

        const [existing] = await db.query('SELECT id FROM shipments WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        await db.query(
            `UPDATE shipments SET 
             destination = ?, 
             client = ?, 
             weight = ?, 
             driver_id = ?, 
             vehicle_id = ?, 
             eta = ?, 
             status = ?, 
             notes = ?,
             pickup_location = ?,
             delivery_location = ?,
             freight_charge = ?,
             gst = ?,
             payment_mode = ?,
             goods_desc = ?,
             packages = ?,
             weight_type = ?,
             invoice_no = ?,
             invoice_value = ?,
             eway_bill = ?
             WHERE id = ?`,
            [
                destination, 
                client, 
                weight, 
                driver_id, 
                vehicle_id, 
                eta, 
                status, 
                notes,
                pickup_location,
                delivery_location,
                freight_charge,
                gst,
                payment_mode,
                goods_desc,
                packages,
                weight_type,
                invoice_no,
                invoice_value,
                eway_bill,
                id
            ]
        );

        const [shipment] = await db.query(`
            SELECT s.*, 
                   d.full_name as driver_name,
                   d.phone as driver_phone,
                   v.vehicle_id as vehicle_code,
                   v.license_plate
            FROM shipments s
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Shipment updated successfully',
            data: shipment[0]
        });
    } catch (error) {
        console.error('Error updating shipment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE shipment
app.delete('/api/shipments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.query('SELECT id FROM shipments WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }
        await db.query('DELETE FROM shipments WHERE id = ?', [id]);
        res.json({ success: true, message: 'Shipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting shipment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// 8. CHALLAN / BILL GENERATION ROUTES
// ==========================================

// Generate PDF Challan
app.get('/api/shipments/:id/challan', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await db.query(`
            SELECT s.*, 
                   d.full_name as driver_name,
                   d.phone as driver_phone,
                   d.email as driver_email,
                   v.vehicle_id as vehicle_code,
                   v.license_plate,
                   v.type as vehicle_type
            FROM shipments s
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        const shipment = rows[0];

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=challan-${shipment.challan_number || shipment.tracking_id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor('#1a237e')
           .text('CARGO MAX LOGISTICS', { align: 'center' });
        
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#333')
           .text('FleetChain - Hybrid Web3 Logistics Platform', { align: 'center' })
           .moveDown();

        doc.strokeColor('#1a237e')
           .lineWidth(2)
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke()
           .moveDown();

        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor('#d32f2f')
           .text('TRANSPORT CHALLAN / BILL', { align: 'center' })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#333')
           .text(`LR No: ${shipment.lr_number || 'N/A'}`, { align: 'right' })
           .text(`Challan No: ${shipment.challan_number || 'N/A'}`, { align: 'right' })
           .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' })
           .text(`Tracking ID: ${shipment.tracking_id || 'N/A'}`, { align: 'right' })
           .moveDown();

        const leftX = 50;
        const rightX = 300;
        let yPos = doc.y;

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#1a237e')
           .text('SHIPPER DETAILS', leftX, yPos);
        
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor('#333')
           .text(`Client: ${shipment.client || 'N/A'}`, leftX, doc.y + 5)
           .text(`Pickup: ${shipment.pickup_location || shipment.destination || 'N/A'}`, leftX, doc.y + 5);

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#1a237e')
           .text('CONSIGNEE DETAILS', rightX, yPos);
        
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor('#333')
           .text(`Destination: ${shipment.destination || 'N/A'}`, rightX, doc.y + 5)
           .text(`Delivery: ${shipment.delivery_location || 'N/A'}`, rightX, doc.y + 5);

        doc.moveDown(2);

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#1a237e')
           .text('GOODS DETAILS', 50, doc.y)
           .moveDown(0.5);

        const goodsData = [
            ['Description', shipment.goods_desc || 'N/A'],
            ['Packages', shipment.packages || '0'],
            ['Weight', `${shipment.weight || '0'} ${shipment.weight_type || 'kg'}`],
            ['Invoice No', shipment.invoice_no || 'N/A'],
            ['Invoice Value', `₹${shipment.invoice_value || '0'}`],
            ['E-Way Bill', shipment.eway_bill || 'N/A']
        ];

        let goodsY = doc.y;
        goodsData.forEach(([label, value]) => {
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor('#555')
               .text(`${label}: `, 50, goodsY, { continued: true })
               .font('Helvetica')
               .fillColor('#333')
               .text(value);
            goodsY = doc.y;
        });

        doc.moveDown(2);

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#1a237e')
           .text('TRANSPORT DETAILS', 50, doc.y)
           .moveDown(0.5);

        const tableData = [
            ['Vehicle No', shipment.vehicle_code || 'N/A'],
            ['License Plate', shipment.license_plate || 'N/A'],
            ['Vehicle Type', shipment.vehicle_type || 'N/A'],
            ['Driver', shipment.driver_name || 'N/A'],
            ['Driver Phone', shipment.driver_phone || 'N/A'],
            ['Status', shipment.status || 'pending'],
            ['ETA', shipment.eta || 'N/A']
        ];

        let tableY = doc.y;
        tableData.forEach(([label, value]) => {
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor('#555')
               .text(`${label}: `, 50, tableY, { continued: true })
               .font('Helvetica')
               .fillColor('#333')
               .text(value);
            tableY = doc.y;
        });

        doc.moveDown(2);

        const totalFreight = parseFloat(shipment.freight_charge) || 0;
        const gstPercent = parseFloat(shipment.gst) || 0;
        const gstAmount = (totalFreight * gstPercent) / 100;
        const grandTotal = totalFreight + gstAmount;

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#1a237e')
           .text('FREIGHT CHARGES', 50, doc.y)
           .moveDown(0.5);

        const chargeY = doc.y;
        
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor('#333')
           .text(`Freight Charge: ₹${totalFreight.toFixed(2)}`, 50, chargeY)
           .text(`GST (${gstPercent}%): ₹${gstAmount.toFixed(2)}`, 300, chargeY)
           .moveDown();

        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor('#d32f2f')
           .text(`GRAND TOTAL: ₹${grandTotal.toFixed(2)}`, 50, doc.y)
           .text(`Payment Mode: ${shipment.payment_mode || 'cash'}`, 300, doc.y);

        doc.moveDown(2);

        const termsY = doc.y + 20;
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#1a237e')
           .text('TERMS & CONDITIONS:', 50, termsY)
           .font('Helvetica')
           .fontSize(9)
           .fillColor('#555')
           .text('1. Goods are transported at owner\'s risk.', 50, doc.y + 5)
           .text('2. Please check goods before signing.', 50, doc.y + 5)
           .text('3. This challan is valid for 7 days.', 50, doc.y + 5)
           .text('4. For any dispute, jurisdiction will be local courts.', 50, doc.y + 5);

        doc.moveDown(3);

        const signY = doc.y;
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor('#333');

        doc.text('Shipper Signature', 50, signY);
        doc.font('Helvetica-Bold')
           .text('___________________', 50, doc.y + 5);
        doc.font('Helvetica')
           .text(`${shipment.client || 'N/A'}`, 50, doc.y + 5);

        doc.text('Carrier Signature', 350, signY);
        doc.font('Helvetica-Bold')
           .text('___________________', 350, doc.y + 5);
        doc.font('Helvetica')
           .text(`${shipment.driver_name || 'N/A'}`, 350, doc.y + 5);

        doc.moveDown(4);

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#999')
           .text('Generated by CargoMax FleetChain System', { align: 'center' })
           .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Error generating challan:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// 9. DRIVERS ROUTES
// ==========================================

// GET all drivers
app.get('/api/drivers', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, full_name, email, phone, experience, license_number, 
                    bank_name, account_number, ifsc_code, bank_branch, 
                    aadhar_card, pan_card, medical_report, police_verification, 
                    DATE_FORMAT(dob, "%Y-%m-%d") as dob, city, state, pincode,
                    license_file_path, police_file_path, bank_file_path, medical_file_path, aadhar_file_path 
            FROM drivers ORDER BY id DESC`
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Fetch Error:', error.message);
        return res.status(500).json({ success: false, message: `Database Error: ${error.message}` });
    }
});

// POST - Register new driver
app.post('/api/drivers', driverUpload, async (req, res) => {
    try {
        console.log(">>>>>>>> Driver Registration Request Received >>>>>>>>");

        const {
            fullName, email, phone, password, experience, licenseNumber,
            bankName, accountNumber, ifscCode, bankBranch, aadharCard,
            panCard, medicalReport, policeVerification, dob, city, state, pincode
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required!' });
        }

        const [existingDriver] = await db.query('SELECT id FROM drivers WHERE email = ?', [email]);
        if (existingDriver.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered!' });
        }

        const getFilePath = (fieldName) => {
            if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
                const fileObj = req.files[fieldName][0];
                return `https://my-fleet-bucket.s3.amazonaws.com/drivers/${Date.now()}-${fileObj.originalname}`;
            }
            return null;
        };

        const licensePath = getFilePath('licenseFile');
        const policePath = getFilePath('policeFile');
        const bankPath = getFilePath('bankFile');
        const medicalPath = getFilePath('medicalFile');
        const aadharPath = getFilePath('aadharFile');

        if (!req.files || !req.files['licenseFile']) {
            return res.status(400).json({ 
                success: false, 
                message: 'License file upload is mandatory for drivers!' 
            });
        }

        const file = req.files['licenseFile'][0];
        const fileHash = '0x' + crypto.createHash('sha256').update(file.buffer).digest('hex');
        console.log(`[Security] License File Hash Generated: ${fileHash}`);

        const sqlQuery = `
            INSERT INTO drivers 
            (full_name, email, phone, password, dob, experience, license_number, 
             bank_name, account_number, ifsc_code, bank_branch, aadhar_card, pan_card, 
             medical_report, police_verification, city, state, pincode,
             license_file_path, police_file_path, bank_file_path, medical_file_path, aadhar_file_path) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            fullName || '', email, phone || '', password,
            dob || null, experience ? parseInt(experience) : 0,
            licenseNumber || '', bankName || null, accountNumber || null,
            ifscCode || null, bankBranch || null, aadharCard || '',
            panCard || null, medicalReport || 'Pending', policeVerification || 'Pending',
            city || null, state || null, pincode || null,
            licensePath, policePath, bankPath, medicalPath, aadharPath
        ];

        const [result] = await db.query(sqlQuery, values);
        const driverId = result.insertId.toString();

        return res.status(201).json({
            success: true,
            message: 'Driver registered successfully!',
            fileHash: fileHash,
            driverId: driverId
        });

    } catch (error) {
        console.error('❌ Server Error:', error);
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
});

// DELETE Driver
app.delete('/api/drivers/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [existingDriver] = await db.query('SELECT id FROM drivers WHERE id = ?', [id]);
        if (existingDriver.length === 0) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }
        await db.query('DELETE FROM drivers WHERE id = ?', [id]);
        res.json({ success: true, message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting driver:', error);
        res.status(500).json({ success: false, message: 'Failed to delete driver' });
    }
});

// UPDATE Driver
app.put('/api/drivers/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fullName, email, phone, experience, licenseNumber,
            bankName, accountNumber, ifscCode, bankBranch, aadharCard,
            panCard, medicalReport, policeVerification, dob, city, state, pincode
        } = req.body;

        const [existingDriver] = await db.query('SELECT id FROM drivers WHERE id = ?', [id]);
        if (existingDriver.length === 0) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        await db.query(
            `UPDATE drivers SET 
             full_name = ?, email = ?, phone = ?, dob = ?, experience = ?,
             license_number = ?, bank_name = ?, account_number = ?, ifsc_code = ?,
             bank_branch = ?, aadhar_card = ?, pan_card = ?,
             medical_report = ?, police_verification = ?,
             city = ?, state = ?, pincode = ?
             WHERE id = ?`,
            [
                fullName || null, email || null, phone || null, dob || null,
                experience || 0, licenseNumber || null, bankName || null,
                accountNumber || null, ifscCode || null, bankBranch || null,
                aadharCard || null, panCard || null,
                medicalReport || 'Pending', policeVerification || 'Pending',
                city || null, state || null, pincode || null, id
            ]
        );

        const [updatedDriver] = await db.query(
            `SELECT id, full_name, email, phone, experience, license_number, 
                    bank_name, account_number, ifsc_code, bank_branch, 
                    aadhar_card, pan_card, medical_report, police_verification, 
                    city, state, pincode,
                    DATE_FORMAT(dob, "%Y-%m-%d") as dob 
            FROM drivers WHERE id = ?`,
            [id]
        );

        res.json({ success: true, message: 'Driver updated successfully', driver: updatedDriver[0] });
    } catch (error) {
        console.error('❌ Error updating driver:', error);
        res.status(500).json({ success: false, message: 'Failed to update driver' });
    }
});

// ==========================================
// 10. VEHICLES ROUTES
// ==========================================

app.get('/api/vehicles', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM vehicles ORDER BY id DESC");
        res.json(rows);
    } catch (err) {
        console.error("❌ Database fetch failed:", err);
        res.status(500).json({ success: false, error: "Database fetch failed" });
    }
});

app.post('/api/vehicles', authenticateToken, async (req, res) => {
    try {
        const { vehicleId, vehicleType, companyName, modelYear, licensePlate, pucNumber, notes } = req.body;
        const sql = `INSERT INTO vehicles 
            (vehicle_id, type, company_name, year, license_plate, puc_certificate_number, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [vehicleId, vehicleType, companyName, modelYear, licensePlate, pucNumber, notes]);
        res.status(201).json({ success: true, message: "Vehicle added successfully", id: result.insertId });
    } catch (err) {
        console.error("❌ SQL Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/vehicles/:id', authenticateToken, async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const { vehicle_id, type, company_name, year, license_plate, puc_certificate_number, notes } = req.body;

        const [existingVehicle] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
        if (existingVehicle.length === 0) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        await db.query(
            `UPDATE vehicles 
             SET vehicle_id = ?, type = ?, company_name = ?, year = ?, 
                 license_plate = ?, puc_certificate_number = ?, notes = ?
             WHERE id = ?`,
            [
                vehicle_id || existingVehicle[0].vehicle_id,
                type || existingVehicle[0].type,
                company_name || existingVehicle[0].company_name,
                year || existingVehicle[0].year,
                license_plate || existingVehicle[0].license_plate,
                puc_certificate_number || existingVehicle[0].puc_certificate_number,
                notes || existingVehicle[0].notes,
                vehicleId
            ]
        );

        const [updatedVehicle] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
        res.json({ success: true, message: 'Vehicle updated successfully', vehicle: updatedVehicle[0] });
    } catch (error) {
        console.error('❌ Error updating vehicle:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.delete('/api/vehicles/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [existingVehicle] = await db.query('SELECT id FROM vehicles WHERE id = ?', [id]);
        if (existingVehicle.length === 0) {
            return res.status(404).json({ success: false, message: 'Vehicle not found' });
        }
        await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
        res.json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting vehicle:', error);
        res.status(500).json({ success: false, message: 'Failed to delete vehicle' });
    }
});

// ==========================================
// 11. SYSTEM LOGS ROUTES
// ==========================================

app.get('/api/logs', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50'
        );
        console.log(`📋 Found ${rows.length} logs`);
        res.json(rows || []);
    } catch (error) {
        console.error('❌ Error fetching logs:', error);
        res.json([]);
    }
});

app.post('/api/logs', authenticateToken, async (req, res) => {
    try {
        const { type, title, description, time } = req.body;

        const [result] = await db.query(
            `INSERT INTO system_logs (type, title, description, time) 
             VALUES (?, ?, ?, ?)`,
            [type, title, description, time || new Date().toLocaleString()]
        );

        console.log('✅ Log created:', title);
        res.status(201).json({
            id: result.insertId,
            message: 'Log created successfully'
        });
    } catch (error) {
        console.error('❌ Error creating log:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 12. MAINTENANCE LOGS ROUTES
// ==========================================

app.get('/api/maintenance', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                ml.*,
                v.vehicle_id,
                v.license_plate,
                v.company_name,
                v.type as vehicle_type
            FROM maintenance_logs ml
            LEFT JOIN vehicles v ON ml.vehicle_id = v.id
            ORDER BY ml.created_at DESC
        `;
        const [rows] = await db.query(query);
        console.log(`📋 Fetched ${rows.length} maintenance logs`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching maintenance logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance logs',
            error: error.message
        });
    }
});

app.post('/api/maintenance', authenticateToken, async (req, res) => {
    try {
        console.log('📝 Creating maintenance log...');
        console.log('Request body:', req.body);

        const {
            vehicle_id,
            maintenance_type,
            category,
            description,
            service_date,
            cost,
            status = 'In Progress'
        } = req.body;

        if (!vehicle_id) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle ID is required'
            });
        }
        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Description is required'
            });
        }
        if (!service_date) {
            return res.status(400).json({
                success: false,
                message: 'Service date is required'
            });
        }

        const [vehicleCheck] = await db.query(
            'SELECT id FROM vehicles WHERE id = ?',
            [vehicle_id]
        );

        if (vehicleCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        const query = `
            INSERT INTO maintenance_logs 
            (vehicle_id, maintenance_type, category, description, service_date, cost, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            vehicle_id,
            maintenance_type || null,
            category || null,
            description,
            service_date,
            cost || 0,
            status
        ]);

        const [newLog] = await db.query(
            `SELECT 
                ml.*,
                v.vehicle_id,
                v.license_plate,
                v.company_name
            FROM maintenance_logs ml
            LEFT JOIN vehicles v ON ml.vehicle_id = v.id
            WHERE ml.id = ?`,
            [result.insertId]
        );

        console.log('✅ Maintenance log created with ID:', result.insertId);
        res.status(201).json({
            success: true,
            message: 'Maintenance log created successfully',
            data: newLog[0]
        });

    } catch (error) {
        console.error('❌ Error creating maintenance log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create maintenance log',
            error: error.message
        });
    }
});

app.put('/api/maintenance/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            maintenance_type,
            category,
            description,
            service_date,
            cost,
            status
        } = req.body;

        const [existingLog] = await db.query(
            'SELECT id FROM maintenance_logs WHERE id = ?',
            [id]
        );

        if (existingLog.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance log not found'
            });
        }

        const query = `
            UPDATE maintenance_logs 
            SET 
                maintenance_type = ?,
                category = ?,
                description = ?,
                service_date = ?,
                cost = ?,
                status = ?
            WHERE id = ?
        `;

        await db.query(query, [
            maintenance_type || null,
            category || null,
            description,
            service_date,
            cost || 0,
            status || 'In Progress',
            id
        ]);

        const [updatedLog] = await db.query(
            `SELECT 
                ml.*,
                v.vehicle_id,
                v.license_plate,
                v.company_name
            FROM maintenance_logs ml
            LEFT JOIN vehicles v ON ml.vehicle_id = v.id
            WHERE ml.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Maintenance log updated successfully',
            data: updatedLog[0]
        });

    } catch (error) {
        console.error('❌ Error updating maintenance log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update maintenance log',
            error: error.message
        });
    }
});

app.delete('/api/maintenance/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [existingLog] = await db.query(
            'SELECT id FROM maintenance_logs WHERE id = ?',
            [id]
        );

        if (existingLog.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance log not found'
            });
        }

        await db.query(
            'DELETE FROM maintenance_logs WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Maintenance log deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting maintenance log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete maintenance log',
            error: error.message
        });
    }
});

// ==========================================
// 13. PAYMENTS ROUTES
// ==========================================

// Create payments table if it doesn't exist
db.query(`
    CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driver_id INT NOT NULL,
        shipment_id INT,
        amount DECIMAL(10,2) NOT NULL,
        checkpoint VARCHAR(255),
        upi_id VARCHAR(255),
        upi_ref VARCHAR(255),
        note TEXT,
        status ENUM('pending','completed','failed') DEFAULT 'pending',
        paid_by VARCHAR(255) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL
    )
`).catch(err => console.error('Payments table creation error:', err));

app.get('/api/payments', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, d.full_name as driver_name, d.email as driver_email,
                   s.destination, s.tracking_id
            FROM payments p
            LEFT JOIN drivers d ON p.driver_id = d.id
            LEFT JOIN shipments s ON p.shipment_id = s.id
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/payments/driver/:driverId', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, s.destination, s.tracking_id
            FROM payments p
            LEFT JOIN shipments s ON p.shipment_id = s.id
            WHERE p.driver_id = ?
            ORDER BY p.created_at DESC
        `, [req.params.driverId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
    try {
        const { driver_id, shipment_id, amount, checkpoint, upi_id, upi_ref, note, paid_by } = req.body;
        if (!driver_id || !amount || !upi_id) {
            return res.status(400).json({ success: false, message: 'driver_id, amount and upi_id are required' });
        }
        const [result] = await db.query(
            `INSERT INTO payments (driver_id, shipment_id, amount, checkpoint, upi_id, upi_ref, note, status, paid_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
            [driver_id, shipment_id || null, amount, checkpoint || null, upi_id, upi_ref || null, note || null, paid_by || 'admin']
        );
        res.json({ success: true, message: 'Payment recorded successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/payments/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// 14. DEBUG ROUTES
// ==========================================

app.get('/api/debug/drivers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, full_name, email, phone, password FROM drivers');
        res.json({ 
            success: true, 
            count: rows.length,
            drivers: rows 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 15. HOME ROUTE
// ==========================================

app.get('/', (req, res) => {
    res.send(`
        <h1>🚛 FleetChain Hybrid Web3 Backend</h1>
        <p>Server is running perfectly!</p>
        <h3>Available Endpoints:</h3>
        <ul>
            <li>POST /api/auth/login - Login</li>
            <li>GET /api/shipments - Get all shipments/LRs</li>
            <li>POST /api/shipments - Create new shipment/LR</li>
            <li>GET /api/shipments/:id - Get single shipment</li>
            <li>PUT /api/shipments/:id - Update shipment</li>
            <li>DELETE /api/shipments/:id - Delete shipment</li>
            <li>GET /api/shipments/:id/challan - Download challan PDF</li>
            <li>GET /api/drivers - Get all drivers</li>
            <li>POST /api/drivers - Register driver</li>
            <li>GET /api/vehicles - Get all vehicles</li>
            <li>POST /api/vehicles - Add vehicle</li>
            <li>GET /api/payments - Get all payments</li>
            <li>POST /api/payments - Create payment</li>
            <li>GET /api/maintenance - Get maintenance logs</li>
            <li>POST /api/maintenance - Create maintenance log</li>
        </ul>
        <p>📡 API base URL: http://localhost:${process.env.PORT || 5000}/api/</p>
    `);
});

// ==========================================
// 16. START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Node.js Backend Server is running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`📄 Challan PDF: http://localhost:${PORT}/api/shipments/:id/challan`);
    console.log(`🔍 Debug Drivers: http://localhost:${PORT}/api/debug/drivers`);
});

export default app;
from flask import request, jsonify
from flask_jwt_extended import jwt_required
import random
from datetime import datetime
from routes import shipment_bp
from database import Database

db = Database()

def generate_tracking_id(id_num):
    prefix = 'TRK'
    year = datetime.now().year
    padded_id = str(id_num).zfill(4)
    return f"{prefix}-{year}-{padded_id}"

def generate_challan_number():
    prefix = 'CHL'
    date = datetime.now()
    year = date.year
    month = str(date.month).zfill(2)
    day = str(date.day).zfill(2)
    random_num = str(random.randint(0, 9999)).zfill(4)
    return f"{prefix}-{year}{month}{day}-{random_num}"

def generate_lr_number():
    date = datetime.now()
    year = date.year
    month = str(date.month).zfill(2)
    day = str(date.day).zfill(2)
    random_num = str(random.randint(0, 9999)).zfill(4)
    return f"LR{year}{month}{day}{random_num}"

@shipment_bp.route('/', methods=['GET'])
@jwt_required()
def get_shipments():
    try:
        shipments = db.get_all_shipments()
        return jsonify({'success': True, 'data': shipments})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@shipment_bp.route('/<int:shipment_id>', methods=['GET'])
@jwt_required()
def get_shipment(shipment_id):
    try:
        shipment = db.get_shipment_by_id(shipment_id)
        if not shipment:
            return jsonify({'success': False, 'message': 'Shipment not found'}), 404
        return jsonify({'success': True, 'data': shipment})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@shipment_bp.route('/', methods=['POST'])
@jwt_required()
def create_shipment():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        lr_number = data.get('lr_number') or generate_lr_number()
        challan_number = generate_challan_number()
        
        if db.get_shipment_by_lr_number(lr_number):
            return jsonify({'success': False, 'message': 'LR number already exists'}), 400
        
        shipment_data = {
            'lr_number': lr_number,
            'booking_date': data.get('booking_date') or datetime.now().strftime('%Y-%m-%d'),
            'destination': data.get('destination'),
            'client': data.get('client'),
            'weight': data.get('weight', 0),
            'driver_id': data.get('driver_id'),
            'vehicle_id': data.get('vehicle_id'),
            'eta': data.get('eta'),
            'status': data.get('status', 'pending'),
            'notes': data.get('notes', ''),
            'pickup_location': data.get('pickup_location'),
            'delivery_location': data.get('delivery_location'),
            'freight_charge': data.get('freight_charge', 0),
            'gst': data.get('gst', 0),
            'payment_mode': data.get('payment_mode', 'cash'),
            'goods_desc': data.get('goods_desc', ''),
            'packages': data.get('packages', 0),
            'weight_type': data.get('weight_type', 'kg'),
            'invoice_no': data.get('invoice_no'),
            'invoice_value': data.get('invoice_value', 0),
            'eway_bill': data.get('eway_bill'),
            'challan_number': challan_number
        }
        
        shipment_id = db.create_shipment(shipment_data)
        tracking_id = generate_tracking_id(shipment_id)
        db.update_shipment_tracking_id(shipment_id, tracking_id)
        
        return jsonify({
            'success': True,
            'message': 'Shipment created successfully',
            'data': db.get_shipment_by_id(shipment_id)
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@shipment_bp.route('/<int:shipment_id>', methods=['PUT'])
@jwt_required()
def update_shipment(shipment_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        if not db.get_shipment_by_id(shipment_id):
            return jsonify({'success': False, 'message': 'Shipment not found'}), 404
        
        if db.update_shipment(shipment_id, data):
            return jsonify({
                'success': True,
                'message': 'Shipment updated successfully',
                'data': db.get_shipment_by_id(shipment_id)
            })
        return jsonify({'success': False, 'message': 'Failed to update shipment'}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@shipment_bp.route('/<int:shipment_id>', methods=['DELETE'])
@jwt_required()
def delete_shipment(shipment_id):
    try:
        if not db.get_shipment_by_id(shipment_id):
            return jsonify({'success': False, 'message': 'Shipment not found'}), 404
        
        if db.delete_shipment(shipment_id):
            return jsonify({'success': True, 'message': 'Shipment deleted successfully'})
        return jsonify({'success': False, 'message': 'Failed to delete shipment'}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
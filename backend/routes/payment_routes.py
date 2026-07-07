from flask import request, jsonify
from flask_jwt_extended import jwt_required
from routes import payment_bp
from database import Database

db = Database()

@payment_bp.route('/', methods=['GET'])
@jwt_required()
def get_payments():
    try:
        payments = db.get_all_payments()
        return jsonify({'success': True, 'data': payments})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@payment_bp.route('/driver/<int:driver_id>', methods=['GET'])
@jwt_required()
def get_driver_payments(driver_id):
    try:
        payments = db.get_driver_payments(driver_id)
        return jsonify({'success': True, 'data': payments})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@payment_bp.route('/', methods=['POST'])
@jwt_required()
def create_payment():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        required = ['driver_id', 'amount', 'upi_id']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        payment_data = {
            'driver_id': data['driver_id'],
            'shipment_id': data.get('shipment_id'),
            'amount': data['amount'],
            'checkpoint': data.get('checkpoint'),
            'upi_id': data['upi_id'],
            'upi_ref': data.get('upi_ref'),
            'note': data.get('note'),
            'status': 'completed',
            'paid_by': data.get('paid_by', 'admin')
        }
        
        payment_id = db.create_payment(payment_data)
        return jsonify({
            'success': True,
            'message': 'Payment recorded successfully',
            'id': payment_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@payment_bp.route('/<int:payment_id>', methods=['DELETE'])
@jwt_required()
def delete_payment(payment_id):
    try:
        if db.delete_payment(payment_id):
            return jsonify({'success': True, 'message': 'Payment deleted'})
        return jsonify({'success': False, 'message': 'Payment not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
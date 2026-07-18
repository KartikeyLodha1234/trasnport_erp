from fastapi import APIRouter, HTTPException
from database import Database

router = APIRouter()
db = Database()

@router.get("")
def get_payments_no_slash():
    return get_payments()

@router.get("/")
def get_payments():
    try:
        payments = db.get_all_payments()
        return {'success': True, 'data': payments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/driver/{driver_id}")
def get_driver_payments(driver_id: int):
    try:
        payments = db.get_driver_payments(driver_id)
        return {'success': True, 'data': payments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_payment_no_slash(data: dict):
    return create_payment(data)

@router.post("/")
def create_payment(data: dict):
    try:
        required = ['driver_id', 'amount', 'upi_id']
        for field in required:
            if not data.get(field):
                raise HTTPException(status_code=400, detail=f'{field} is required')

        payment_data = {
            'driver_id': data['driver_id'],
            'shipment_id': data.get('shipment_id'),
            'amount': data['amount'],
            'checkpoint_name': data.get('checkpoint_name'),
            'upi_id': data['upi_id'],
            'upi_ref': data.get('upi_ref'),
            'note': data.get('note'),
            'status': 'completed',
            'paid_by': data.get('paid_by', 'admin')
        }

        payment_id = db.create_payment(payment_data)
        return {'success': True, 'message': 'Payment recorded', 'id': payment_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{payment_id}")
def delete_payment(payment_id: int):
    try:
        if db.delete_payment(payment_id):
            return {'success': True, 'message': 'Payment deleted'}
        raise HTTPException(status_code=404, detail="Payment not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
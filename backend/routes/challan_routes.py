from fastapi import APIRouter, HTTPException
from database import db
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/")
def create_challan(data: dict):
    try:
        challan_no = data.get("challan_no")
        shipment_ids = data.get("shipment_ids", [])
        advance_paid = float(data.get("advance_paid", 0.0))
        driver_id = data.get("driver_id")
        vehicle_id = data.get("vehicle_id")
        
        # ✅ Validation
        if not challan_no:
            raise HTTPException(status_code=400, detail="Challan number is required")
        
        if not shipment_ids:
            raise HTTPException(status_code=400, detail="At least one shipment must be selected")
        
        if not driver_id:
            raise HTTPException(status_code=400, detail="Driver is required")
        
        if not vehicle_id:
            raise HTTPException(status_code=400, detail="Vehicle is required")
        
        logger.info(f"📋 Creating challan {challan_no} with {len(shipment_ids)} LRs, advance: {advance_paid}")
        
        # ✅ Create challan in database
        challan_id, error = db.create_challan_transactional(data)
        if error:
            logger.error(f"❌ Failed to create challan: {error}")
            raise HTTPException(status_code=500, detail=error)
        
        return {"success": True, "challan_id": challan_id, "challan_no": challan_no}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def get_challans():
    try:
        cursor = db.get_cursor()
        cursor.execute("""
            SELECT c.*, d.full_name as driver_name, 
                   v.vehicle_id as vehicle_code, v.license_plate
            FROM challans c
            LEFT JOIN drivers d ON c.driver_id = d.id
            LEFT JOIN vehicles v ON c.vehicle_id = v.id
            ORDER BY c.created_at DESC
        """)
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        data = []
        for row in rows:
            item = dict(zip(columns, row))
            for key, val in item.items():
                if hasattr(val, "isoformat"):
                    item[key] = str(val)
                if val.__class__.__name__ == "Decimal":
                    item[key] = float(val)
            data.append(item)
        cursor.close()
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"❌ Error fetching challans: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active")
def get_active_challans():
    cursor = db.get_cursor()
    if not cursor:
        raise HTTPException(status_code=503, detail="Database connection is unavailable")

    try:
        cursor.execute("""
            SELECT 
                c.challan_no as challan_id, 
                COALESCE(c.advance_paid, 0) as advance_paid, 
                c.status as challan_status,
                d.full_name as driver_name, 
                v.license_plate,
                v.vehicle_id as vehicle_code,
                s.id as shipment_id, 
                s.lr_number, 
                s.pickup_location, 
                s.delivery_location, 
                s.goods_desc, 
                s.weight, 
                s.weight_type, 
                COALESCE(s.freight_charge, 0) as freight_charge, 
                s.payment_mode, 
                s.status as shipment_status,
                s.driver_id as shipment_driver_id,
                s.vehicle_id as shipment_vehicle_id
            FROM challans c
            LEFT JOIN drivers d ON c.driver_id = d.id
            LEFT JOIN vehicles v ON c.vehicle_id = v.id
            LEFT JOIN shipments s ON s.challan_number = c.challan_no
            WHERE c.status NOT IN ('Settled', 'Cancelled')
            ORDER BY c.created_at DESC
        """)

        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        cursor.close()

        grouped_trips = {}
        for row in rows:
            item = dict(zip(columns, row))
            for key, val in item.items():
                if hasattr(val, "isoformat"):
                    item[key] = str(val)
                if val.__class__.__name__ == "Decimal":
                    item[key] = float(val)

            cid = str(item["challan_id"] or "UNKNOWN")
            safe_advance = float(item.get("advance_paid") or 0.0)

            if cid not in grouped_trips:
                grouped_trips[cid] = {
                    "challanId": cid,
                    "driverName": item["driver_name"] or f"Driver #{cid}",
                    "driverId": item.get("shipment_driver_id"),
                    "vehiclePlate": item["license_plate"] or "N/A",
                    "vehicleId": item.get("shipment_vehicle_id"),
                    "origin": "Warehouse",
                    "finalDest": "Destination",
                    "stops": [],
                    "totalTripPay": 0.0,
                    "advancePaid": safe_advance,
                    "toPayCollected": 0.0,
                }

            if item["shipment_id"]:
                if len(grouped_trips[cid]["stops"]) == 0:
                    grouped_trips[cid]["origin"] = (
                        item["pickup_location"] or "Warehouse"
                    )
                grouped_trips[cid]["finalDest"] = (
                    item["delivery_location"] or "Destination"
                )

                safe_weight = item.get("weight") or 0
                safe_weight_type = item.get("weight_type") or "kg"

                grouped_trips[cid]["stops"].append(
                    {
                        "id": item["lr_number"] or f"LR-{item['shipment_id']}",
                        "shipmentId": item["shipment_id"],
                        "destination": item["delivery_location"] or "N/A",
                        "cargo": item["goods_desc"] or "Commercial Goods",
                        "weight": f"{safe_weight} {safe_weight_type}",
                        "lrType": item["payment_mode"] or "TBB",
                        "status": item["shipment_status"] or "pending",
                    }
                )

                safe_freight = float(item.get("freight_charge") or 0.0)
                grouped_trips[cid]["totalTripPay"] += safe_freight

                # ✅ Only count as collected if delivered AND to_pay
                payment_mode = str(item.get("payment_mode") or "").upper()
                shipment_status = str(item.get("shipment_status") or "").lower()
                if payment_mode == "TOPAY" and shipment_status == "delivered":
                    grouped_trips[cid]["toPayCollected"] += safe_freight

        master_trips = []
        for cid, trip in grouped_trips.items():
            balance = trip["totalTripPay"] - trip["advancePaid"] - trip["toPayCollected"]
            master_trips.append(
                {
                    "challanId": trip["challanId"],
                    "driverName": trip["driverName"],
                    "driverId": trip["driverId"],
                    "vehiclePlate": trip["vehiclePlate"],
                    "vehicleId": trip["vehicleId"],
                    "origin": trip["origin"],
                    "finalDest": trip["finalDest"],
                    "stopCount": len(trip["stops"]),
                    "financials": {
                        "totalTripPay": round(trip["totalTripPay"], 2),
                        "advancePaid": round(trip["advancePaid"], 2),
                        "toPayCollected": round(trip["toPayCollected"], 2),
                        "balanceDue": round(balance, 2),
                    },
                    "web3Status": "Escrow Locked" if balance > 0 else "Settled",
                    "stops": trip["stops"],
                }
            )

        return {"success": True, "data": master_trips}
    except Exception as e:
        logger.error(f"❌ Error fetching active challans: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database logic error: {str(e)}")


@router.post("/{challan_id}/advance")
def issue_emergency_advance(challan_id: str, payload: dict):
    try:
        amount = float(payload.get("amount", 0))
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
            
        cursor = db.get_cursor()
        cursor.execute(
            "UPDATE challans SET advance_paid = COALESCE(advance_paid, 0) + ? WHERE challan_no = ?",
            (amount, challan_id),
        )
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Challan {challan_id} not found")
            
        cursor.connection.commit()
        cursor.close()
        
        logger.info(f"💰 Added advance {amount} to challan {challan_id}")
        return {"success": True, "message": f"Emergency advance of ₹{amount:,.2f} routed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error adding advance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{challan_id}/settle")
def settle_challan(challan_id: str, payload: dict):
    try:
        cursor = db.get_cursor()
        
        # ✅ Get current advance and total freight for verification
        cursor.execute("""
            SELECT 
                COALESCE(c.advance_paid, 0) as advance_paid,
                COALESCE(SUM(s.freight_charge), 0) as total_freight
            FROM challans c
            LEFT JOIN shipments s ON s.challan_number = c.challan_no
            WHERE c.challan_no = ?
            GROUP BY c.challan_no
        """, (challan_id,))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail=f"Challan {challan_id} not found")
            
        advance_paid = float(result[0] or 0)
        total_freight = float(result[1] or 0)
        balance = total_freight - advance_paid
        
        # ✅ Check if there's a balance due
        if balance > 0:
            logger.warning(f"⚠️ Challan {challan_id} has balance due: ₹{balance:,.2f}")
            # Still allow settlement but warn in response
        
        # ✅ Update challan status
        cursor.execute(
            "UPDATE challans SET status = 'Settled' WHERE challan_no = ?",
            (challan_id,)
        )
        cursor.connection.commit()
        cursor.close()
        
        logger.info(f"✅ Challan {challan_id} settled successfully")
        return {
            "success": True, 
            "message": f"Challan {challan_id} successfully settled.",
            "balance_due": round(balance, 2)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error settling challan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

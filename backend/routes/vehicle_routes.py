from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from database import db
import os
import traceback

router = APIRouter()

UPLOAD_FOLDER = "uploads/vehicles"
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif", "doc", "docx"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_file(file, vehicle_id, file_type):
    if file and file.filename:
        unique_filename = f"{vehicle_id}_{file_type}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        return file_path
    return None


@router.get("")
def get_vehicles_no_slash():
    return get_vehicles()


@router.get("/")
def get_vehicles():
    try:
        print("🔍 GET /api/vehicles/ called")
        vehicles = db.get_all_vehicles()
        print(f"✅ Found {len(vehicles)} vehicles")
        return {"success": True, "data": vehicles, "count": len(vehicles)}
    except Exception as e:
        print(f"❌ Error fetching vehicles: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: int):
    try:
        vehicle = db.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return {"success": True, "data": vehicle}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching vehicle: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_vehicle_no_slash(
    type: str = Form(...),
    company_name: str = Form(...),
    license_plate: str = Form(...),
    year: Optional[str] = Form(None),
    puc_certificate_number: Optional[str] = Form(None),
    puc_expiry_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    pucFile: Optional[UploadFile] = File(None),
):
    return await create_vehicle(
        type=type,
        company_name=company_name,
        license_plate=license_plate,
        year=year,
        puc_certificate_number=puc_certificate_number,
        puc_expiry_date=puc_expiry_date,
        notes=notes,
        pucFile=pucFile,
    )


@router.post("/")
async def create_vehicle(
    type: str = Form(...),
    company_name: str = Form(...),
    license_plate: str = Form(...),
    year: Optional[str] = Form(None),
    puc_certificate_number: Optional[str] = Form(None),
    puc_expiry_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    driver_id: Optional[str] = Form(None),  # ✅ ADD THIS LINE
    pucFile: Optional[UploadFile] = File(None),
):
    try:
        print("=" * 50)
        print("🔍 CREATE VEHICLE CALLED")
        print(f"  type: {type}")
        print(f"  company_name: {company_name}")
        print(f"  license_plate: {license_plate}")
        print(f"  year: {year}")
        print(f"  puc_certificate_number: {puc_certificate_number}")
        print(f"  puc_expiry_date: {puc_expiry_date}")
        print(f"  notes: {notes}")
        print(f"  pucFile: {pucFile.filename if pucFile else None}")
        print("=" * 50)
        
        vehicle_data = {
            "type": type,
            "company_name": company_name,
            "license_plate": license_plate,
            "year": year,
            "puc_certificate_number": puc_certificate_number,
            "puc_expiry_date": puc_expiry_date,
            "notes": notes,
        }

        print(f"🔍 Calling db.create_vehicle with: {vehicle_data}")
        
        # Check if db.create_vehicle exists
        if not hasattr(db, 'create_vehicle'):
            print("❌ db.create_vehicle does not exist!")
            raise HTTPException(status_code=500, detail="create_vehicle method not found in database")
        
        vehicle_id = db.create_vehicle(vehicle_data)
        print(f"🔍 vehicle_id from db: {vehicle_id}")
        
        if not vehicle_id:
            raise HTTPException(status_code=500, detail="Failed to create vehicle - database returned no ID")

        if pucFile and allowed_file(pucFile.filename):
            file_path = save_file(pucFile, vehicle_id, "puc")
            if file_path:
                db.update_vehicle(
                    vehicle_id, {"upload_puc_document_copy_file_path": file_path}
                )

        new_vehicle = db.get_vehicle_by_id(vehicle_id)
        print(f"✅ Vehicle created: {new_vehicle}")
        
        return {
            "success": True,
            "message": "Vehicle added",
            "id": vehicle_id,
            "data": new_vehicle,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating vehicle: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{vehicle_id}")
async def update_vehicle(
    vehicle_id: int,
    type: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    license_plate: Optional[str] = Form(None),
    year: Optional[str] = Form(None),
    puc_certificate_number: Optional[str] = Form(None),
    puc_expiry_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    pucFile: Optional[UploadFile] = File(None),
):
    try:
        if not db.get_vehicle_by_id(vehicle_id):
            raise HTTPException(status_code=404, detail="Vehicle not found")

        vehicle_data = {}
        if type is not None:
            vehicle_data["type"] = type
        if company_name is not None:
            vehicle_data["company_name"] = company_name
        if license_plate is not None:
            vehicle_data["license_plate"] = license_plate
        if year is not None:
            vehicle_data["year"] = year
        if puc_certificate_number is not None:
            vehicle_data["puc_certificate_number"] = puc_certificate_number
        if puc_expiry_date is not None:
            vehicle_data["puc_expiry_date"] = puc_expiry_date
        if notes is not None:
            vehicle_data["notes"] = notes
        if status is not None:
            vehicle_data["status"] = status

        if pucFile and allowed_file(pucFile.filename):
            file_path = save_file(pucFile, vehicle_id, "puc")
            if file_path:
                vehicle_data["upload_puc_document_copy_file_path"] = file_path

        if vehicle_data:
            db.update_vehicle(vehicle_id, vehicle_data)

        return {
            "success": True,
            "message": "Vehicle updated",
            "data": db.get_vehicle_by_id(vehicle_id),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating vehicle: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int):
    try:
        if not db.get_vehicle_by_id(vehicle_id):
            raise HTTPException(status_code=404, detail="Vehicle not found")
        if db.delete_vehicle(vehicle_id):
            return {"success": True, "message": "Vehicle deleted"}
        raise HTTPException(status_code=400, detail="Failed to delete vehicle")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting vehicle: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
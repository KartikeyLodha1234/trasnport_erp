from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from database import Database
import os
from datetime import date

router = APIRouter()
db = Database()

UPLOAD_FOLDER = 'uploads/drivers'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_file(file, driver_id, file_type):
    if file and file.filename:
        unique_filename = f"{driver_id}_{file_type}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        return file_path
    return None

@router.get("")
def get_drivers_no_slash():
    return get_drivers()

@router.get("/")
def get_drivers():
    try:
        drivers = db.get_all_drivers()
        return {'success': True, 'data': drivers, 'count': len(drivers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{driver_id}")
def get_driver(driver_id: int):
    try:
        driver = db.get_driver_by_id(driver_id)
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
        return {'success': True, 'data': driver}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_driver_no_slash(
    fullName: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    dob: Optional[str] = Form(None),
    experience: Optional[int] = Form(0),
    licenseNumber: Optional[str] = Form(None),
    bankName: Optional[str] = Form(None),
    accountNumber: Optional[str] = Form(None),
    ifscCode: Optional[str] = Form(None),
    bankBranch: Optional[str] = Form(None),
    aadharCard: Optional[str] = Form(None),
    panCard: Optional[str] = Form(None),
    medicalReport: Optional[str] = Form('Pending'),
    policeVerification: Optional[str] = Form('Pending'),
    emergencyContact: Optional[str] = Form(None),
    addressProof: Optional[str] = Form(None),
    licenseFile: Optional[UploadFile] = File(None),
    policeFile: Optional[UploadFile] = File(None),
    bankFile: Optional[UploadFile] = File(None),
    medicalFile: Optional[UploadFile] = File(None),
    aadharFile: Optional[UploadFile] = File(None),
):
    return await create_driver(
        fullName=fullName,
        email=email,
        phone=phone,
        password=password,
        dob=dob,
        experience=experience,
        licenseNumber=licenseNumber,
        bankName=bankName,
        accountNumber=accountNumber,
        ifscCode=ifscCode,
        bankBranch=bankBranch,
        aadharCard=aadharCard,
        panCard=panCard,
        medicalReport=medicalReport,
        policeVerification=policeVerification,
        emergencyContact=emergencyContact,
        addressProof=addressProof,
        licenseFile=licenseFile,
        policeFile=policeFile,
        bankFile=bankFile,
        medicalFile=medicalFile,
        aadharFile=aadharFile,
    )

@router.post("/")
async def create_driver(
    fullName: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    dob: Optional[str] = Form(None),
    experience: Optional[int] = Form(0),
    licenseNumber: Optional[str] = Form(None),
    bankName: Optional[str] = Form(None),
    accountNumber: Optional[str] = Form(None),
    ifscCode: Optional[str] = Form(None),
    bankBranch: Optional[str] = Form(None),
    aadharCard: Optional[str] = Form(None),
    panCard: Optional[str] = Form(None),
    medicalReport: Optional[str] = Form('Pending'),
    policeVerification: Optional[str] = Form('Pending'),
    emergencyContact: Optional[str] = Form(None),
    addressProof: Optional[str] = Form(None),
    licenseFile: Optional[UploadFile] = File(None),
    policeFile: Optional[UploadFile] = File(None),
    bankFile: Optional[UploadFile] = File(None),
    medicalFile: Optional[UploadFile] = File(None),
    aadharFile: Optional[UploadFile] = File(None),
):
    try:
        if db.get_driver_by_email(email):
            raise HTTPException(status_code=400, detail="Email already registered")

        driver_data = {
            'full_name': fullName,
            'email': email,
            'phone': phone,
            'password': password,
            'dob': dob,
            'experience': experience,
            'license_number': licenseNumber,
            'bank_name': bankName,
            'account_number': accountNumber,
            'ifsc_code': ifscCode,
            'bank_branch': bankBranch,
            'aadhar_card': aadharCard,
            'pan_card': panCard,
            'medical_report': medicalReport,
            'police_verification': policeVerification,
            'emergency_contact': emergencyContact,
            'address_proof': addressProof,
            'wallet_balance': 0.00
        }

        driver_id = db.create_driver(driver_data)
        if not driver_id:
            raise HTTPException(status_code=500, detail="Failed to create driver")

        file_paths = {}
        if licenseFile and allowed_file(licenseFile.filename):
            file_paths['license_file_path'] = save_file(licenseFile, driver_id, 'license')
        if policeFile and allowed_file(policeFile.filename):
            file_paths['police_file_path'] = save_file(policeFile, driver_id, 'police')
        if bankFile and allowed_file(bankFile.filename):
            file_paths['bank_file_path'] = save_file(bankFile, driver_id, 'bank')
        if medicalFile and allowed_file(medicalFile.filename):
            file_paths['medical_file_path'] = save_file(medicalFile, driver_id, 'medical')
        if aadharFile and allowed_file(aadharFile.filename):
            file_paths['aadhar_file_path'] = save_file(aadharFile, driver_id, 'aadhar')

        if file_paths:
            db.update_driver(driver_id, file_paths)

        return {'success': True, 'message': 'Driver registered successfully', 'driverId': driver_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{driver_id}")
async def update_driver(
    driver_id: int,
    fullName: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    experience: Optional[int] = Form(None),
    licenseNumber: Optional[str] = Form(None),
    bankName: Optional[str] = Form(None),
    accountNumber: Optional[str] = Form(None),
    ifscCode: Optional[str] = Form(None),
    bankBranch: Optional[str] = Form(None),
    aadharCard: Optional[str] = Form(None),
    panCard: Optional[str] = Form(None),
    medicalReport: Optional[str] = Form(None),
    policeVerification: Optional[str] = Form(None),
    emergencyContact: Optional[str] = Form(None),
    addressProof: Optional[str] = Form(None),
    licenseFile: Optional[UploadFile] = File(None),
    policeFile: Optional[UploadFile] = File(None),
    bankFile: Optional[UploadFile] = File(None),
    medicalFile: Optional[UploadFile] = File(None),
    aadharFile: Optional[UploadFile] = File(None),
    panFile: Optional[UploadFile] = File(None),
):
    try:
        if not db.get_driver_by_id(driver_id):
            raise HTTPException(status_code=404, detail="Driver not found")

        driver_data = {
            'full_name': fullName,
            'email': email,
            'phone': phone,
            'password': password,
            'dob': dob,
            'experience': experience,
            'license_number': licenseNumber,
            'bank_name': bankName,
            'account_number': accountNumber,
            'ifsc_code': ifscCode,
            'bank_branch': bankBranch,
            'aadhar_card': aadharCard,
            'pan_card': panCard,
            'medical_report': medicalReport,
            'police_verification': policeVerification,
            'emergency_contact': emergencyContact,
            'address_proof': addressProof
        }

        file_paths = {}
        if licenseFile and allowed_file(licenseFile.filename):
            file_paths['license_file_path'] = save_file(licenseFile, driver_id, 'license')
        if policeFile and allowed_file(policeFile.filename):
            file_paths['police_file_path'] = save_file(policeFile, driver_id, 'police')
        if bankFile and allowed_file(bankFile.filename):
            file_paths['bank_file_path'] = save_file(bankFile, driver_id, 'bank')
        if medicalFile and allowed_file(medicalFile.filename):
            file_paths['medical_file_path'] = save_file(medicalFile, driver_id, 'medical')
        if aadharFile and allowed_file(aadharFile.filename):
            file_paths['aadhar_file_path'] = save_file(aadharFile, driver_id, 'aadhar')
        if panFile and allowed_file(panFile.filename):
            # PAN file is not stored in a dedicated column, but can still be saved for future use.
            file_paths['pan_file_path'] = save_file(panFile, driver_id, 'pan')

        driver_data.update(file_paths)
        driver_data = {k: v for k, v in driver_data.items() if v is not None}

        if not driver_data:
            raise HTTPException(status_code=400, detail="No update data provided")

        result = db.update_driver(driver_id, driver_data)
        if result:
            return {'success': True, 'message': 'Driver updated', 'data': result}
        raise HTTPException(status_code=400, detail="Failed to update driver")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{driver_id}")
def delete_driver(driver_id: int):
    try:
        if not db.get_driver_by_id(driver_id):
            raise HTTPException(status_code=404, detail="Driver not found")
        if db.delete_driver(driver_id):
            return {'success': True, 'message': 'Driver deleted'}
        raise HTTPException(status_code=400, detail="Failed to delete driver")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/")
def search_drivers(q: str):
    try:
        if not q:
            raise HTTPException(status_code=400, detail="Search term required")
        drivers = db.search_drivers(q)
        return {'success': True, 'data': drivers, 'count': len(drivers)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
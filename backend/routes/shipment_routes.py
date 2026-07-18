from fastapi import APIRouter, HTTPException
from database import Database
from datetime import datetime
import random
from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Table, TableStyle
from reportlab.lib.units import mm
import os

router = APIRouter()
db = Database()

def generate_tracking_id(id_num):
    return f"TRK-{datetime.now().year}-{str(id_num).zfill(4)}"

def generate_challan_number():
    d = datetime.now()
    return f"CHL-{d.year}{str(d.month).zfill(2)}{str(d.day).zfill(2)}-{str(random.randint(0,9999)).zfill(4)}"

def generate_lr_number():
    d = datetime.now()
    return f"LR{d.year}{str(d.month).zfill(2)}{str(d.day).zfill(2)}{str(random.randint(0,9999)).zfill(4)}"

@router.get("")
def get_shipments_no_slash():
    return get_shipments()

@router.get("/")
def get_shipments():
    try:
        shipments = db.get_all_shipments()
        return {'success': True, 'data': shipments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{shipment_id}")
def get_shipment(shipment_id: int):
    try:
        shipment = db.get_shipment_by_id(shipment_id)
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        return {'success': True, 'data': shipment}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{shipment_id}/challan-pdf")
def download_challan_pdf(shipment_id: int):
    try:
        shipment = db.get_shipment_by_id(shipment_id)
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        margin = 35
        
        dark_bg = colors.HexColor('#1a1a2e')
        accent = colors.HexColor('#e94560')
        dark_text = colors.HexColor('#16213e')
        gray_text = colors.HexColor('#6b7280')
        light_bg = colors.HexColor('#f9fafb')
        border_color = colors.HexColor('#e5e7eb')
        white = colors.white
        
        p.setFillColor(dark_bg)
        p.rect(0, height - 120, width, 120, fill=True, stroke=False)
        
        logo_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'img', 'logo.jpeg')
        logo_found = os.path.exists(logo_path)
        if logo_found:
            p.drawImage(ImageReader(logo_path), margin, height - 100, width=55, height=55, preserveAspectRatio=True, mask='auto')
            text_x = margin + 65
        else:
            p.setFillColor(accent)
            p.circle(margin + 28, height - 72, 25, fill=True, stroke=False)
            p.setFillColor(white)
            p.setFont("Helvetica-Bold", 20)
            p.drawString(margin + 17, height - 82, "TE")
            text_x = margin + 65
        
        p.setFillColor(white)
        p.setFont("Helvetica-Bold", 24)
        p.drawString(text_x, height - 48, "TransportERP")
        p.setFont("Helvetica", 9)
        p.setFillColor(colors.HexColor('#94a3b8'))
        p.drawString(text_x, height - 65, "Fleet Management & Logistics Solutions")
        
        p.setFillColor(accent)
        p.setFont("Helvetica-Bold", 14)
        p.drawRightString(width - margin, height - 40, "DELIVERY CHALLAN")
        p.setFont("Helvetica", 8)
        p.setFillColor(colors.HexColor('#94a3b8'))
        p.drawRightString(width - margin, height - 55, "ORIGINAL COPY")
        
        card_top = height - 140
        p.setFillColor(white)
        p.setStrokeColor(border_color)
        p.setLineWidth(1)
        p.roundRect(margin, 50, width - (2 * margin), card_top - 50, 6, fill=True, stroke=True)
        
        y = height - 170
        
        p.setFillColor(light_bg)
        p.roundRect(margin + 15, y - 50, 180, 50, 4, fill=True, stroke=False)
        p.setFillColor(dark_text)
        p.setFont("Helvetica-Bold", 8)
        p.drawString(margin + 25, y - 18, "LR NUMBER")
        p.setFont("Helvetica-Bold", 16)
        p.setFillColor(accent)
        p.drawString(margin + 25, y - 42, f"{shipment.get('lr_number', 'N/A')}")
        
        p.setFillColor(light_bg)
        p.roundRect(margin + 210, y - 50, 130, 50, 4, fill=True, stroke=False)
        p.setFillColor(dark_text)
        p.setFont("Helvetica-Bold", 8)
        p.drawString(margin + 220, y - 18, "DATE")
        p.setFont("Helvetica-Bold", 14)
        p.drawString(margin + 220, y - 40, f"{shipment.get('booking_date', 'N/A')}")
        
        p.setFillColor(light_bg)
        p.roundRect(margin + 355, y - 50, 160, 50, 4, fill=True, stroke=False)
        p.setFillColor(dark_text)
        p.setFont("Helvetica-Bold", 8)
        p.drawString(margin + 365, y - 18, "CHALLAN NO")
        p.setFont("Helvetica", 11)
        p.drawString(margin + 365, y - 40, f"{shipment.get('challan_number', 'N/A')}")
        
        p.setFillColor(light_bg)
        p.roundRect(width - margin - 175, y - 50, 160, 50, 4, fill=True, stroke=False)
        p.setFillColor(dark_text)
        p.setFont("Helvetica-Bold", 8)
        p.drawString(width - margin - 165, y - 18, "TRACKING ID")
        p.setFont("Helvetica", 11)
        p.setFillColor(colors.HexColor('#2563eb'))
        p.drawString(width - margin - 165, y - 40, f"{shipment.get('tracking_id', 'N/A')}")
        
        y = height - 245
        
        p.setFillColor(accent)
        p.roundRect(margin + 15, y - 65, (width/2) - margin - 25, 65, 6, fill=True, stroke=False)
        p.setFillColor(white)
        p.setFont("Helvetica-Bold", 11)
        p.drawString(margin + 25, y - 25, "CONSIGNOR (SENDER)")
        p.setFont("Helvetica", 10)
        p.drawString(margin + 25, y - 47, f"{shipment.get('client', 'N/A')}")
        p.setFont("Helvetica", 8)
        p.setFillColor(colors.HexColor('#fca5a5'))
        p.drawString(margin + 25, y - 62, f"Pickup: {shipment.get('pickup_location', 'N/A')}")
        
        p.setFillColor(dark_bg)
        p.roundRect((width/2) + 10, y - 65, (width/2) - margin - 25, 65, 6, fill=True, stroke=False)
        p.setFillColor(white)
        p.setFont("Helvetica-Bold", 11)
        p.drawString((width/2) + 20, y - 25, "CONSIGNEE (RECEIVER)")
        p.setFont("Helvetica", 10)
        p.drawString((width/2) + 20, y - 47, f"Destination: {shipment.get('destination', 'N/A')}")
        p.setFont("Helvetica", 8)
        p.setFillColor(colors.HexColor('#94a3b8'))
        p.drawString((width/2) + 20, y - 62, f"Delivery: {shipment.get('delivery_location', 'N/A')}")
        
        y = height - 335
        
        p.setFillColor(dark_text)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(margin + 15, y, "GOODS DETAILS")
        
        goods_data = [
            ["Description", "Packages", "Weight", "Invoice No", "E-Way Bill"],
            [
                shipment.get('goods_desc', 'N/A'),
                str(shipment.get('packages', '0')),
                f"{shipment.get('weight', '0')} {shipment.get('weight_type', 'kg')}",
                shipment.get('invoice_no', 'N/A'),
                shipment.get('eway_bill', 'N/A')
            ]
        ]
        
        goods_table = Table(goods_data, colWidths=[175, 70, 85, 110, 110])
        goods_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), dark_bg),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('BACKGROUND', (0, 1), (-1, 1), white),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ]))
        goods_table.wrapOn(p, width - (2 * margin) - 30, 100)
        goods_table.drawOn(p, margin + 15, y - 55)
        
        y = height - 430
        
        p.setFillColor(dark_text)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(margin + 15, y, "FREIGHT & CHARGES")
        
        freight = float(shipment.get('freight_charge', 0))
        loading = float(shipment.get('loading_charges', 0))
        unloading = float(shipment.get('unloading_charges', 0))
        other = float(shipment.get('other_charges', 0))
        discount = float(shipment.get('discount', 0))
        gst = float(shipment.get('gst', 0))
        subtotal = freight + loading + unloading + other - discount
        total = subtotal + gst
        
        freight_data = [
            ["Particulars", "Amount (₹)"],
            ["Freight Charge", f"₹ {freight:,.2f}"],
            ["Loading Charges", f"₹ {loading:,.2f}"],
            ["Unloading Charges", f"₹ {unloading:,.2f}"],
            ["Other Charges", f"₹ {other:,.2f}"],
        ]
        
        if discount > 0:
            freight_data.append(["Discount", f"-₹ {discount:,.2f}"])
        
        freight_data.append(["Subtotal", f"₹ {subtotal:,.2f}"])
        freight_data.append(["GST", f"₹ {gst:,.2f}"])
        freight_data.append(["TOTAL", f"₹ {total:,.2f}"])
        
        ft = Table(freight_data, colWidths=[380, 170])
        ft.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), dark_bg),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -2), 9),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('BACKGROUND', (0, -1), (-1, -1), accent),
            ('TEXTCOLOR', (0, -1), (-1, -1), white),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [white, light_bg]),
        ]))
        ft.wrapOn(p, width - (2 * margin) - 30, 250)
        ft.drawOn(p, margin + 15, y - (len(freight_data) * 22) - 30)
        
        bottom_y = 90
        
        p.setFillColor(light_bg)
        p.roundRect(margin + 15, bottom_y - 20, 220, 30, 4, fill=True, stroke=False)
        p.setFillColor(dark_text)
        p.setFont("Helvetica-Bold", 9)
        p.drawString(margin + 25, bottom_y - 8, f"PAYMENT: {shipment.get('payment_mode', 'N/A').upper()}")
        
        status = shipment.get('status', 'N/A')
        status_colors = {'delivered': '#10b981', 'in-transit': '#3b82f6', 'transit': '#3b82f6', 'pending': '#f59e0b', 'loading': '#8b5cf6', 'delayed': '#ef4444'}
        sc = status_colors.get(status.lower(), '#64748b')
        
        p.setFillColor(colors.HexColor(sc))
        p.roundRect(margin + 250, bottom_y - 20, 180, 30, 4, fill=True, stroke=False)
        p.setFillColor(white)
        p.setFont("Helvetica-Bold", 10)
        p.drawString(margin + 260, bottom_y - 8, f"STATUS: {status.upper()}")
        
        p.setFillColor(light_bg)
        p.roundRect(width - margin - 175, bottom_y - 20, 160, 30, 4, fill=True, stroke=False)
        p.setFillColor(gray_text)
        p.setFont("Helvetica", 8)
        p.drawString(width - margin - 165, bottom_y - 8, f"Generated: {datetime.now().strftime('%d-%m-%Y %H:%M')}")
        
        p.setStrokeColor(border_color)
        p.setLineWidth(0.5)
        p.line(margin + 15, 58, width - margin - 15, 58)
        p.setFillColor(gray_text)
        p.setFont("Helvetica", 7)
        p.drawString(margin + 15, 45, "This is a computer-generated challan. For any queries contact support@transporterp.com")
        p.drawRightString(width - margin - 15, 45, "TransportERP Logistics Pvt. Ltd.")
        
        p.save()
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Challan_{shipment.get('lr_number', shipment_id)}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_shipment_no_slash(data: dict):
    return create_shipment(data)

@router.post("/")
def create_shipment(data: dict):
    try:
        lr_number = data.get('lr_number') or generate_lr_number()
        challan_number = generate_challan_number()

        if db.get_shipment_by_lr_number(lr_number):
            raise HTTPException(status_code=400, detail="LR number already exists")

        shipment_data = {
            'lr_number': lr_number,
            'booking_date': data.get('booking_date') or datetime.now().strftime('%Y-%m-%d'),
            'destination': data.get('destination'),
            'client': data.get('client'),
            'consignor_id': data.get('consignor_id'),
            'consignee_id': data.get('consignee_id'),
            'weight': data.get('weight', 0),
            'driver_id': data.get('driver_id'),
            'vehicle_id': data.get('vehicle_id'),
            'eta': data.get('eta'),
            'status': data.get('status', 'pending'),
            'notes': data.get('notes', ''),
            'pickup_location': data.get('pickup_location'),
            'delivery_location': data.get('delivery_location'),
            'freight_charge': data.get('freight_charge', 0),
            'loading_charges': data.get('loading_charges', 0),
            'unloading_charges': data.get('unloading_charges', 0),
            'other_charges': data.get('other_charges', 0),
            'discount': data.get('discount', 0),
            'gst': data.get('gst', 0),
            'payment_mode': data.get('payment_mode', 'cash'),
            'goods_desc': data.get('goods_desc', ''),
            'packages': data.get('packages', 0),
            'weight_type': data.get('weight_type', 'kg'),
            'invoice_no': data.get('invoice_no'),
            'invoice_value': data.get('invoice_value', 0),
            'eway_bill': data.get('eway_bill'),
            'challan_number': challan_number,
            'tracking_id': ''
        }

        shipment_id = db.create_shipment(shipment_data)
        tracking_id = generate_tracking_id(shipment_id)
        db.update_shipment_tracking_id(shipment_id, tracking_id)

        return {'success': True, 'message': 'Shipment created', 'data': db.get_shipment_by_id(shipment_id)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{shipment_id}")
def update_shipment(shipment_id: int, data: dict):
    try:
        if not db.get_shipment_by_id(shipment_id):
            raise HTTPException(status_code=404, detail="Shipment not found")
        if db.update_shipment(shipment_id, data):
            return {'success': True, 'message': 'Shipment updated', 'data': db.get_shipment_by_id(shipment_id)}
        raise HTTPException(status_code=400, detail="Failed to update shipment")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{shipment_id}/")
def update_shipment_with_slash(shipment_id: int, data: dict):
    return update_shipment(shipment_id, data)

@router.delete("/{shipment_id}")
def delete_shipment(shipment_id: int):
    try:
        if not db.get_shipment_by_id(shipment_id):
            raise HTTPException(status_code=404, detail="Shipment not found")
        if db.delete_shipment(shipment_id):
            return {'success': True, 'message': 'Shipment deleted'}
        raise HTTPException(status_code=400, detail="Failed to delete shipment")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{shipment_id}/")
def delete_shipment_with_slash(shipment_id: int):
    return delete_shipment(shipment_id)
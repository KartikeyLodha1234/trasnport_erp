from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime  # <-- ADD THIS LINE

class PDFService:
    def generate_challan(self, shipment_data):
        """Generate a PDF challan for a shipment"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)
        styles = getSampleStyleSheet()
        
        # ... rest of your code ...
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a237e'),
            alignment=1,  # Center
            spaceAfter=12
        )
        
        heading_style = ParagraphStyle(
            'Heading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=6
        )
        
        content_style = ParagraphStyle(
            'Content',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=4
        )
        
        elements = []
        
        # Header
        elements.append(Paragraph("CARGO MAX LOGISTICS", title_style))
        elements.append(Paragraph("FleetChain - Hybrid Web3 Logistics Platform", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Title
        elements.append(Paragraph("TRANSPORT CHALLAN / BILL", 
                                 ParagraphStyle('ChallanTitle', parent=styles['Heading1'],
                                               fontSize=20, textColor=colors.HexColor('#d32f2f'),
                                               alignment=1, spaceAfter=12)))
        
        # LR and Tracking info
        info = f"""
        <b>LR No:</b> {shipment_data.get('lr_number', 'N/A')} &nbsp;&nbsp;&nbsp;
        <b>Challan No:</b> {shipment_data.get('challan_number', 'N/A')} &nbsp;&nbsp;&nbsp;
        <b>Date:</b> {shipment_data.get('booking_date', 'N/A')}
        """
        elements.append(Paragraph(info, styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Shipper and Consignee Details
        data = [
            ['SHIPPER DETAILS', 'CONSIGNEE DETAILS'],
            [f"Client: {shipment_data.get('client', 'N/A')}", 
             f"Destination: {shipment_data.get('destination', 'N/A')}"],
            [f"Pickup: {shipment_data.get('pickup_location', 'N/A')}", 
             f"Delivery: {shipment_data.get('delivery_location', 'N/A')}"]
        ]
        
        table = Table(data, colWidths=[2.5*inch, 2.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#1a237e')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f5f5f5')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 12))
        
        # Goods Details
        elements.append(Paragraph("GOODS DETAILS", heading_style))
        goods_data = [
            ['Description', shipment_data.get('goods_desc', 'N/A')],
            ['Packages', str(shipment_data.get('packages', '0'))],
            ['Weight', f"{shipment_data.get('weight', '0')} {shipment_data.get('weight_type', 'kg')}"],
            ['Invoice No', shipment_data.get('invoice_no', 'N/A')],
            ['Invoice Value', f"₹{shipment_data.get('invoice_value', '0')}"],
            ['E-Way Bill', shipment_data.get('eway_bill', 'N/A')]
        ]
        
        goods_table = Table(goods_data, colWidths=[1.5*inch, 3.5*inch])
        goods_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e3f2fd')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(goods_table)
        elements.append(Spacer(1, 12))
        
        # Transport Details
        elements.append(Paragraph("TRANSPORT DETAILS", heading_style))
        transport_data = [
            ['Vehicle No', shipment_data.get('vehicle_code', 'N/A')],
            ['License Plate', shipment_data.get('license_plate', 'N/A')],
            ['Vehicle Type', shipment_data.get('vehicle_type', 'N/A')],
            ['Driver', shipment_data.get('driver_name', 'N/A')],
            ['Driver Phone', shipment_data.get('driver_phone', 'N/A')],
            ['Status', shipment_data.get('status', 'pending')],
            ['ETA', shipment_data.get('eta', 'N/A')]
        ]
        
        transport_table = Table(transport_data, colWidths=[1.5*inch, 3.5*inch])
        transport_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5e9')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(transport_table)
        elements.append(Spacer(1, 12))
        
        # Freight Charges
        elements.append(Paragraph("FREIGHT CHARGES", heading_style))
        freight = float(shipment_data.get('freight_charge', 0))
        gst_percent = float(shipment_data.get('gst', 0))
        gst_amount = (freight * gst_percent) / 100
        grand_total = freight + gst_amount
        
        freight_data = [
            ['Freight Charge', f"₹{freight:.2f}"],
            ['GST', f"{gst_percent}%"],
            ['GST Amount', f"₹{gst_amount:.2f}"],
            ['GRAND TOTAL', f"₹{grand_total:.2f}"]
        ]
        
        freight_table = Table(freight_data, colWidths=[2*inch, 2*inch])
        freight_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -2), colors.HexColor('#fff3e0')),
            ('BACKGROUND', (0, -1), (1, -1), colors.HexColor('#d32f2f')),
            ('TEXTCOLOR', (0, -1), (1, -1), colors.whitesmoke),
            ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        elements.append(freight_table)
        elements.append(Spacer(1, 12))
        
        # Terms & Conditions
        elements.append(Paragraph("TERMS & CONDITIONS", heading_style))
        terms = """
        1. Goods are transported at owner's risk.<br/>
        2. Please check goods before signing.<br/>
        3. This challan is valid for 7 days.<br/>
        4. For any dispute, jurisdiction will be local courts.
        """
        elements.append(Paragraph(terms, styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Signatures
        signature_data = [
            ['Shipper Signature', 'Carrier Signature'],
            ['___________________', '___________________'],
            [shipment_data.get('client', 'N/A'), shipment_data.get('driver_name', 'N/A')]
        ]
        
        sig_table = Table(signature_data, colWidths=[2.5*inch, 2.5*inch])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (1, 0), 'CENTER'),
            ('ALIGN', (0, 1), (1, 1), 'CENTER'),
            ('ALIGN', (0, 2), (1, 2), 'CENTER'),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(sig_table)
        elements.append(Spacer(1, 24))
        
        # Footer
        footer = f"""
        Generated by CargoMax FleetChain System<br/>
        Generated on: {datetime.now().strftime('%d-%m-%Y %H:%M:%S')}
        """
        elements.append(Paragraph(footer, 
                                 ParagraphStyle('Footer', parent=styles['Normal'],
                                               fontSize=8, textColor=colors.HexColor('#999999'),
                                               alignment=1)))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
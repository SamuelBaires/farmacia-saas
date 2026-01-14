import jsPDF from 'jspdf';
import { format } from 'date-fns';

export const generateTicket = (venta, farmaciaConfig) => {
    // Standard thermal paper width is 80mm
    // Height is variable, we start with a generous estimate or dynamic calculation
    // However, jsPDF needs a page size. We'll use a long strip strategy.
    
    const PAPER_WIDTH = 80;
    const MARGIN = 5;
    const CONTENT_WIDTH = PAPER_WIDTH - (MARGIN * 2);
    
    // Estimate height: Header (40) + Items (lines * 10) + Footer (60)
    const estimatedHeight = 100 + (venta.detalles.length * 10);
    
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [PAPER_WIDTH, estimatedHeight]
    });

    let yPos = 10;
    const lineHeight = 4;

    // Helper to center text
    const centerText = (text, y) => {
        doc.text(text, PAPER_WIDTH / 2, y, { align: 'center' });
    };

    // Helper for rows
    const row = (left, right, y, bold = false) => {
        doc.setFont(undefined, bold ? 'bold' : 'normal');
        doc.text(left, MARGIN, y);
        doc.text(right, PAPER_WIDTH - MARGIN, y, { align: 'right' });
    };

    // --- HEADER ---
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    centerText(farmaciaConfig.nombre || 'FARMACIA SAAS', yPos);
    yPos += lineHeight + 2;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    centerText(farmaciaConfig.direccion || 'Dirección Principal', yPos);
    yPos += lineHeight;
    centerText(`NIT: ${farmaciaConfig.nit || '0000-000000-000-0'}`, yPos);
    yPos += lineHeight;
    centerText(`Tel: ${farmaciaConfig.telefono || '2222-0000'}`, yPos);
    yPos += lineHeight + 4;

    // --- META INFO ---
    row(`Fecha: ${format(new Date(venta.fecha_venta || new Date()), 'dd/MM/yyyy HH:mm')}`, '', yPos);
    yPos += lineHeight;
    row(`Ticket: ${venta.numero_venta || '---'}`, '', yPos);
    yPos += lineHeight;
    row(`Cajero: ${venta.usuario?.nombre_completo?.split(' ')[0] || 'Sistema'}`, '', yPos);
    yPos += lineHeight;
    row(`Cliente: ${venta.cliente?.nombre || 'Consumidor Final'}`, '', yPos);
    yPos += lineHeight + 4;

    // --- SEPARATOR ---
    doc.line(MARGIN, yPos, PAPER_WIDTH - MARGIN, yPos);
    yPos += 4;

    // --- ITEMS ---
    doc.setFontSize(8);
    // Header Row
    doc.setFont(undefined, 'bold');
    doc.text('Cant', MARGIN, yPos);
    doc.text('Desc', MARGIN + 10, yPos);
    doc.text('Total', PAPER_WIDTH - MARGIN, yPos, { align: 'right' });
    yPos += lineHeight + 2;

    doc.setFont(undefined, 'normal');
    venta.detalles.forEach(item => {
        // Item Name
        const name = item.medicamento?.nombre_comercial || item.nombre_producto || 'Item';
        doc.text(`${item.cantidad}`, MARGIN, yPos);
        
        // Handle long names
        const splitName = doc.splitTextToSize(name, 40);
        doc.text(splitName, MARGIN + 10, yPos);
        
        doc.text(`$${Number(item.subtotal).toFixed(2)}`, PAPER_WIDTH - MARGIN, yPos, { align: 'right' });
        
        // Adjust yPos based on name lines
        yPos += (splitName.length * lineHeight) + 2;
    });

    // --- SEPARATOR ---
    yPos += 2;
    doc.line(MARGIN, yPos, PAPER_WIDTH - MARGIN, yPos);
    yPos += 4;

    // --- TOTALS ---
    doc.setFontSize(9);
    row('Subtotal:', `$${Number(venta.subtotal).toFixed(2)}`, yPos);
    yPos += lineHeight;
    
    if (venta.descuento > 0) {
        row('Descuento:', `-$${Number(venta.descuento).toFixed(2)}`, yPos);
        yPos += lineHeight;
    }
    
    // IVA is usually included in price for pharmacies in some regions, or calculated. 
    // Assuming prices include tax for simplified display, or displaying tax base if needed.
    // We will display Total directly.
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    row('TOTAL:', `$${Number(venta.total).toFixed(2)}`, yPos, true);
    yPos += lineHeight + 4;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    row('Método Pago:', venta.metodo_pago, yPos);
    yPos += lineHeight;
    if (venta.referencia_pago) {
        row('Ref:', venta.referencia_pago, yPos);
        yPos += lineHeight;
    }

    // --- FOOTER ---
    yPos += 8;
    centerText('¡Gracias por su compra!', yPos);
    yPos += lineHeight;
    centerText('Por favor revise su producto', yPos);
    yPos += lineHeight;
    centerText('antes de salir.', yPos);

    // Open PDF in new window for printing
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
};

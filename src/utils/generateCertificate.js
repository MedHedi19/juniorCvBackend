const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('pdf-fontkit'); // fixes Ballet empty-glyph crash in @pdf-lib/fontkit
const { pdfToPng } = require('pdf-to-png-converter');

/**
 * Generate a personalized certificate PDF buffer with the new design.
 * - Loads the template from data/Certificate.pdf
 * - Uses Ballet font for the name (elegant script)
 * - Uses Helvetica for date and reference
 * - Places text at precise coordinates
 * - Returns a Buffer containing the modified PDF
 */
async function generateCertificate(userName, referenceNumber) {
  const templatePath = path.join(__dirname, '..', 'data', 'Certificate.pdf');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Certificate template not found at ${templatePath}`);
  }

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width } = firstPage.getSize();

  // Ballet for the recipient name (subset required for this TTF)
  const balletPath = path.join(__dirname, '..', 'Fonts', 'Ballet_60pt-Regular.ttf');
  if (!fs.existsSync(balletPath)) {
    throw new Error(`Ballet font not found at ${balletPath}`);
  }
  const balletFont = await pdfDoc.embedFont(fs.readFileSync(balletPath), {
    subset: true,
  });

  const openSansFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Text content
  const nameText = userName || 'Participant';
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const dateText = `FAIT LE ${date}`;
  const referenceText = referenceNumber || '2207-00';

  // PDF coordinate system: origin is bottom-left (0,0)

  // Name: centered in the dark gray content area (not full page width).
  // Gray panel starts ~after the white left strip / seal (~130pt).
  const grayLeft = 130;
  const grayRight = width;
  const nameX = (grayLeft + grayRight) / 2; // ~486 on A4 landscape
  const nameY = 280;
  const nameFontSize = 36;

  // Date: same X, moved slightly lower (smaller Y = toward bottom of page)
  const dateX = 180;
  const dateY = 125;
  const dateFontSize = 14;

  // Reference: bottom-left banner
  const referenceX = 80;
  const referenceY = 25;
  const referenceFontSize = 12;

  // Draw name (Ballet, centered)
  const nameWidth = balletFont.widthOfTextAtSize(nameText, nameFontSize);
  firstPage.drawText(nameText, {
    x: nameX - nameWidth / 2,
    y: nameY,
    size: nameFontSize,
    font: balletFont,
    color: rgb(1.0, 1.0, 1.0),
  });

  // Draw date
  firstPage.drawText(dateText, {
    x: dateX,
    y: dateY,
    size: dateFontSize,
    font: openSansFont,
    color: rgb(1.0, 1.0, 1.0),
  });

  // Draw reference number
  firstPage.drawText(referenceText, {
    x: referenceX,
    y: referenceY,
    size: referenceFontSize,
    font: openSansFont,
    color: rgb(1.0, 1.0, 1.0),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate certificate as PNG image for social media sharing.
 * - Generates PDF first, then converts to high-quality PNG
 * - Returns a Buffer containing the PNG image
 */
async function generateCertificateImage(userName, referenceNumber) {
  try {
    const pdfBuffer = await generateCertificate(userName, referenceNumber);

    const pngPages = await pdfToPng(pdfBuffer, {
      outputType: 'buffer',
      viewportScale: 2.0,
      quality: 100,
    });

    if (pngPages && pngPages.length > 0) {
      return pngPages[0].content;
    } else {
      throw new Error('Failed to convert PDF to PNG');
    }
  } catch (error) {
    console.error('Error generating certificate image:', error);
    throw error;
  }
}

/**
 * Generate the next reference number (2207-01, 2207-02, etc.)
 * This should be managed at the controller level using database
 */
function generateNextReferenceNumber(lastReference) {
  if (!lastReference) {
    return '2207-01';
  }

  const parts = lastReference.split('-');
  const base = parts[0];
  const number = parseInt(parts[1], 10);
  const nextNumber = number + 1;

  return `${base}-${String(nextNumber).padStart(2, '0')}`;
}

module.exports = {
  generateCertificate,
  generateCertificateImage,
  generateNextReferenceNumber,
};

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Generate a personalized certificate PDF buffer.
 * - Loads the template from data/Certificate.pdf
 * - Writes the recipient name and the current date on the first page
 * - Returns a Buffer containing the modified PDF
 */
async function generateCertificate(userName) {
  const templatePath = path.join(__dirname, '..', 'data', 'Certificate.pdf');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Certificate template not found at ${templatePath}`);
  }

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Use a standard font and size appropriate for the template
  const helvetica = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 24;

  // Compose text
  const nameText = userName || 'Participant';
  const date = new Date().toLocaleDateString();
  const dateText = date;

  // Measure widths to center the text
  const nameWidth = helvetica.widthOfTextAtSize(nameText, fontSize);
  const dateWidth = helvetica.widthOfTextAtSize(dateText, 12);

  // Choose coordinates - these may need adjustment depending on the template
  const nameX = (width - nameWidth) / 2;
  const nameY = height / 2 + 20;
  const dateX = (width - dateWidth) / 2;
  const dateY = nameY - 36;

  firstPage.drawText(nameText, {
    x: nameX,
    y: nameY-20,
    size: fontSize,
    font: helvetica,
    color: rgb(0.0, 0.0, 0.0),
  });

  firstPage.drawText(dateText, {
    x: dateX,
    y: dateY-30,
    size: 12,
    font: helvetica,
    color: rgb(0.0, 0.0, 0.0),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { generateCertificate };

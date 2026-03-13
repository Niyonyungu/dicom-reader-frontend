import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, BorderStyle } from 'docx';

export async function exportReportAsPDF(
  htmlContent: string,
  filename: string
) {
  try {
    // Create a temporary iframe to properly render the HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '800px';
    iframe.style.height = '1000px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Unable to access iframe document');
    }

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Wait for the iframe to load completely
    await new Promise((resolve) => {
      iframe.onload = resolve;
      // Fallback timeout
      setTimeout(resolve, 1000);
    });

    const element = iframeDoc.body;

    // sanitize any lab() or oklch() color values in computed styles by converting them
    // to an equivalent rgb string. html2canvas doesn't support lab() or oklch() and will
    // throw when it encounters one.
    function resolveColor(color: string) {
      const dummy = document.createElement('div');
      dummy.style.color = color;
      dummy.style.position = 'absolute';
      dummy.style.left = '-9999px';
      document.body.appendChild(dummy);
      const computed = getComputedStyle(dummy).color;
      document.body.removeChild(dummy);
      return computed;
    }

    function sanitizeElement(el: HTMLElement) {
      const cs = getComputedStyle(el);
      for (const prop of Array.from(cs)) {
        const val = cs.getPropertyValue(prop);
        // Check for modern CSS color functions that html2canvas doesn't support
        if (val.includes('lab(') || val.includes('oklch(') || val.includes('lch(') || val.includes('hwb(') || val.includes('color(')) {
          const rgb = resolveColor(val);
          el.style.setProperty(prop, rgb, cs.getPropertyPriority(prop));
        }
      }
      Array.from(el.children as HTMLCollectionOf<HTMLElement>).forEach(sanitizeElement);
    }

    sanitizeElement(element);

    let canvas;
    try {
      canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: 800,
        height: element.scrollHeight,
      });
    } finally {
      // Clean up the iframe
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210 - 20; // A4 width minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= 280;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= 280;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('color')) {
        throw new Error('PDF export failed due to unsupported color formats. Please try again.');
      }
      throw new Error(`PDF export failed: ${error.message}`);
    }
    throw new Error('PDF export failed due to an unknown error. Please try again.');
  }
}

export async function exportReportAsDocx(
  data: {
    patientName: string;
    patientId: string;
    studyDate: string;
    modality: string;
    findings: string;
    impression: string;
    radiologist: string;
  },
  filename: string
) {
  try {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'MEDICAL IMAGING REPORT',
                  bold: true,
                  size: 28,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Patient Information',
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Table({
              width: { size: 100, type: 'pct' },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph('Patient Name')],
                      shading: { fill: 'e0e0e0' },
                    }),
                    new TableCell({
                      children: [new Paragraph(data.patientName)],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph('Patient ID')],
                      shading: { fill: 'e0e0e0' },
                    }),
                    new TableCell({
                      children: [new Paragraph(data.patientId)],
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Study Information',
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Table({
              width: { size: 100, type: 'pct' },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph('Study Date')],
                      shading: { fill: 'e0e0e0' },
                    }),
                    new TableCell({
                      children: [new Paragraph(data.studyDate)],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph('Modality')],
                      shading: { fill: 'e0e0e0' },
                    }),
                    new TableCell({
                      children: [new Paragraph(data.modality)],
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Findings',
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph(data.findings || 'No findings reported'),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Impression',
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph(data.impression || 'No impression provided'),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Radiologist: ' + data.radiologist,
                  italics: true,
                }),
              ],
              spacing: { before: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Date: ' + new Date().toLocaleDateString(),
                  italics: true,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(buffer);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting DOCX:', error);
    throw error;
  }
}

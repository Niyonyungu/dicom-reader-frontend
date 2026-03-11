import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, BorderStyle } from 'docx';

export async function exportReportAsPDF(
  htmlContent: string,
  filename: string
) {
  try {
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.padding = '20px';

    // html2canvas needs the element to be in the document to correctly
    // resolve styles and cloned nodes (iframes, fonts, etc.). Render the
    // content offscreen, capture it, then remove the container.
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '800px';
    container.appendChild(element);
    document.body.appendChild(container);

    // sanitize any lab() color values in computed styles by converting them
    // to an equivalent rgb string. html2canvas doesn't support lab() and will
    // throw when it encounters one.
    function resolveLabColor(color: string) {
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
        if (val.includes('lab(')) {
          const rgb = resolveLabColor(val);
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
      });
    } finally {
      // Clean up the offscreen container whether html2canvas succeeded or not
      if (container && container.parentNode) container.parentNode.removeChild(container);
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
    throw error;
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

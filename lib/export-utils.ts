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

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
    });

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
              text: 'MEDICAL IMAGING REPORT',
              bold: true,
              size: 28,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: 'Patient Information',
              bold: true,
              size: 24,
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
              text: 'Study Information',
              bold: true,
              size: 24,
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
              text: 'Findings',
              bold: true,
              size: 24,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph(data.findings || 'No findings reported'),
            new Paragraph({
              text: 'Impression',
              bold: true,
              size: 24,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph(data.impression || 'No impression provided'),
            new Paragraph({
              text: 'Radiologist: ' + data.radiologist,
              spacing: { before: 400 },
              italics: true,
            }),
            new Paragraph({
              text: 'Date: ' + new Date().toLocaleDateString(),
              italics: true,
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

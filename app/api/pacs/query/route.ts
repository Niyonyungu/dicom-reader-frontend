import { NextResponse } from 'next/server';
import { WorklistItem } from '@/lib/mock-data';

const mockPacsStudies: WorklistItem[] = [
  {
    id: 'pacsstudy-001',
    patientId: 'PACS001',
    patientName: 'Alice Johnson',
    studyDate: '2026-03-10',
    studyTime: '09:30',
    modality: 'CT',
    description: 'CT Head',
    status: 'new',
    priority: 'normal',
    imageCount: 30,
    images: [
      { id: 'pacs-ct-1', instanceNumber: 1, filename: 'CT_1.dcm', seriesDescription: 'CT Head Series', windowCenter: 40, windowWidth: 400 },
      { id: 'pacs-ct-2', instanceNumber: 2, filename: 'CT_2.dcm', seriesDescription: 'CT Head Series', windowCenter: 40, windowWidth: 400 },
    ],
  },
  {
    id: 'pacsstudy-002',
    patientId: 'PACS002',
    patientName: 'Bob Williams',
    studyDate: '2026-03-11',
    studyTime: '14:20',
    modality: 'MRI',
    description: 'MRI Spine',
    status: 'new',
    priority: 'high',
    imageCount: 45,
    images:[
      { id: 'pacs-mr-1', instanceNumber: 1, filename: 'MR_1.dcm', seriesDescription: 'MRI Spine Series', windowCenter: 400, windowWidth: 1200 },
      { id: 'pacs-mr-2', instanceNumber: 2, filename: 'MR_2.dcm', seriesDescription: 'MRI Spine Series', windowCenter: 400, windowWidth: 1200 },
    ],
  },
];

export async function POST(req: Request) {
  const { host, port, aeTitle, patientId, patientName, studyUID } = await req.json();

  if (!host || !port || !aeTitle) {
    return NextResponse.json({ error: 'Missing PACS connection parameters' }, { status: 400 });
  }

  const serviceUrl = process.env.PACS_SERVICE_URL;
  if (serviceUrl) {
    try {
      const response = await fetch(`${serviceUrl}/pacs/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, aeTitle, patientId, patientName, studyUID }),
      });

      if (!response.ok) {
        const text = await response.text();
        return NextResponse.json({ error: `PACS backend error: ${text}` }, { status: 500 });
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        return NextResponse.json({ error: 'Unexpected PACS backend response format' }, { status: 500 });
      }

      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown PACS error' }, { status: 500 });
    }
  }

  // Fallback to mock PACS results when no backend is configured.
  const results = mockPacsStudies.filter((study) => {
    if (patientId && !study.patientId.toLowerCase().includes(patientId.toLowerCase())) return false;
    if (patientName && !study.patientName.toLowerCase().includes(patientName.toLowerCase())) return false;
    if (studyUID && !study.id.toLowerCase().includes(studyUID.toLowerCase())) return false;
    return true;
  });

  return NextResponse.json(results);
}

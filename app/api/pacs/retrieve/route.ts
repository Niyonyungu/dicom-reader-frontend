import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { host, port, aeTitle, studyUID } = await req.json();

  // Placeholder stub. Replace with real PACS service call.
  // Example: request your backend DICOM service to execute C-FIND/C-MOVE or WADO.
  if (!host || !port || !aeTitle || !studyUID) {
    return NextResponse.json({ error: 'Missing PACS parameters' }, { status: 400 });
  }

  try {
    // Connect to PACS backend (example internal service route)
    const pacsServiceUrl = process.env.PACS_SERVICE_URL || 'http://localhost:5000';

    const response = await fetch(`${pacsServiceUrl}/pacs/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, aeTitle, studyUID }),
    });

    if (!response.ok) {
      const errPayload = await response.text();
      return NextResponse.json({ error: `PACS backend error: ${errPayload}` }, { status: 500 });
    }

    const data = await response.json();

    // Expect a list of DICOM images from backend
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

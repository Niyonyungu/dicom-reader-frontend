'use client';

import { useState, useMemo } from 'react';
import { useWorklist } from '@/context/worklist-context';
import { WorklistItem } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorklistTable } from '@/components/worklist/worklist-table';
import { WorklistFilters } from '@/components/worklist/worklist-filters';
import { ListTodo } from 'lucide-react';

export default function WorklistPage() {
  const { worklist, addWorklistItem } = useWorklist();
  const [filters, setFilters] = useState({
    search: '',
    modality: '',
    status: '',
  });

  const [pacsHost, setPacsHost] = useState('pacs.example.com');
  const [pacsPort, setPacsPort] = useState(104);
  const [pacsAET, setPacsAET] = useState('MY_AE');
  const [pacsPatientId, setPacsPatientId] = useState('');
  const [pacsPatientName, setPacsPatientName] = useState('');
  const [pacsStudyUID, setPacsStudyUID] = useState('');
  const [pacsLoading, setPacsLoading] = useState(false);
  const [pacsStatus, setPacsStatus] = useState('');
  const [pacsResults, setPacsResults] = useState<WorklistItem[]>([]);

  const knownPacsServers = [
    { label: 'Demo PACS', host: 'pacs.example.com', port: 104, aeTitle: 'MY_AE' },
    { label: 'Local PACS', host: 'localhost', port: 104, aeTitle: 'LOCAL_AE' },
  ];

  const queryPacsWorklist = async () => {
    if (!pacsHost || !pacsPort || !pacsAET) {
      setPacsStatus('PACS host, port, and AE title are required.');
      return;
    }

    if (!pacsPatientId.trim() && !pacsPatientName.trim() && !pacsStudyUID.trim()) {
      setPacsStatus('Enter at least one of Patient ID, Patient Name or Study UID.');
      return;
    }

    setPacsLoading(true);
    setPacsStatus('Querying PACS worklist...');

    try {
      const res = await fetch('/api/pacs/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: pacsHost,
          port: pacsPort,
          aeTitle: pacsAET,
          patientId: pacsPatientId,
          patientName: pacsPatientName,
          studyUID: pacsStudyUID,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'PACS query failed');
      }

      const body = await res.json();
      if (!Array.isArray(body)) {
        throw new Error('Invalid response from PACS query');
      }

      setPacsResults(body);
      setPacsStatus(`Found ${body.length} studies in PACS`);
    } catch (error: any) {
      setPacsStatus(`PACS query error: ${error?.message ?? error}`);
    } finally {
      setPacsLoading(false);
    }
  };

  const importPacsStudy = (study: WorklistItem) => {
    const newWorklistItem: WorklistItem = {
      ...study,
      id: `pacs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'new',
      priority: study.priority || 'normal',
      images: study.images || [],
    };
    addWorklistItem(newWorklistItem);
    setPacsStatus(`Study ${study.patientName} imported to worklist.`);
  };

  const filteredWorklist = useMemo(() => {
    return worklist.filter((item) => {
      if (filters.search && !item.patientName.toLowerCase().includes(filters.search.toLowerCase()) &&
        !item.patientId.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.modality && item.modality !== filters.modality) {
        return false;
      }
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [worklist, filters]);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ListTodo className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Worklist</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage all imaging studies
        </p>
      </div>

      {/* PACS Server Selection + Query */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">PACS Query / Worklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            <select
              className="border border-border rounded px-2 py-1 text-sm"
              value={`${pacsHost}:${pacsPort}:${pacsAET}`}
              onChange={(event) => {
                const [host, port, aeTitle] = event.target.value.split(':');
                setPacsHost(host);
                setPacsPort(Number(port));
                setPacsAET(aeTitle);
              }}
            >
              {knownPacsServers.map((server) => (
                <option
                  key={`${server.host}-${server.port}-${server.aeTitle}`}
                  value={`${server.host}:${server.port}:${server.aeTitle}`}
                >
                  {server.label}
                </option>
              ))}
            </select>
            <input
              className="border border-border rounded px-2 py-1 text-sm"
              value={pacsHost}
              onChange={(e) => setPacsHost(e.target.value)}
              placeholder="PACS Host"
            />
            <input
              className="border border-border rounded px-2 py-1 text-sm"
              type="number"
              value={pacsPort}
              onChange={(e) => setPacsPort(Number(e.target.value))}
              placeholder="Port"
            />
            <input
              className="border border-border rounded px-2 py-1 text-sm"
              value={pacsAET}
              onChange={(e) => setPacsAET(e.target.value)}
              placeholder="AE Title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <input
              className="border border-border rounded px-2 py-1 text-sm"
              value={pacsPatientId}
              onChange={(e) => setPacsPatientId(e.target.value)}
              placeholder="Patient ID"
            />
            <input
              className="border border-border rounded px-2 py-1 text-sm"
              value={pacsPatientName}
              onChange={(e) => setPacsPatientName(e.target.value)}
              placeholder="Patient Name"
            />
            <input
              className="border border-border rounded px-2 py-1 text-sm"
              value={pacsStudyUID}
              onChange={(e) => setPacsStudyUID(e.target.value)}
              placeholder="Study UID"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={queryPacsWorklist}
              disabled={pacsLoading}
            >
              {pacsLoading ? 'Searching...' : 'Search PACS'}
            </Button>
            <span className="text-xs text-muted-foreground">{pacsStatus}</span>
          </div>

          {pacsResults.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-1">PACS studies found:</p>
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left">Patient</th>
                      <th className="p-2 text-left">Study Date</th>
                      <th className="p-2 text-left">Modality</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacsResults.map((study) => (
                      <tr key={study.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-2">{study.patientName}</td>
                        <td className="p-2">{study.studyDate}</td>
                        <td className="p-2">{study.modality}</td>
                        <td className="p-2 truncate max-w-sm">{study.description}</td>
                        <td className="p-2">
                          <button
                            onClick={() => importPacsStudy(study)}
                            className="text-xs text-primary hover:underline"
                          >
                            Add to Worklist
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Filter Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <WorklistFilters
            onFilterChange={setFilters}
          />
        </CardContent>
      </Card>

      {/* Worklist Table */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">
            Studies ({filteredWorklist.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WorklistTable items={filteredWorklist} />
        </CardContent>
      </Card>
    </div>
  );
}

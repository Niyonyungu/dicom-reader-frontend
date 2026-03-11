'use client';

import { useState, useMemo } from 'react';
import { useWorklist } from '@/context/worklist-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorklistTable } from '@/components/worklist/worklist-table';
import { WorklistFilters } from '@/components/worklist/worklist-filters';
import { ListTodo } from 'lucide-react';

export default function WorklistPage() {
  const { worklist } = useWorklist();
  const [filters, setFilters] = useState({
    search: '',
    modality: '',
    status: '',
  });

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

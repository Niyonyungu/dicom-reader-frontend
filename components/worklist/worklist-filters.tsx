'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorklistFiltersProps {
  onFilterChange: (filters: {
    search: string;
    modality: string;
    status: string;
  }) => void;
}

export function WorklistFilters({ onFilterChange }: WorklistFiltersProps) {
  const [search, setSearch] = useState('');
  const [modality, setModality] = useState('');
  const [status, setStatus] = useState('');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, modality, status });
  };

  const handleModalityChange = (value: string) => {
    setModality(value);
    onFilterChange({ search, modality: value, status });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onFilterChange({ search, modality, status: value });
  };

  const handleReset = () => {
    setSearch('');
    setModality('');
    setStatus('');
    onFilterChange({ search: '', modality: '', status: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-foreground">Filters</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search patient ID or name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>

        {/* Modality Filter */}
        <Select value={modality} onValueChange={handleModalityChange}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue placeholder="Select modality..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Modalities</SelectItem>
            <SelectItem value="MRI">MRI</SelectItem>
            <SelectItem value="CT">CT</SelectItem>
            <SelectItem value="XR">X-Ray</SelectItem>
            <SelectItem value="US">Ultrasound</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue placeholder="Select status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button */}
      {(search || modality || status) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="border-border"
        >
          Reset Filters
        </Button>
      )}
    </div>
  );
}

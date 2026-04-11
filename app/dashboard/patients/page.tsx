'use client';

import { useState, useEffect } from 'react';
import { listPatients, searchPatients, Patient, PatientFilters, PatientListResponse } from '@/services/patients-service';
import { handleApiError } from '@/lib/api-error-handler';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Users, Search, Filter, Loader2, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PatientsPage() {
  const { can } = useAuth();
  const [patients, setPatients] = useState<PatientListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter state
  const [genderFilter, setGenderFilter] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Search debounce
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        const filters: PatientFilters = {
          page,
          page_size: pageSize,
          search: searchQuery || undefined,
          gender: (genderFilter as 'M' | 'F' | 'O') || undefined,
          min_age: minAge ? parseInt(minAge) : undefined,
          max_age: maxAge ? parseInt(maxAge) : undefined,
          status: statusFilter || undefined,
        };

        const data = await listPatients(filters);
        setPatients(data);
      } catch (err) {
        const message = handleApiError(err).message;
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchPatients, searchQuery ? 500 : 0);
    return () => clearTimeout(timer);
  }, [page, pageSize, searchQuery, genderFilter, minAge, maxAge, statusFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setGenderFilter('');
    setMinAge('');
    setMaxAge('');
    setStatusFilter('');
    setSearchQuery('');
    setPage(1);
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const totalPages = patients ? Math.ceil(patients.total / pageSize) : 1;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Patients</h1>
          </div>
          <p className="text-muted-foreground">
            Manage patient information and records
          </p>
        </div>
        {can('patient.write') && (
          <Link href="/dashboard/patients/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </Link>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gender Filter */}
              <div>
                <Label htmlFor="gender" className="text-sm mb-2 block">
                  Gender
                </Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="O">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Age */}
              <div>
                <Label htmlFor="minAge" className="text-sm mb-2 block">
                  Min Age
                </Label>
                <Input
                  id="minAge"
                  type="number"
                  placeholder="0"
                  value={minAge}
                  onChange={(e) => {
                    setMinAge(e.target.value);
                    setPage(1);
                  }}
                  min="0"
                  max="150"
                />
              </div>

              {/* Max Age */}
              <div>
                <Label htmlFor="maxAge" className="text-sm mb-2 block">
                  Max Age
                </Label>
                <Input
                  id="maxAge"
                  type="number"
                  placeholder="150"
                  value={maxAge}
                  onChange={(e) => {
                    setMaxAge(e.target.value);
                    setPage(1);
                  }}
                  min="0"
                  max="150"
                />
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="status" className="text-sm mb-2 block">
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="w-full"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              Patients
              {patients && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({patients.total})
                </span>
              )}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              Page {page} of {totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : patients && patients.items && patients.items.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-center">Studies</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.items.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>
                          {patient.age !== undefined ? patient.age : calculateAge(patient.date_of_birth)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {patient.gender === 'M'
                              ? 'Male'
                              : patient.gender === 'F'
                                ? 'Female'
                                : 'Other'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {patient.email || patient.contact_info || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{patient.study_count || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/patients/${patient.id}`}>
                              <Button variant="ghost" size="sm" title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {can('patient.delete') && patient.study_count === 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }).map((_, i) => {
                        const p = i + 1;
                        if (p <= 3 || p >= totalPages - 2 || (p >= page - 1 && p <= page + 1)) {
                          return (
                            <PaginationItem key={p}>
                              <PaginationLink
                                onClick={() => setPage(p)}
                                isActive={page === p}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        if (p === 4 || (p === totalPages - 3 && totalPages > 6)) {
                          return (
                            <PaginationItem key={`ellipsis-${p}`}>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p>No patients found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

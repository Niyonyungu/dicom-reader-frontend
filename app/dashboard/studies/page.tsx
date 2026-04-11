"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { listStudies } from "@/services/studies-service";
import { StudyListResponse, StudyListFilters } from "@/types/clinical-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationLink,
} from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, Plus, Search, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Studies Management Page
 * Browse all studies with filtering, searching, and pagination
 */
export default function StudiesPage() {
    const router = useRouter();
    const { can, user } = useAuth();

    // State
    const [studies, setStudies] = useState<StudyListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("new");
    const [modalityFilter, setModalityFilter] = useState("");

    // Fetch studies
    useEffect(() => {
        const fetchStudies = async () => {
            try {
                setLoading(true);
                setError(null);

                const filters: StudyListFilters = {
                    page,
                    page_size: pageSize,
                    status: (statusFilter || undefined) as any,
                    modality: modalityFilter || undefined,
                    search: searchText || undefined,
                };

                const data = await listStudies(filters);
                setStudies(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load studies");
            } finally {
                setLoading(false);
            }
        };

        fetchStudies();
    }, [page, pageSize, searchText, statusFilter, modalityFilter]);

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "new":
                return "bg-blue-100 text-blue-800";
            case "ongoing":
                return "bg-amber-100 text-amber-800";
            case "completed":
                return "bg-green-100 text-green-800";
            case "archived":
                return "bg-slate-100 text-slate-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const totalPages = studies ? Math.ceil(studies.total / pageSize) : 1;

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Studies</h1>
                    <p className="text-muted-foreground mt-1">
                        Browse and manage DICOM studies
                    </p>
                </div>
                {can("study.write") && (
                    <Button
                        onClick={() => router.push("/dashboard/studies/new")}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Study
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    {/* Search */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by description, patient, study UID..."
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            onClick={() => {
                                setPage(1);
                            }}
                            variant="outline"
                            size="icon"
                            title="Search"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Filter row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="text-sm font-semibold mb-1 block text-muted-foreground">
                                Status
                            </label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="ongoing">Ongoing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                    <SelectItem value="">All Statuses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Modality Filter */}
                        <div>
                            <label className="text-sm font-semibold mb-1 block text-muted-foreground">
                                Modality
                            </label>
                            <Select value={modalityFilter} onValueChange={setModalityFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Modalities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Modalities</SelectItem>
                                    <SelectItem value="CT">CT</SelectItem>
                                    <SelectItem value="MR">MR</SelectItem>
                                    <SelectItem value="XR">XR (X-Ray)</SelectItem>
                                    <SelectItem value="US">US (Ultrasound)</SelectItem>
                                    <SelectItem value="NM">NM (Nuclear Medicine)</SelectItem>
                                    <SelectItem value="PT">PT (PET)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Page Size */}
                        <div>
                            <label className="text-sm font-semibold mb-1 block text-muted-foreground">
                                Items per Page
                            </label>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(val) => {
                                    setPageSize(Number(val));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Current Status */}
                        <div>
                            <label className="text-sm font-semibold mb-1 block text-muted-foreground">
                                Total Results
                            </label>
                            <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                                <span className="font-semibold">{studies?.total || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reset button */}
                    <div>
                        <Button
                            onClick={() => {
                                setSearchText("");
                                setStatusFilter("new");
                                setModalityFilter("");
                                setPage(1);
                            }}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reset Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Loading State */}
            {loading ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading studies...</span>
                        </div>
                    </CardContent>
                </Card>
            ) : studies && studies.items && studies.items.length > 0 ? (
                <>
                    {/* Studies Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Studies ({studies.total})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead>Study Date</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Modality</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Instances</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studies.items.map((study) => (
                                            <TableRow
                                                key={study.id}
                                                className="hover:bg-muted/50 cursor-pointer"
                                            >
                                                <TableCell>{formatDate(study.study_date)}</TableCell>
                                                <TableCell className="font-medium">
                                                    {study.patient_id}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{study.modality}</Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {study.description || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(study.study_status || "new")}>
                                                        {study.study_status?.replace(/_/g, " ") || "New"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {study.instance_count || 0}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        onClick={() =>
                                                            router.push(
                                                                `/dashboard/studies/${study.id}`
                                                            )
                                                        }
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

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
                                        if (
                                            p <= 3 ||
                                            p >= totalPages - 2 ||
                                            (p >= page - 1 && p <= page + 1)
                                        ) {
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
                </>
            ) : (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <p className="text-muted-foreground mb-4">No studies found</p>
                            {can("study.write") && (
                                <Button
                                    onClick={() => router.push("/dashboard/studies/new")}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create First Study
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

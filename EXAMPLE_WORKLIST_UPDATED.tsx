/**
 * EXAMPLE: Updated Worklist Page
 * Shows how to migrate from mock data to real backend API
 * 
 * This is a REFERENCE implementation. Copy patterns to your actual components.
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useStudies } from "@/hooks/use-clinical-api";
import {
    StudiesLoadingSkeleton,
    PermissionDenied,
    ErrorState,
    NoStudiesState,
} from "@/components/clinical-ui-helpers";
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
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ListTodo, Search, RefreshCw, AlertCircle } from "lucide-react";

/**
 * UPDATED WORKLIST PAGE
 * Key changes from mock data version:
 * 1. Uses useStudies() hook instead of useWorklist() context
 * 2. Handles loading and error states
 * 3. Checks permissions before rendering
 * 4. Uses backend filters (status, modality, date range)
 * 5. Handles pagination from API response
 */
export default function WorklistPage() {
    const router = useRouter();
    const { can } = useAuth();

    // Filter state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("pending");
    const [modalityFilter, setModalityFilter] = useState<string>("");

    // Fetch studies from backend with filters
    const { data: studiesData, loading, error, hasPermission, retry } = useStudies(
        {
            page,
            page_size: pageSize,
            status: (statusFilter || undefined) as any,
            modality: modalityFilter || undefined,
            search: searchText || undefined,
        },
        false // Don't skip loading
    );

    // Check if user can perform actions
    const canViewStudies = hasPermission;
    const canUploadDicom = can("dicom.upload");
    const canCreateStudy = can("study.write");

    // Permission denied
    if (!canViewStudies) {
        return (
            <div className="p-8">
                <PermissionDenied
                    permission="study.read"
                    returnTo={{
                        label: "Go to Dashboard",
                        onClick: () => router.push("/dashboard"),
                    }}
                />
            </div>
        );
    }

    // Loading
    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Worklist</h1>
                    <p className="text-muted-foreground mt-1">
                        Pending studies awaiting review
                    </p>
                </div>
                <StudiesLoadingSkeleton />
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Worklist</h1>
                </div>
                <ErrorState
                    title="Failed to load worklist"
                    message={error.message}
                    onRetry={retry}
                />
            </div>
        );
    }

    // No studies
    if (!studiesData?.items || studiesData.items.length === 0) {
        return (
            <div className="p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Worklist</h1>
                    <p className="text-muted-foreground mt-1">
                        Pending studies awaiting review
                    </p>
                </div>
                <NoStudiesState
                    onAddStudy={
                        canCreateStudy ? () => router.push("/dashboard/studies/new") : undefined
                    }
                />
            </div>
        );
    }

    // Helper: get status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-amber-100 text-amber-800";
            case "in_progress":
                return "bg-blue-100 text-blue-800";
            case "completed":
                return "bg-green-100 text-green-800";
            case "archived":
                return "bg-slate-100 text-slate-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Helper: format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Handle row click - navigate to viewer
    const handleStudyClick = (studyId: number) => {
        router.push(`/dashboard/viewer/${studyId}`);
    };

    const studies = studiesData.items;
    const totalPages = Math.ceil(studiesData.total / pageSize);

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ListTodo className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold text-foreground">Worklist</h1>
                    </div>
                    <p className="text-muted-foreground">
                        {studiesData.total} total studies
                    </p>
                </div>
                <div className="flex gap-2">
                    {canUploadDicom && (
                        <Button onClick={() => router.push("/dashboard/upload")}>
                            Upload DICOM
                        </Button>
                    )}
                    {canCreateStudy && (
                        <Button
                            onClick={() => router.push("/dashboard/studies/new")}
                            variant="outline"
                        >
                            New Study
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    {/* Search */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by description, patient name, study UID..."
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    setPage(1); // Reset to page 1 on search
                                }}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            onClick={retry}
                            variant="outline"
                            size="icon"
                            title="Refresh"
                        >
                            <RefreshCw className="h-4 w-4" />
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
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
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
                            <Select value={pageSize.toString()} onValueChange={(val) => {
                                setPageSize(Number(val));
                                setPage(1);
                            }}>
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
                                <span className="font-semibold">{studiesData.total}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Studies Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Studies</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead>Study Date</TableHead>
                                    <TableHead>Modality</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Institution</TableHead>
                                    <TableHead>Instances</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studies.map((study) => (
                                    <TableRow
                                        key={study.id}
                                        hover="bg-muted/50 cursor-pointer"
                                        className="hover:bg-muted/50 cursor-pointer"
                                    >
                                        <TableCell>{formatDate(study.study_date)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{study.modality}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {study.description || "—"}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {study.institution_name || "—"}
                                        </TableCell>
                                        <TableCell>{study.instance_count || 0}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(study.study_status)}>
                                                {study.study_status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                onClick={() => handleStudyClick(study.id)}
                                                size="sm"
                                                variant="outline"
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    {page > 1 && (
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => setPage(page - 1)}
                                                href="#"
                                            />
                                        </PaginationItem>
                                    )}

                                    {/* Page numbers */}
                                    {Array.from({ length: Math.min(5, totalPages) }).map(
                                        (_, i) => {
                                            let pageNum = page;
                                            if (totalPages > 5) {
                                                if (page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (page >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = page - 2 + i;
                                                }
                                            } else {
                                                pageNum = i + 1;
                                            }

                                            return (
                                                <PaginationItem key={pageNum}>
                                                    <PaginationLink
                                                        onClick={() => setPage(pageNum)}
                                                        isActive={pageNum === page}
                                                        href="#"
                                                    >
                                                        {pageNum}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                    )}

                                    {page < totalPages && (
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => setPage(page + 1)}
                                                href="#"
                                            />
                                        </PaginationItem>
                                    )}
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

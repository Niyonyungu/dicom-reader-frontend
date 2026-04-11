/**
 * Series Browser Component
 * Display and manage DICOM series within a study
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, Loader2, Filter } from "lucide-react";

export interface Series {
    id: string;
    study_id: string;
    series_number: number;
    series_description: string;
    modality: string;
    body_part_examined?: string;
    protocol_name?: string;
    series_date?: string;
    total_instances: number;
    created_at: string;
}

export interface SeriesBrowserProps {
    studyId: string;
    series: Series[];
    loading?: boolean;
    error?: string | null;
    onSelectSeries?: (series: Series) => void;
    onRefresh?: () => Promise<void>;
}

/**
 * Series Browser Component
 * Displays a list of series with filtering and selection
 */
export function SeriesBrowser({
    studyId,
    series,
    loading = false,
    error = null,
    onSelectSeries,
    onRefresh,
}: SeriesBrowserProps) {
    const [searchText, setSearchText] = useState("");
    const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Filter series
    const filteredSeries = series.filter((s) =>
        s.series_description.toLowerCase().includes(searchText.toLowerCase()) ||
        s.protocol_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        s.body_part_examined?.toLowerCase().includes(searchText.toLowerCase())
    );

    // Handle refresh
    const handleRefresh = async () => {
        if (!onRefresh) return;
        try {
            setRefreshing(true);
            await onRefresh();
        } finally {
            setRefreshing(false);
        }
    };

    // Handle series selection
    const handleSelectSeries = (s: Series) => {
        setSelectedSeriesId(s.id);
        if (onSelectSeries) {
            onSelectSeries(s);
        }
    };

    // Format date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Series ({series.length})</h3>
                {onRefresh && (
                    <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                    >
                        {refreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Filter className="h-4 w-4" />
                        )}
                        Refresh
                    </Button>
                )}
            </div>

            {/* Error */}
            {error && (
                <Alert variant="destructive" className="text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Search */}
            <Input
                placeholder="Search series by description, protocol, or body part..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-9"
            />

            {/* Loading */}
            {loading ? (
                <Card>
                    <CardContent className="py-8">
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                                Loading series...
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ) : filteredSeries.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead>Series #</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Modality</TableHead>
                                <TableHead>Body Part</TableHead>
                                <TableHead>Instances</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSeries.map((s) => (
                                <TableRow
                                    key={s.id}
                                    className={`cursor-pointer transition ${selectedSeriesId === s.id ? "bg-muted" : "hover:bg-muted/50"
                                        }`}
                                >
                                    <TableCell className="font-mono text-sm font-semibold">
                                        {s.series_number}
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className="truncate font-medium">
                                            {s.series_description}
                                        </div>
                                        {s.protocol_name && (
                                            <div className="text-xs text-muted-foreground truncate">
                                                {s.protocol_name}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{s.modality}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {s.body_part_examined || "—"}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                        {s.total_instances}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(s.series_date)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            onClick={() => handleSelectSeries(s)}
                                            size="sm"
                                            variant={
                                                selectedSeriesId === s.id ? "default" : "outline"
                                            }
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
            ) : (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            {searchText ? "No series found matching your search" : "No series available"}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary */}
            {series.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Total Series</p>
                                <p className="text-2xl font-bold">{series.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Total Instances
                                </p>
                                <p className="text-2xl font-bold">
                                    {series.reduce((sum, s) => sum + s.total_instances, 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Modalities</p>
                                <p className="text-2xl font-bold">
                                    {new Set(series.map((s) => s.modality)).size}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

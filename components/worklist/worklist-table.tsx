'use client';

import { WorklistItem } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { useReports } from '@/context/reports-context';

interface WorklistTableProps {
  items: WorklistItem[];
}

export function WorklistTable({ items }: WorklistTableProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getViewedStatus = (images: any[]) => {
    const viewedCount = images.filter(img => img.viewed).length;
    const totalCount = images.length;
    if (viewedCount === 0) return 'Not viewed';
    if (viewedCount === totalCount) return 'All viewed';
    return `${viewedCount}/${totalCount} viewed`;
  };

  const getModalityColor = (modality: string) => {
    switch (modality) {
      case 'MRI':
        return 'bg-primary/20 text-primary';
      case 'CT':
        return 'bg-secondary/20 text-secondary';
      case 'XR':
        return 'bg-accent/20 text-accent';
      case 'US':
        return 'bg-primary/20 text-primary';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No worklist items found</p>
      </div>
    );
  }

  const { getReportsByWorklist } = useReports();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'new':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Patient ID
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Patient Name
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Modality
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Priority
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Study Date
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Study Time
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Description
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Referring
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Images
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Viewed
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Report
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-3 text-foreground font-medium">
                {item.patientId}
              </td>
              <td className="px-4 py-3 text-foreground">{item.patientName}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getModalityColor(
                    item.modality
                  )}`}
                >
                  {item.modality}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                    item.priority || 'normal'
                  )}`}
                >
                  {(item.priority || 'normal').charAt(0).toUpperCase() + (item.priority || 'normal').slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-foreground">{item.studyDate}</td>
              <td className="px-4 py-3 text-foreground">{item.studyTime}</td>
              <td className="px-4 py-3 text-foreground text-xs max-w-xs truncate">
                <div>{item.description}</div>
                {item.details && (
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {item.details}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-foreground">
                {item.referringPhysician || '-'}
              </td>
              <td className="px-4 py-3 text-foreground text-center">
                {item.imageCount}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    item.status
                  )}`}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-foreground text-xs">
                {getViewedStatus(item.images)}
              </td>
              <td className="px-4 py-3">
                {getReportsByWorklist(item.id) ? (
                  <Link href={`/dashboard/reports`}>
                    <span className="text-primary hover:underline text-xs">
                      Yes
                    </span>
                  </Link>
                ) : (
                  <span className="text-muted-foreground text-xs">No</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Link href={`/dashboard/viewer/${item.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

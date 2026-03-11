'use client';

import { WorklistItem } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

interface WorklistTableProps {
  items: WorklistItem[];
}

export function WorklistTable({ items }: WorklistTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'ongoing':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'new':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getModalityColor = (modality: string) => {
    switch (modality) {
      case 'MRI':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'CT':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'XR':
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400';
      case 'US':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No worklist items found</p>
      </div>
    );
  }

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
              Study Date
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Study Time
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Description
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Images
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Status
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
              <td className="px-4 py-3 text-foreground">{item.studyDate}</td>
              <td className="px-4 py-3 text-foreground">{item.studyTime}</td>
              <td className="px-4 py-3 text-foreground text-xs max-w-xs truncate">
                {item.description}
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

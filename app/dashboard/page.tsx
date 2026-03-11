'use client';

import { useAuth } from '@/context/auth-context';
import { useWorklist } from '@/context/worklist-context';
import { usePatients } from '@/context/patients-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, FileText, Zap } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { worklist } = useWorklist();
  const { patients } = usePatients();

  const recentStudies = worklist.slice(0, 5);
  const completedStudies = worklist.filter((w) => w.status === 'completed').length;
  const ongoingStudies = worklist.filter((w) => w.status === 'ongoing').length;

  const stats = [
    {
      title: 'Total Patients',
      value: patients.length.toString(),
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Studies',
      value: worklist.length.toString(),
      icon: FileText,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Completed',
      value: completedStudies.toString(),
      icon: Activity,
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      title: 'In Progress',
      value: ongoingStudies.toString(),
      icon: Zap,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your medical imaging system today.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Studies */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Recent Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentStudies.length === 0 ? (
              <p className="text-muted-foreground text-sm">No studies available</p>
            ) : (
              recentStudies.map((study) => (
                <div
                  key={study.id}
                  className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {study.patientName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {study.description}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{study.modality}</span>
                        <span>{study.studyDate} {study.studyTime}</span>
                        <span>{study.imageCount} images</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          study.status === 'completed'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                            : study.status === 'ongoing'
                            ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {study.status.charAt(0).toUpperCase() +
                          study.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Info */}
      <Card className="border-border bg-card/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Role: <span className="font-semibold text-foreground capitalize">{user?.role}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

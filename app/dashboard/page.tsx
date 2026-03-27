'use client';

import { useAuth } from '@/context/auth-context';
import { useWorklist } from '@/context/worklist-context';
import { usePatients } from '@/context/patients-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, FileText, Zap } from 'lucide-react';
import { WorklistTable } from '@/components/worklist/worklist-table';

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
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Total Studies',
      value: worklist.length.toString(),
      icon: FileText,
      color: 'bg-secondary/10 text-secondary',
    },
    {
      title: 'Completed',
      value: completedStudies.toString(),
      icon: Activity,
      color: 'bg-accent/10 text-accent',
    },
    {
      title: 'In Progress',
      value: ongoingStudies.toString(),
      icon: Zap,
      color: 'bg-primary/10 text-primary dark:text-primary',
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

      {/* Recent Studies (compact table) */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Recent Studies</CardTitle>
        </CardHeader>
        <CardContent>
          {recentStudies.length === 0 ? (
            <p className="text-muted-foreground text-sm">No studies available</p>
          ) : (
            <WorklistTable items={recentStudies} />
          )}
        </CardContent>
      </Card>

      {/* Quick Info */}
      {/* <Card className="border-border bg-card/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Role: <span className="font-semibold text-foreground capitalize">{user?.role}</span>
          </p>
        </CardContent>
      </Card> */}
    </div>
  );
}

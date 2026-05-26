// ==========================================
// HyperPush — Dashboard Home (Overview)
// ==========================================

import { Card } from '@app/components/ui';
import { Server, KeyRound, ScrollText, Cloud } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  icon: typeof Server;
  color: string;
}

const stats: StatCard[] = [
  { title: 'Servers', value: '--', icon: Server, color: 'text-blue-600' },
  { title: 'API Keys', value: '--', icon: KeyRound, color: 'text-green-600' },
  { title: 'Audit Logs', value: '--', icon: ScrollText, color: 'text-purple-600' },
  { title: 'CodePush Apps', value: '--', icon: Cloud, color: 'text-orange-600' },
];

export function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          System Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} padding="lg">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg bg-gray-50 p-3 dark:bg-dark-700 ${stat.color}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Placeholder */}
      <Card padding="lg">
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Once you write the backend GraphQL resolvers, real-time data will appear here
          </p>
        </div>
      </Card>
    </div>
  );
}

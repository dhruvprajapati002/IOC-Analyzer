import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <div className="h-8 bg-t-surface rounded w-48 mb-2"></div>
          <div className="h-4 bg-t-surface rounded w-80"></div>
        </div>
        <div className="flex items-center justify-center space-x-4 sm:space-x-6">
          <div className="text-center">
            <div className="h-8 bg-t-surface rounded w-16 mb-1"></div>
            <div className="h-3 bg-t-surface rounded w-20"></div>
          </div>
          <div className="text-center">
            <div className="h-8 bg-t-surface rounded w-16 mb-1"></div>
            <div className="h-3 bg-t-surface rounded w-24"></div>
          </div>
          <div className="h-8 bg-t-surface rounded w-24"></div>
        </div>
      </div>

      {/* Main Form Skeleton */}
      <Card className="bg-t-bg/50 border-t-border">
        <CardHeader>
          <div className="h-6 bg-t-surface rounded w-40 mb-2"></div>
          <div className="h-4 bg-t-surface rounded w-96"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 bg-t-surface rounded w-full"></div>
          <div className="flex space-x-2">
            <div className="h-10 bg-t-surface rounded w-32"></div>
            <div className="h-10 bg-t-surface rounded w-24"></div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-t-bg/50 border-t-border">
            <CardContent className="p-4">
              <div className="h-4 bg-t-surface rounded w-24 mb-2"></div>
              <div className="h-8 bg-t-surface rounded w-16 mb-1"></div>
              <div className="h-3 bg-t-surface rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-t-bg/50 border-t-border">
          <CardHeader>
            <div className="h-5 bg-t-surface rounded w-32 mb-2"></div>
            <div className="h-3 bg-t-surface rounded w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-t-surface rounded"></div>
          </CardContent>
        </Card>
        
        <Card className="bg-t-bg/50 border-t-border">
          <CardHeader>
            <div className="h-5 bg-t-surface rounded w-40 mb-2"></div>
            <div className="h-3 bg-t-surface rounded w-56"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-t-surface rounded"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function QuickStatsskeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-t-surface rounded w-32 mb-3"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 bg-t-surface rounded w-20"></div>
            <div className="h-3 bg-t-surface rounded w-8"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

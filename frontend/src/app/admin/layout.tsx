import React from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata = {
  title: 'MyCast Admin Portal',
  description: 'Trung tâm điều hành và quản trị hệ thống phân tán MyCast',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

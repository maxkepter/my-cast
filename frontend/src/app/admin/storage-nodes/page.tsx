'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StorageNode } from '@/types/storage-admin';
import { getStorageErrorMessage, storageAdminService } from '@/services/storage-admin.service';
import { StorageStatsCards } from '@/components/admin/storage/storage-stats-cards';
import { StorageNodeFilterBar } from '@/components/admin/storage/storage-node-filter-bar';
import { StorageNodeTable } from '@/components/admin/storage/storage-node-table';
import { CreateStorageNodeModal } from '@/components/admin/storage/create-storage-node-modal';
import { EditStorageNodeModal } from '@/components/admin/storage/edit-storage-node-modal';
import { DeleteStorageNodeDialog } from '@/components/admin/storage/delete-storage-node-dialog';
import { StorageNodeDetailDrawer } from '@/components/admin/storage/storage-node-detail-drawer';

interface ToastAlert {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function StorageNodesPage() {
  const [nodes, setNodes] = useState<StorageNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'unhealthy'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals & Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<StorageNode | null>(null);
  const [deletingNode, setDeletingNode] = useState<StorageNode | null>(null);
  const [detailNode, setDetailNode] = useState<StorageNode | null>(null);

  // In-flight Action States
  const [probingNodeId, setProbingNodeId] = useState<string | null>(null);
  const [togglingNodeId, setTogglingNodeId] = useState<string | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<ToastAlert | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Refresh nodes manually
  const refreshNodes = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setLoadError(null);
      const res = await storageAdminService.list();
      setNodes(res.nodes || []);
      showToast('success', 'Đã làm mới danh sách Storage Nodes');
    } catch (err: unknown) {
      const msg = getStorageErrorMessage(err);
      setLoadError(msg);
      showToast('error', `Không thể tải danh sách nodes: ${msg}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    storageAdminService
      .list()
      .then((res) => {
        if (isMounted) {
          setNodes(res.nodes || []);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = getStorageErrorMessage(err);
          setLoadError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Quick Probe Health Check
  const handleProbe = async (nodeId: string) => {
    try {
      setProbingNodeId(nodeId);
      const res = await storageAdminService.healthCheck(nodeId);

      // Update node health in place
      setNodes((prev) =>
        prev.map((n) => (n.nodeId === nodeId ? { ...n, isHealthy: res.isHealthy } : n))
      );

      // Also update detail drawer if open for this node
      if (detailNode && detailNode.nodeId === nodeId) {
        setDetailNode((prev) => (prev ? { ...prev, isHealthy: res.isHealthy } : null));
      }

      if (res.isHealthy) {
        showToast('success', `Probe thành công: Node [${nodeId}] đang khỏe mạnh và phản hồi tốt.`);
      } else {
        showToast('error', `Cảnh báo: Node [${nodeId}] không phản hồi (Mất kết nối).`);
      }
    } catch (err: unknown) {
      showToast('error', `Lỗi khi kiểm tra kết nối: ${getStorageErrorMessage(err)}`);
    } finally {
      setProbingNodeId(null);
    }
  };

  // Handle Toggle Active
  const handleToggleActive = async (node: StorageNode) => {
    const nextState = !node.isActive;
    try {
      setTogglingNodeId(node.nodeId);
      const updated = await storageAdminService.update(node.nodeId, { isActive: nextState });

      // Update in state
      setNodes((prev) =>
        prev.map((n) => (n.nodeId === node.nodeId ? { ...n, isActive: updated.isActive } : n))
      );

      if (detailNode && detailNode.nodeId === node.nodeId) {
        setDetailNode((prev) => (prev ? { ...prev, isActive: updated.isActive } : null));
      }

      showToast(
        'info',
        `Node [${node.nodeId}] đã được ${nextState ? 'kích hoạt' : 'tạm dừng'}.`
      );
    } catch (err: unknown) {
      showToast('error', `Không thể thay đổi trạng thái: ${getStorageErrorMessage(err)}`);
    } finally {
      setTogglingNodeId(null);
    }
  };

  // Success Callbacks
  const handleCreateSuccess = (newNode: StorageNode) => {
    setNodes((prev) => [newNode, ...prev]);
    setIsCreateOpen(false);
    showToast('success', `Đã thêm mới thành công Storage Node: ${newNode.name} (${newNode.nodeId})`);
  };

  const handleEditSuccess = (updatedNode: StorageNode) => {
    setNodes((prev) =>
      prev.map((n) => (n.nodeId === updatedNode.nodeId ? updatedNode : n))
    );
    if (detailNode && detailNode.nodeId === updatedNode.nodeId) {
      setDetailNode(updatedNode);
    }
    setEditingNode(null);
    showToast('success', `Đã cập nhật cấu hình cho Storage Node: ${updatedNode.nodeId}`);
  };

  const handleDeleteSuccess = () => {
    if (deletingNode) {
      const deletedId = deletingNode.nodeId;
      setNodes((prev) => prev.filter((n) => n.nodeId !== deletedId));
      if (detailNode && detailNode.nodeId === deletedId) {
        setDetailNode(null);
      }
      setDeletingNode(null);
      showToast('success', `Đã xóa vĩnh viễn Storage Node [${deletedId}] khỏi hệ thống.`);
    }
  };

  // Filter Logic (Client-side fast search)
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = node.name.toLowerCase().includes(q);
        const matchesId = node.nodeId.toLowerCase().includes(q);
        const matchesBucket = node.bucket.toLowerCase().includes(q);
        const matchesEndpoint = node.endpoint.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesBucket && !matchesEndpoint) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'healthy' && !node.isHealthy) return false;
      if (statusFilter === 'unhealthy' && node.isHealthy) return false;

      // 3. Active Filter
      if (activeFilter === 'active' && !node.isActive) return false;
      if (activeFilter === 'inactive' && node.isActive) return false;

      return true;
    });
  }, [nodes, search, statusFilter, activeFilter]);

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-[#ececec] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm transition-all border animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'success'
              ? 'bg-[#2d2d2d] text-[#ececec] border-[#9bf73c]/50'
              : toast.type === 'error'
              ? 'bg-[#2d2d2d] text-[#ececec] border-[#ff5c5c]/50'
              : 'bg-[#2d2d2d] text-[#ececec] border-[#3cc8f7]/50'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success'
                ? 'bg-[#9bf73c]/20 text-[#9bf73c]'
                : toast.type === 'error'
                ? 'bg-[#ff5c5c]/20 text-[#ff5c5c]'
                : 'bg-[#3cc8f7]/20 text-[#3cc8f7]'
            }`}
          >
            {toast.type === 'success' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="flex-1 font-medium">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className="text-[#8a8a8a] hover:text-[#ececec]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#525252]/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#9bf73c]/10 text-[#9bf73c] border border-[#9bf73c]/30">
              Storage Cluster
            </span>
            <span className="text-xs text-[#8a8a8a]">• Quản trị hạ tầng phân tán</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#ececec]">
            Quản Lý Storage Nodes
          </h1>
          <p className="text-sm text-[#8a8a8a] mt-1">
            Cấu hình và phân phối tải các cụm lưu trữ S3 / MinIO cho video, audio transcode và media segments.
          </p>
        </div>
      </div>

      {/* Load Error Alert */}
      {loadError && (
        <div className="p-4 bg-[#ff5c5c]/10 border border-[#ff5c5c]/40 rounded-xl flex items-center justify-between gap-3 text-sm text-[#ff5c5c]">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={refreshNodes}
            className="px-3 py-1 bg-[#ff5c5c] hover:bg-[#ff7070] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 1. Storage Stats Cards (4 KPI Cards) */}
      <StorageStatsCards nodes={nodes} isLoading={isLoading} />

      {/* 2. Filter Bar */}
      <StorageNodeFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        onRefresh={refreshNodes}
        isRefreshing={isRefreshing}
        onOpenCreateModal={() => setIsCreateOpen(true)}
      />

      {/* 3. Storage Nodes Table */}
      <StorageNodeTable
        nodes={filteredNodes}
        isLoading={isLoading}
        onProbe={handleProbe}
        probingNodeId={probingNodeId}
        onToggleActive={handleToggleActive}
        togglingNodeId={togglingNodeId}
        onViewDetail={(node) => setDetailNode(node)}
        onEdit={(node) => setEditingNode(node)}
        onDelete={(node) => setDeletingNode(node)}
      />

      {/* 4. Modals & Dialogs */}
      <CreateStorageNodeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditStorageNodeModal
        isOpen={!!editingNode}
        node={editingNode}
        onClose={() => setEditingNode(null)}
        onSuccess={handleEditSuccess}
      />

      <DeleteStorageNodeDialog
        isOpen={!!deletingNode}
        node={deletingNode}
        onClose={() => setDeletingNode(null)}
        onSuccess={handleDeleteSuccess}
      />

      <StorageNodeDetailDrawer
        isOpen={!!detailNode}
        node={detailNode}
        onClose={() => setDetailNode(null)}
        onProbe={handleProbe}
        isProbing={probingNodeId === detailNode?.nodeId}
      />
    </div>
  );
}

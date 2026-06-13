"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import { api, PurchaseOrder, PurchaseOrderStatus } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge, statusVariant } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-blocks";

const NEXT_STATUS: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus>> = {
  DRAFT: "APPROVED",
  APPROVED: "SHIPPING",
  SHIPPING: "RECEIVED",
};

type FormData = { supplierId: string; totalAmount: string };

export function PurchaseOrdersModule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ supplierId: "", totalAmount: "" });
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => api.getPurchaseOrders(),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.getSuppliers(),
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPurchaseOrder({
        supplierId: form.supplierId,
        totalAmount: Number(form.totalAmount),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      setOpen(false);
      setForm({ supplierId: "", totalAmount: "" });
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      api.updatePurchaseOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["shipments"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePurchaseOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Procurement workflow: DRAFT → APPROVED → SHIPPING → RECEIVED"
        action={
          isAdmin ? (
            <Button onClick={() => { setOpen(true); setError(null); }}>
              <Plus className="h-4 w-4" /> New PO
            </Button>
          ) : undefined
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load purchase orders" />}
      {!isLoading && !isError && (data?.purchaseOrders ?? []).length === 0 && <EmptyState message="No purchase orders yet" />}

      {(data?.purchaseOrders ?? []).length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Shipments</TableHead>
              <TableHead>Created</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.purchaseOrders ?? []).map((po: PurchaseOrder) => {
              const next = NEXT_STATUS[po.status];
              return (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-xs">{po.poNumber}</TableCell>
                  <TableCell>{po.supplier?.name}</TableCell>
                  <TableCell>${Number(po.totalAmount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={statusVariant(po.status)}>{po.status}</Badge></TableCell>
                  <TableCell>{po.shipments?.length ?? 0}</TableCell>
                  <TableCell>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {next && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => statusMutation.mutate({ id: po.id, status: next })}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                            {next}
                          </Button>
                        )}
                        {po.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Delete ${po.poNumber}?`)) deleteMutation.mutate(po.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="New Purchase Order">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">Select supplier</option>
              {(suppliersData?.suppliers ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Total Amount (USD)</Label>
            <Input type="number" min="0" step="0.01" required value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          </div>
          {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>Create PO</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

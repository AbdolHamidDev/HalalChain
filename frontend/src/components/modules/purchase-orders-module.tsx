"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronRight, Trash2, Loader2, Minus } from "lucide-react";
import { toast } from "sonner";
import { api, PurchaseOrder, PurchaseOrderStatus } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { dialog } from "@/lib/dialog";
import { Input, InputWrapper, InputLabel, InputError, InputHint } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge, statusVariant } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/state-blocks";

const NEXT_STATUS: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus>> = {
  DRAFT: "APPROVED",
  APPROVED: "SHIPPING",
  SHIPPING: "RECEIVED",
};

const STATUS_LABEL: Partial<Record<PurchaseOrderStatus, string>> = {
  APPROVED: "Approve",
  SHIPPING: "Mark Shipping",
  RECEIVED: "Mark Received",
};

type OrderItem = { productId: string; quantity: string; unitPrice: string };
type FormData = { supplierId: string; items: OrderItem[] };

const emptyItem = (): OrderItem => ({ productId: "", quantity: "1", unitPrice: "" });

export function PurchaseOrdersModule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ supplierId: "", items: [emptyItem()] });
  const [error, setError] = useState<string | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => api.getPurchaseOrders(),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.getSuppliers(),
    enabled: isAdmin,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPurchaseOrder({
        supplierId: form.supplierId,
        items: form.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      setOpen(false);
      setForm({ supplierId: "", items: [emptyItem()] });
      setError(null);
      toast.success("Purchase order created", {
        description: `${result.purchaseOrder.poNumber} has been created as a draft.`,
      });
    },
    onError: (e: Error) => setError(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) => {
      setPendingStatusId(id);
      return api.updatePurchaseOrderStatus(id, status);
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["shipments"] });
      setPendingStatusId(null);
      const statusLabel = status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
      toast.success("Status updated", {
        description: `Purchase order has been moved to ${statusLabel}.`,
      });
    },
    onError: (e: Error) => {
      setPendingStatusId(null);
      toast.error("Failed to update status", { description: e.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePurchaseOrder(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order deleted");
    },
    onError: (e: Error) => {
      toast.error("Failed to delete purchase order", { description: e.message });
    },
  });

  const purchaseOrders = data?.purchaseOrders ?? [];

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

      {isLoading && <TableSkeleton columns={isAdmin ? 7 : 6} rows={5} />}
      {isError && (
        <ErrorState
          message="Failed to load purchase orders"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && purchaseOrders.length === 0 && (
        <EmptyState
          variant="purchase-orders"
          onAction={isAdmin ? () => { setOpen(true); setError(null); } : undefined}
        />
      )}

      {purchaseOrders.length > 0 && (
        <>
          {/* Mobile card view */}
          <div className="grid gap-3 sm:hidden">
            {purchaseOrders.map((po: PurchaseOrder) => {
              const next = NEXT_STATUS[po.status];
              const isAdvancing = pendingStatusId === po.id && statusMutation.isPending;
              return (
                <div key={po.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{po.poNumber}</p>
                      <p className="font-medium truncate">{po.supplier?.name}</p>
                    </div>
                    <Badge variant={statusVariant(po.status)} className="shrink-0">{po.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Amount: <span className="font-medium text-foreground">${Number(po.totalAmount).toLocaleString()}</span></span>
                    <span>Shipments: <span className="font-medium text-foreground">{po.shipments?.length ?? 0}</span></span>
                    <span>{new Date(po.createdAt).toLocaleDateString()}</span>
                  </div>
                  {isAdmin && (next || po.status === "DRAFT") && (
                    <div className="flex gap-2 pt-1 border-t">
                      {next && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          disabled={isAdvancing}
                          onClick={() => statusMutation.mutate({ id: po.id, status: next })}
                        >
                          {isAdvancing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 mr-1" />
                          )}
                          {STATUS_LABEL[next] ?? next}
                        </Button>
                      )}
                      {po.status === "DRAFT" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className={next ? "" : "flex-1"}
                          aria-label={`Delete purchase order ${po.poNumber}`}
                          onClick={async () => {
                            const ok = await dialog.confirm({
                              type: "destructive",
                              title: "Delete purchase order?",
                              description: `This will permanently remove PO "${po.poNumber}". Only DRAFT orders can be deleted.`,
                              confirmLabel: "Delete PO",
                            });
                            if (ok) deleteMutation.mutate(po.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block">
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
                {purchaseOrders.map((po: PurchaseOrder) => {
                  const next = NEXT_STATUS[po.status];
                  const isAdvancing = pendingStatusId === po.id && statusMutation.isPending;
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
                                disabled={isAdvancing}
                                onClick={() => statusMutation.mutate({ id: po.id, status: next })}
                                aria-label={`${STATUS_LABEL[next] ?? next} ${po.poNumber}`}
                              >
                                {isAdvancing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                                {STATUS_LABEL[next] ?? next}
                              </Button>
                            )}
                            {po.status === "DRAFT" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                aria-label={`Delete purchase order ${po.poNumber}`}
                                onClick={async () => {
                                  const ok = await dialog.confirm({
                                    type: "destructive",
                                    title: "Delete purchase order?",
                                    description: `This will permanently remove PO "${po.poNumber}". Only DRAFT orders can be deleted.`,
                                    confirmLabel: "Delete PO",
                                  });
                                  if (ok) deleteMutation.mutate(po.id);
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
          </div>
        </>
      )}

      {/* Create dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} title="New Purchase Order">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
          {/* Supplier */}
          <div className="space-y-2">
            <InputLabel htmlFor="po-supplier">
              Supplier <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Select
              required
              value={form.supplierId}
              onValueChange={(v) => setForm({ ...form, supplierId: v })}
            >
              <SelectTrigger id="po-supplier">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {(suppliersData?.suppliers ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <InputLabel>
              Items <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_90px_32px] gap-2 items-start">
                  <Select
                    value={item.productId}
                    onValueChange={(v) => {
                      const product = (productsData?.products ?? []).find((p) => p.id === v);
                      const updated = form.items.map((it, i) =>
                        i === idx ? { ...it, productId: v, unitPrice: product ? String(product.unitPrice) : it.unitPrice } : it
                      );
                      setForm({ ...form, items: updated });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {(productsData?.products ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    required
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = form.items.map((it, i) =>
                        i === idx ? { ...it, quantity: e.target.value } : it
                      );
                      setForm({ ...form, items: updated });
                    }}
                  />
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const updated = form.items.map((it, i) =>
                        i === idx ? { ...it, unitPrice: e.target.value } : it
                      );
                      setForm({ ...form, items: updated });
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={form.items.length === 1}
                    aria-label="Remove item"
                    onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </div>

          {/* Total preview */}
          {form.items.some((it) => it.quantity && it.unitPrice) && (
            <p className="text-sm text-muted-foreground text-right">
              Total:{" "}
              <span className="font-medium text-foreground">
                ${form.items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0).toFixed(2)}
              </span>
            </p>
          )}

          {error && <InputError role="alert">{error}</InputError>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create PO"}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
}

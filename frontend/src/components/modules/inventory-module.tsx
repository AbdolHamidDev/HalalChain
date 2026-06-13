"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-blocks";

type MovementForm = {
  productId: string;
  warehouseId: string;
  quantity: string;
  note: string;
};

const emptyMovement: MovementForm = {
  productId: "",
  warehouseId: "",
  quantity: "",
  note: "",
};

export function InventoryModule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canMove = user?.role === "ADMIN" || user?.role === "STAFF";
  const [dialogType, setDialogType] = useState<"inbound" | "outbound" | null>(null);
  const [form, setForm] = useState<MovementForm>(emptyMovement);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.getInventory(),
  });

  const { data: movementsData } = useQuery({
    queryKey: ["inventory-movements"],
    queryFn: () => api.getInventoryMovements(),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
    enabled: canMove,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => api.getWarehouses(),
    enabled: canMove,
  });

  const moveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        productId: form.productId,
        warehouseId: form.warehouseId,
        quantity: Number(form.quantity),
        note: form.note || undefined,
      };
      if (dialogType === "inbound") return api.inbound(payload);
      return api.outbound(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory-movements"] });
      setDialogType(null);
      setForm(emptyMovement);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  function openMovement(type: "inbound" | "outbound") {
    setDialogType(type);
    setForm(emptyMovement);
    setError(null);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory Management"
        description="Inbound / outbound stock movements per warehouse with reorder alerts"
        action={
          canMove ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => openMovement("inbound")}>
                <ArrowDownToLine className="h-4 w-4" /> Inbound
              </Button>
              <Button onClick={() => openMovement("outbound")}>
                <ArrowUpFromLine className="h-4 w-4" /> Outbound
              </Button>
            </div>
          ) : undefined
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load inventory" />}
      {!isLoading && !isError && (data?.inventory ?? []).length === 0 && <EmptyState message="No inventory records" />}

      {(data?.inventory ?? []).length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reorder Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.inventory ?? []).map((row) => {
              const low = row.quantity <= row.reorderLevel;
              const value = row.quantity * Number(row.product.unitPrice);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.product.name}</TableCell>
                  <TableCell className="font-mono text-xs">{row.product.sku}</TableCell>
                  <TableCell>{row.warehouse.name}</TableCell>
                  <TableCell>{row.quantity} {row.product.unit}</TableCell>
                  <TableCell>{row.reorderLevel}</TableCell>
                  <TableCell>
                    <Badge variant={low ? "warning" : "success"}>
                      {low ? "Low Stock" : "OK"}
                    </Badge>
                  </TableCell>
                  <TableCell>${value.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Movements</h2>
        {(movementsData?.movements ?? []).length === 0 && (
          <EmptyState message="No movements recorded yet" />
        )}
        {(movementsData?.movements ?? []).length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(movementsData?.movements ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={m.type === "INBOUND" ? "success" : "info"}>
                      {m.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.product.name}</TableCell>
                  <TableCell>{m.warehouse.name}</TableCell>
                  <TableCell>{m.quantity}</TableCell>
                  <TableCell>{m.user?.name ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={dialogType !== null}
        onClose={() => setDialogType(null)}
        title={dialogType === "inbound" ? "Inbound (Nhập kho)" : "Outbound (Xuất kho)"}
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); moveMutation.mutate(); }}>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select product</option>
              {(productsData?.products ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select required value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">Select warehouse</option>
              {(warehousesData?.warehouses ?? []).map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogType(null)}>Cancel</Button>
            <Button type="submit" disabled={moveMutation.isPending}>Confirm</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

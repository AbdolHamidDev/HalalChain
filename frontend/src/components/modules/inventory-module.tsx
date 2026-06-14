"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Filter } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/state-blocks";

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

  // Filter state
  const [filterWarehouseId, setFilterWarehouseId] = useState<string>("");
  const [filterProductId, setFilterProductId] = useState<string>("");
  const [filterBelowReorder, setFilterBelowReorder] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Movement dialog state
  const [dialogType, setDialogType] = useState<"inbound" | "outbound" | null>(null);
  const [form, setForm] = useState<MovementForm>(emptyMovement);
  const [error, setError] = useState<string | null>(null);

  // Build query key including filters so refetch triggers on filter change
  const inventoryQueryKey = [
    "inventory",
    { warehouseId: filterWarehouseId, productId: filterProductId, belowReorder: filterBelowReorder },
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: inventoryQueryKey,
    queryFn: () =>
      api.getInventory({
        warehouseId: filterWarehouseId || undefined,
        productId: filterProductId || undefined,
        belowReorder: filterBelowReorder || undefined,
        limit: 100,
      }),
  });

  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ["inventory-movements"],
    queryFn: () => api.getInventoryMovements(),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
    enabled: canMove || showFilters,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => api.getWarehouses({ limit: 100 }),
    enabled: canMove || showFilters,
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
      const product = productsData?.products.find((p) => p.id === form.productId);
      const productName = product?.name ?? "product";
      toast.success(
        dialogType === "inbound" ? "Inbound movement recorded" : "Outbound movement recorded",
        {
          description: `${form.quantity} units of ${productName} ${dialogType === "inbound" ? "received" : "dispatched"} successfully.`,
        }
      );
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

  function clearFilters() {
    setFilterWarehouseId("");
    setFilterProductId("");
    setFilterBelowReorder(false);
  }

  const hasActiveFilters = !!(filterWarehouseId || filterProductId || filterBelowReorder);
  const inventory = data?.inventory ?? [];
  const movements = movementsData?.movements ?? [];
  const warehouses = warehousesData?.warehouses ?? [];
  const products = productsData?.products ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory Management"
        description="Inbound / outbound stock movements per warehouse with reorder alerts"
        action={
          canMove ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold">
              {[filterWarehouseId, filterProductId, filterBelowReorder].filter(Boolean).length}
            </span>
          )}
        </Button>

        {showFilters && (
          <>
            {/* Warehouse filter */}
            <Select
              value={filterWarehouseId || "__all__"}
              onValueChange={(v) => setFilterWarehouseId(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue placeholder="All warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All warehouses</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Product filter */}
            <Select
              value={filterProductId || "__all__"}
              onValueChange={(v) => setFilterProductId(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All products</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Below reorder filter */}
            <Button
              size="sm"
              variant={filterBelowReorder ? "destructive" : "outline"}
              className="h-8 text-xs"
              onClick={() => setFilterBelowReorder((v) => !v)}
            >
              {filterBelowReorder ? "⚠ Low stock only" : "Show low stock only"}
            </Button>

            {hasActiveFilters && (
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </>
        )}

        {/* Active filter chips when filters collapsed */}
        {!showFilters && hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5">
            {filterWarehouseId && (
              <Badge variant="default" className="text-xs">
                {warehouses.find((w) => w.id === filterWarehouseId)?.name ?? "Warehouse"}
              </Badge>
            )}
            {filterProductId && (
              <Badge variant="default" className="text-xs">
                {products.find((p) => p.id === filterProductId)?.name ?? "Product"}
              </Badge>
            )}
            {filterBelowReorder && (
              <Badge variant="warning" className="text-xs">Low stock</Badge>
            )}
            <button
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Stock levels */}
      {isLoading && <TableSkeleton columns={7} rows={5} />}
      {isError && (
        <ErrorState
          message="Failed to load inventory"
          onRetry={() => refetch()}
        />
      )}
      {!isLoading && !isError && inventory.length === 0 && (
        <EmptyState
          variant="inventory"
          description={
            hasActiveFilters
              ? "No inventory records match the current filters."
              : undefined
          }
        />
      )}

      {inventory.length > 0 && (
        <>
          {/* Result count */}
          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground">
              Showing {inventory.length} record{inventory.length !== 1 ? "s" : ""}
              {data?.total && data.total > inventory.length ? ` of ${data.total}` : ""}
            </p>
          )}

          {/* Mobile card view */}
          <div className="grid gap-3 sm:hidden">
            {inventory.map((row) => {
              const low = row.quantity <= row.reorderLevel;
              const value = row.quantity * Number(row.product.unitPrice);
              return (
                <div key={row.id} className="rounded-xl border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{row.product.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{row.product.sku}</p>
                    </div>
                    <Badge variant={low ? "warning" : "success"} className="shrink-0">
                      {low ? "Low Stock" : "OK"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{row.warehouse.name}</span>
                    <span>Qty: <span className="font-medium text-foreground">{row.quantity} {row.product.unit}</span></span>
                    <span>Reorder: <span className="font-medium text-foreground">{row.reorderLevel}</span></span>
                    <span>Value: <span className="font-medium text-foreground">${value.toLocaleString()}</span></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block">
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
                {inventory.map((row) => {
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
          </div>
        </>
      )}

      {/* Recent Movements */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Movements</h2>

        {isLoadingMovements && <TableSkeleton columns={6} rows={4} />}

        {!isLoadingMovements && movements.length === 0 && (
          <EmptyState variant="inventory-movements" />
        )}

        {movements.length > 0 && (
          <>
            {/* Mobile card view */}
            <div className="grid gap-3 sm:hidden">
              {movements.map((m) => (
                <div key={m.id} className="rounded-xl border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium truncate">{m.product.name}</p>
                    <Badge
                      variant={m.type === "INBOUND" ? "success" : m.type === "OUTBOUND" ? "info" : "default"}
                      className="shrink-0"
                    >
                      {m.type}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{m.warehouse.name}</span>
                    <span>Qty: <span className="font-medium text-foreground">{m.quantity}</span></span>
                    {m.user?.name && <span>By: {m.user.name}</span>}
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block">
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
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={m.type === "INBOUND" ? "success" : m.type === "OUTBOUND" ? "info" : "default"}
                        >
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
            </div>
          </>
        )}
      </div>

      {/* Inbound / Outbound dialog */}
      <Dialog
        open={dialogType !== null}
        onClose={() => setDialogType(null)}
        title={dialogType === "inbound" ? "Record Inbound Stock" : "Record Outbound Dispatch"}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            moveMutation.mutate();
          }}
        >
          <div className="space-y-2">
            <InputLabel htmlFor="move-product">
              Product <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Select
              required
              value={form.productId}
              onValueChange={(v) => setForm({ ...form, productId: v })}
            >
              <SelectTrigger id="move-product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <InputLabel htmlFor="move-warehouse">
              Warehouse <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Select
              required
              value={form.warehouseId}
              onValueChange={(v) => setForm({ ...form, warehouseId: v })}
            >
              <SelectTrigger id="move-warehouse">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name} ({w.location})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <InputWrapper>
            <InputLabel htmlFor="move-quantity">
              Quantity <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="move-quantity"
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="Enter quantity"
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="move-note">
              Note{" "}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </InputLabel>
            <Input
              id="move-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder={dialogType === "inbound" ? "e.g. Received from supplier" : "e.g. Dispatched to customer"}
            />
          </InputWrapper>
          {error && (
            <InputError role="alert">{error}</InputError>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogType(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={moveMutation.isPending}>
              {moveMutation.isPending
                ? "Recording…"
                : dialogType === "inbound"
                  ? "Confirm Inbound"
                  : "Confirm Outbound"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, Shipment, ShipmentStatus } from "@/lib/api";
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
import { Badge, statusVariant } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/state-blocks";

type CreateForm = {
  purchaseOrderId: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  estimatedArrival: string;
};

const emptyCreate: CreateForm = {
  purchaseOrderId: "",
  trackingNumber: "",
  origin: "",
  destination: "",
  estimatedArrival: "",
};

export function ShipmentsModule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  // Edit state
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [editStatus, setEditStatus] = useState<ShipmentStatus>("PENDING");
  const [editTracking, setEditTracking] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Create state
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.getShipments(),
  });

  // Load purchase orders for the create dialog dropdown (ADMIN only)
  const { data: poData } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => api.getPurchaseOrders(),
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateShipment(editing!.id, {
        status: editStatus,
        trackingNumber: editTracking,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("Shipment updated", {
        description: `Tracking ${editTracking} updated to ${editStatus.replace("_", " ")}.`,
      });
      setEditing(null);
      setEditError(null);
    },
    onError: (e: Error) => setEditError(e.message),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createShipment({
        purchaseOrderId: createForm.purchaseOrderId,
        trackingNumber: createForm.trackingNumber,
        origin: createForm.origin,
        destination: createForm.destination,
        estimatedArrival: createForm.estimatedArrival || null,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("Shipment created", {
        description: `Tracking ${res.shipment.trackingNumber} is now being monitored.`,
      });
      setCreating(false);
      setCreateForm(emptyCreate);
      setCreateError(null);
    },
    onError: (e: Error) => setCreateError(e.message),
  });

  function openEdit(s: Shipment) {
    setEditing(s);
    setEditStatus(s.status);
    setEditTracking(s.trackingNumber);
    setEditError(null);
  }

  function openCreate() {
    setCreateForm(emptyCreate);
    setCreateError(null);
    setCreating(true);
  }

  const shipments = data?.shipments ?? [];
  const purchaseOrders = poData?.purchaseOrders ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipment Monitoring"
        description="Track inbound cargo from origin port to distribution hubs"
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Shipment
            </Button>
          ) : undefined
        }
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 7 : 6} rows={5} />}
      {isError && (
        <ErrorState
          message="Failed to load shipments"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && shipments.length === 0 && (
        <EmptyState
          variant="shipments"
          description={
            isAdmin
              ? "No shipments yet. You can create one manually or approve a purchase order to auto-generate a shipment."
              : undefined
          }
          onAction={isAdmin ? openCreate : undefined}
          ctaLabel={isAdmin ? "New Shipment" : undefined}
        />
      )}

      {shipments.length > 0 && (
        <>
          {/* Mobile card view */}
          <div className="grid gap-3 sm:hidden">
            {shipments.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{s.trackingNumber}</p>
                    <p className="font-medium truncate">{s.purchaseOrder?.supplier.name}</p>
                  </div>
                  <Badge variant={statusVariant(s.status)} className="shrink-0">{s.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>PO: <span className="font-medium text-foreground">{s.purchaseOrder?.poNumber}</span></span>
                  <span className="truncate">{s.origin} → {s.destination}</span>
                  <span>ETA: <span className="font-medium text-foreground">
                    {s.estimatedArrival ? new Date(s.estimatedArrival).toLocaleDateString() : "—"}
                  </span></span>
                </div>
                {isAdmin && (
                  <div className="pt-1 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      aria-label={`Update shipment ${s.trackingNumber}`}
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Update Shipment
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>PO</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.trackingNumber}</TableCell>
                    <TableCell>{s.purchaseOrder?.poNumber}</TableCell>
                    <TableCell>{s.purchaseOrder?.supplier.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">
                      {s.origin} → {s.destination}
                    </TableCell>
                    <TableCell><Badge variant={statusVariant(s.status)}>{s.status}</Badge></TableCell>
                    <TableCell>
                      {s.estimatedArrival
                        ? new Date(s.estimatedArrival).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Update shipment ${s.trackingNumber}`}
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Update Shipment dialog */}
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Update Shipment"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
        >
          <InputWrapper>
            <InputLabel htmlFor="ship-tracking">
              Tracking Number <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="ship-tracking"
              required
              value={editTracking}
              onChange={(e) => setEditTracking(e.target.value)}
            />
          </InputWrapper>
          <div className="space-y-2">
            <InputLabel htmlFor="ship-status">Status</InputLabel>
            <Select
              value={editStatus}
              onValueChange={(v) => setEditStatus(v as ShipmentStatus)}
            >
              <SelectTrigger id="ship-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="DELAYED">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {editError && <InputError role="alert">{editError}</InputError>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Create Shipment dialog */}
      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New Shipment"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <div className="space-y-2">
            <InputLabel htmlFor="create-po">
              Purchase Order <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Select
              required
              value={createForm.purchaseOrderId}
              onValueChange={(v) => setCreateForm({ ...createForm, purchaseOrderId: v })}
            >
              <SelectTrigger id="create-po">
                <SelectValue placeholder="Select purchase order" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.poNumber} — {po.supplier?.name ?? ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <InputWrapper>
            <InputLabel htmlFor="create-tracking">
              Tracking Number <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="create-tracking"
              required
              value={createForm.trackingNumber}
              onChange={(e) => setCreateForm({ ...createForm, trackingNumber: e.target.value })}
              placeholder="e.g. SHP-2026-0042"
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="create-origin">
              Origin <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="create-origin"
              required
              value={createForm.origin}
              onChange={(e) => setCreateForm({ ...createForm, origin: e.target.value })}
              placeholder="e.g. Kuala Lumpur, Malaysia"
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="create-destination">
              Destination <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="create-destination"
              required
              value={createForm.destination}
              onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
              placeholder="e.g. Ho Chi Minh City, Vietnam"
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="create-eta">
              Estimated Arrival{" "}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </InputLabel>
            <Input
              id="create-eta"
              type="date"
              value={createForm.estimatedArrival}
              onChange={(e) => setCreateForm({ ...createForm, estimatedArrival: e.target.value })}
            />
          </InputWrapper>
          {createError && <InputError role="alert">{createError}</InputError>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Shipment"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

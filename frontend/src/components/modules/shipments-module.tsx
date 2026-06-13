"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { api, Shipment, ShipmentStatus } from "@/lib/api";
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
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/state-blocks";

export function ShipmentsModule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [status, setStatus] = useState<ShipmentStatus>("PENDING");
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.getShipments(),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateShipment(editing!.id, {
        status,
        trackingNumber: tracking,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("Shipment updated", {
        description: `Tracking ${tracking} has been updated to ${status.replace("_", " ")}.`,
      });
      setEditing(null);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  function openEdit(s: Shipment) {
    setEditing(s);
    setStatus(s.status);
    setTracking(s.trackingNumber);
    setError(null);
  }

  const shipments = data?.shipments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipment Monitoring"
        description="Track inbound cargo from origin port to distribution hubs"
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 7 : 6} rows={5} />}
      {isError && (
        <ErrorState
          message="Failed to load shipments"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && shipments.length === 0 && (
        <EmptyState variant="shipments" />
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
          <div className="space-y-2">
            <Label htmlFor="ship-tracking">
              Tracking Number <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="ship-tracking"
              required
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ship-status">Status</Label>
            <Select
              id="ship-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
            >
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="DELAYED">Delayed</option>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

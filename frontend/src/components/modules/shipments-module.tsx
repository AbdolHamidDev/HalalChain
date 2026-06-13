"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
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
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-blocks";

export function ShipmentsModule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [status, setStatus] = useState<ShipmentStatus>("PENDING");
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipment Monitoring"
        description="Track inbound cargo from origin port to Vietnam distribution hubs"
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load shipments" />}
      {!isLoading && !isError && (data?.shipments ?? []).length === 0 && <EmptyState message="No shipments yet" />}

      {(data?.shipments ?? []).length > 0 && (
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
            {(data?.shipments ?? []).map((s) => (
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
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Update Shipment">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}>
          <div className="space-y-2">
            <Label>Tracking Number</Label>
            <Input required value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}>
              <option value="PENDING">PENDING</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="DELAYED">DELAYED</option>
            </Select>
          </div>
          {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

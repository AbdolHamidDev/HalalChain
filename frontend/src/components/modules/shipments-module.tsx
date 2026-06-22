"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, Shipment, ShipmentStatus } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslation } from "@/i18n/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
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
import { Pagination } from "@/components/ui/pagination";

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const [editing, setEditing] = useState<Shipment | null>(null);
  const [editStatus, setEditStatus] = useState<ShipmentStatus>("PENDING");
  const [editTracking, setEditTracking] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  const [createError, setCreateError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["shipments", "paginated", page, pageSize],
    queryFn: () => api.getShipments({ page, limit: pageSize }),
  });

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
      toast.success(t("shipments.shipmentUpdated"), {
        description: t("shipments.shipmentUpdatedDesc", {
          values: { trackingNumber: editTracking, status: t(`shipments.statusOptions.${editStatus.toLowerCase()}`) },
        }),
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
      toast.success(t("shipments.shipmentCreated"), {
        description: t("shipments.shipmentCreatedDesc", { values: { trackingNumber: res.shipment.trackingNumber } }),
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
        title={t("shipments.pageTitle")}
        description={t("shipments.pageDescription")}
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> {t("shipments.newShipment")}
            </Button>
          ) : undefined
        }
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 7 : 6} rows={5} />}
      {isError && (
        <ErrorState
          message={t("shipments.errors.loadFailed")}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && shipments.length === 0 && (
        <EmptyState
          variant="shipments"
          description={
            isAdmin
              ? t("shipments.createDescription")
              : undefined
          }
          onAction={isAdmin ? openCreate : undefined}
          ctaLabel={isAdmin ? t("shipments.newShipmentCta") : undefined}
        />
      )}

      {shipments.length > 0 && (
        <>
          <div className="grid gap-3 sm:hidden">
            {shipments.map((s) => (
              <div key={s.id} className="rounded-xl bg-card p-4 space-y-3">
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
                  <span>{t("shipments.eta")}: <span className="font-medium text-foreground">
                    {s.estimatedArrival ? new Date(s.estimatedArrival).toLocaleDateString() : "—"}
                  </span></span>
                </div>
                {isAdmin && (
                  <div className="pt-1 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      aria-label={t("shipments.common.editItem", { values: { trackingNumber: s.trackingNumber } })}
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> {t("shipments.updateShipment")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("shipments.table.trackingNumber")}</TableHead>
                  <TableHead>{t("shipments.table.poNumber")}</TableHead>
                  <TableHead>{t("shipments.table.supplier")}</TableHead>
                  <TableHead>{t("shipments.route")}</TableHead>
                  <TableHead>{t("shipments.table.status")}</TableHead>
                  <TableHead>{t("shipments.eta")}</TableHead>
                  {isAdmin && <TableHead className="text-right">{t("shipments.table.actions")}</TableHead>}
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
                          aria-label={t("shipments.common.editItem", { values: { trackingNumber: s.trackingNumber } })}
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

      {/* ── Pagination ─────────────────────────────────────────────── */}
      {!isLoading && !isError && data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalItems={data.total}
          pageSize={pageSize}
          onPageChange={(newPage) => {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t("shipments.updateShipment")}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
            <Button type="submit" form="shipment-edit-form" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("common.saving") : t("shipments.saveChanges")}
            </Button>
          </>
        }
      >
        <form
          id="shipment-edit-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
        >
          <InputWrapper>
            <InputLabel htmlFor="ship-tracking">
              {t("shipments.trackingNumber")} <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="ship-tracking"
              required
              value={editTracking}
              onChange={(e) => setEditTracking(e.target.value)}
            />
          </InputWrapper>
          <div className="space-y-2">
            <InputLabel htmlFor="ship-status">{t("shipments.table.status")}</InputLabel>
            <Select
              value={editStatus}
              onValueChange={(v) => setEditStatus(v as ShipmentStatus)}
            >
              <SelectTrigger id="ship-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">{t("shipments.statusOptions.pending")}</SelectItem>
                <SelectItem value="IN_TRANSIT">{t("shipments.statusOptions.inTransit")}</SelectItem>
                <SelectItem value="DELIVERED">{t("shipments.statusOptions.delivered")}</SelectItem>
                <SelectItem value="DELAYED">{t("shipments.statusOptions.delayed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {editError && <InputError role="alert">{editError}</InputError>}
        </form>
      </Sheet>

      <Sheet
        open={creating}
        onClose={() => setCreating(false)}
        title={t("shipments.newShipment")}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="shipment-create-form" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("shipments.creating") : t("shipments.createShipment")}
            </Button>
          </>
        }
      >
        <form
          id="shipment-create-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <div className="space-y-2">
            <InputLabel htmlFor="create-po">
              {t("shipments.purchaseOrder")} <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Select
              required
              value={createForm.purchaseOrderId}
              onValueChange={(v) => setCreateForm({ ...createForm, purchaseOrderId: v })}
            >
              <SelectTrigger id="create-po">
                <SelectValue placeholder={t("shipments.selectPO")} />
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
              {t("shipments.trackingNumber")} <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="create-tracking"
              required
              value={createForm.trackingNumber}
              onChange={(e) => setCreateForm({ ...createForm, trackingNumber: e.target.value })}
              placeholder={t("shipments.trackingPlaceholder")}
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="create-origin">
              {t("shipments.origin")} <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="create-origin"
              required
              value={createForm.origin}
              onChange={(e) => setCreateForm({ ...createForm, origin: e.target.value })}
              placeholder={t("shipments.originPlaceholder")}
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="create-destination">
              {t("shipments.destination")} <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="create-destination"
              required
              value={createForm.destination}
              onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
              placeholder={t("shipments.destinationPlaceholder")}
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="create-eta">
              {t("shipments.estimatedArrival")}{" "}
              <span className="text-xs font-normal text-muted-foreground">({t("common.optional")})</span>
            </InputLabel>
            <Input
              id="create-eta"
              type="date"
              value={createForm.estimatedArrival}
              onChange={(e) => setCreateForm({ ...createForm, estimatedArrival: e.target.value })}
            />
          </InputWrapper>
          {createError && <InputError role="alert">{createError}</InputError>}
        </form>
      </Sheet>
    </div>
  );
}
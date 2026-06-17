"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
import { toast } from "sonner";
import { api, Warehouse } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslation } from "@/i18n/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { dialog } from "@/lib/dialog";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/state-blocks";
import { Pagination } from "@/components/ui/pagination";

type FormData = { name: string; location: string };
const empty: FormData = { name: "", location: "" };

export function WarehousesModule() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [formError, setFormError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["warehouses", "paginated", page, pageSize],
    queryFn: () => api.getWarehouses({ page, limit: pageSize }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? api.updateWarehouse(editing.id, form)
        : api.createWarehouse(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      if (editing) {
        toast.success(t("warehouses.warehouseUpdated"), {
          description: t("warehouses.warehouseEdited", { values: { name: form.name } }),
        });
      } else {
        toast.success(t("warehouses.warehouseCreated"), {
          description: t("warehouses.warehouseAdded", { values: { name: form.name } }),
        });
      }
      setOpen(false);
      setEditing(null);
      setForm(empty);
      setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteWarehouse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success(t("warehouses.warehouseDeleted"));
    },
    onError: (e: Error) => {
      toast.error(t("warehouses.warehouseDeleteFailed"), { description: e.message });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(w: Warehouse) {
    setEditing(w);
    setForm({ name: w.name, location: w.location });
    setFormError(null);
    setOpen(true);
  }

  const warehouses = data?.warehouses ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("warehouses.pageTitle")}
        description={t("warehouses.pageDescription")}
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> {t("warehouses.addWarehouse")}
            </Button>
          ) : undefined
        }
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 4 : 3} rows={4} />}
      {isError && (
        <ErrorState message={t("warehouses.errors.loadFailed")} onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && warehouses.length === 0 && (
        <EmptyState variant="warehouses" onAction={isAdmin ? openCreate : undefined} />
      )}

      {warehouses.length > 0 && (
        <>
          <div className="grid gap-3 sm:hidden">
            {warehouses.map((w) => (
              <div key={w.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <WarehouseIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{w.location}</p>
                    </div>
                  </div>
                  {w._count !== undefined && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {w._count.inventory} {t("warehouses.table.items")}
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 pt-1 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(w)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={async () => {
                        const ok = await dialog.confirm({
                          type: "destructive",
                          title: t("warehouses.deleteConfirm"),
                          description: t("warehouses.deleteDescription", { values: { name: w.name } }),
                          confirmLabel: t("warehouses.deleteWarehouse"),
                        });
                        if (ok) deleteMutation.mutate(w.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> {t("common.delete")}
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
                  <TableHead>{t("warehouses.table.name")}</TableHead>
                  <TableHead>{t("warehouses.table.location")}</TableHead>
                  <TableHead>{t("warehouses.table.items")}</TableHead>
                  {isAdmin && <TableHead className="text-right">{t("warehouses.table.actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{w.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{w.location}</TableCell>
                    <TableCell>{w._count?.inventory ?? "—"}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={t("warehouses.common.editItem", { values: { name: w.name } })}
                            onClick={() => openEdit(w)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            aria-label={t("warehouses.common.deleteItem", { values: { name: w.name } })}
                            onClick={async () => {
                              const ok = await dialog.confirm({
                                type: "destructive",
                                title: t("warehouses.deleteConfirm"),
                                description: t("warehouses.deleteDescription", { values: { name: w.name } }),
                                confirmLabel: t("warehouses.deleteWarehouse"),
                              });
                              if (ok) deleteMutation.mutate(w.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t("warehouses.editWarehouse") : t("warehouses.newWarehouse")}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <InputWrapper>
            <InputLabel htmlFor="wh-name">
              {t("warehouses.form.name")} <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="wh-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("warehouses.form.namePlaceholder")}
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="wh-location">
              {t("warehouses.form.location")} <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="wh-location"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder={t("warehouses.form.locationPlaceholder")}
            />
          </InputWrapper>
          {formError && <InputError role="alert">{formError}</InputError>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t("common.saving") : editing ? t("warehouses.saveChanges") : t("warehouses.addWarehouse")}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
import { toast } from "sonner";
import { api, Warehouse } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { dialog } from "@/lib/dialog";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/state-blocks";

type FormData = { name: string; location: string };
const empty: FormData = { name: "", location: "" };

export function WarehousesModule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => api.getWarehouses({ limit: 100 }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? api.updateWarehouse(editing.id, form)
        : api.createWarehouse(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success(editing ? "Warehouse updated" : "Warehouse created", {
        description: editing
          ? `${form.name} has been updated.`
          : `${form.name} has been added.`,
      });
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
      toast.success("Warehouse deleted");
    },
    onError: (e: Error) => {
      toast.error("Cannot delete warehouse", { description: e.message });
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
        title="Warehouse Management"
        description="Manage storage locations for halal inventory"
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Warehouse
            </Button>
          ) : undefined
        }
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 4 : 3} rows={4} />}
      {isError && (
        <ErrorState message="Failed to load warehouses" onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && warehouses.length === 0 && (
        <EmptyState variant="warehouses" onAction={isAdmin ? openCreate : undefined} />
      )}

      {warehouses.length > 0 && (
        <>
          {/* Mobile card view */}
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
                      {w._count.inventory} SKUs
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 pt-1 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(w)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={async () => {
                        const ok = await dialog.confirm({
                          type: "destructive",
                          title: "Delete warehouse?",
                          description: `"${w.name}" will be permanently removed. This will fail if the warehouse still has active inventory.`,
                          confirmLabel: "Delete Warehouse",
                        });
                        if (ok) deleteMutation.mutate(w.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
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
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Active SKUs</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
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
                            aria-label={`Edit ${w.name}`}
                            onClick={() => openEdit(w)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            aria-label={`Delete ${w.name}`}
                            onClick={async () => {
                              const ok = await dialog.confirm({
                                type: "destructive",
                                title: "Delete warehouse?",
                                description: `"${w.name}" will be permanently removed. This will fail if the warehouse still has active inventory.`,
                                confirmLabel: "Delete Warehouse",
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

      {/* Create / Edit dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Warehouse" : "New Warehouse"}
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
              Name <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="wh-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. KL Central Hub"
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="wh-location">
              Location <span className="text-destructive" aria-hidden="true">*</span>
            </InputLabel>
            <Input
              id="wh-location"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Kuala Lumpur, Malaysia"
            />
          </InputWrapper>
          {formError && <InputError role="alert">{formError}</InputError>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving…"
                : editing
                  ? "Save Changes"
                  : "Add Warehouse"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

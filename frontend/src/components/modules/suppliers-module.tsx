"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, Supplier, SupplierStatus } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { dialog } from "@/lib/dialog";
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

type FormData = {
  name: string;
  country: string;
  email: string;
  phone: string;
  status: SupplierStatus;
};

const empty: FormData = {
  name: "",
  country: "",
  email: "",
  phone: "",
  status: "ACTIVE",
};

export function SuppliersModule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.getSuppliers(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, email: form.email || undefined };
      if (editing) return api.updateSupplier(editing.id, payload);
      return api.createSupplier(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false);
      setEditing(null);
      setForm(empty);
      setError(null);
      toast.success(editing ? "Supplier updated" : "Supplier created", {
        description: editing
          ? `${form.name} has been updated.`
          : `${form.name} has been added to your supplier network.`,
      });
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSupplier(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted");
    },
    onError: (e: Error) => {
      toast.error("Failed to delete supplier", { description: e.message });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError(null);
    setOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      country: s.country,
      email: s.email ?? "",
      phone: s.phone ?? "",
      status: s.status,
    });
    setError(null);
    setOpen(true);
  }

  const suppliers = data?.suppliers ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Management"
        description="Manage halal-certified suppliers across Malaysia, Indonesia, Thailand and SEA"
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Supplier
            </Button>
          ) : undefined
        }
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 7 : 6} rows={5} />}
      {isError && (
        <ErrorState
          message="Failed to load suppliers"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && suppliers.length === 0 && (
        <EmptyState
          variant="suppliers"
          onAction={isAdmin ? openCreate : undefined}
        />
      )}

      {suppliers.length > 0 && (
        <>
          {/* Mobile card view */}
          <div className="grid gap-3 sm:hidden">
            {suppliers.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.country}</p>
                  </div>
                  <Badge variant={statusVariant(s.status)} className="shrink-0">{s.status}</Badge>
                </div>
                {(s.email || s.phone) && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {s.email && <p>{s.email}</p>}
                    {s.phone && <p>{s.phone}</p>}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span><span className="font-medium text-foreground">{s._count?.products ?? 0}</span> products</span>
                  <span><span className="font-medium text-foreground">{s._count?.halalCertificates ?? 0}</span> certs</span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 pt-1 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={async () => {
                        const ok = await dialog.confirm({
                          type: "destructive",
                          title: "Delete supplier?",
                          description: `This will permanently remove "${s.name}" and cannot be undone. Products and certificates linked to this supplier may be affected.`,
                          confirmLabel: "Delete Supplier",
                        });
                        if (ok) deleteMutation.mutate(s.id);
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
                  <TableHead>Country</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Certs</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.country}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {s.email && <p>{s.email}</p>}
                        {s.phone && <p className="text-muted-foreground">{s.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                    </TableCell>
                    <TableCell>{s._count?.products ?? 0}</TableCell>
                    <TableCell>{s._count?.halalCertificates ?? 0}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Edit ${s.name}`}
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            aria-label={`Delete ${s.name}`}
                            onClick={async () => {
                              const ok = await dialog.confirm({
                                type: "destructive",
                                title: "Delete supplier?",
                                description: `This will permanently remove "${s.name}" and cannot be undone. Products and certificates linked to this supplier may be affected.`,
                                confirmLabel: "Delete Supplier",
                              });
                              if (ok) deleteMutation.mutate(s.id);
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
        title={editing ? "Edit Supplier" : "New Supplier"}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <InputWrapper>
            <InputLabel htmlFor="supplier-name">Name <span className="text-destructive" aria-hidden="true">*</span></InputLabel>
            <Input
              id="supplier-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Al-Barakah Food Co."
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="supplier-country">Country <span className="text-destructive" aria-hidden="true">*</span></InputLabel>
            <Input
              id="supplier-country"
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="e.g. Malaysia"
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="supplier-email">Email <span className="text-xs font-normal text-muted-foreground">(optional)</span></InputLabel>
            <Input
              id="supplier-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@supplier.com"
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="supplier-phone">Phone <span className="text-xs font-normal text-muted-foreground">(optional)</span></InputLabel>
            <Input
              id="supplier-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+60 3-XXXX XXXX"
            />
          </InputWrapper>
          <div className="space-y-2">
            <InputLabel htmlFor="supplier-status">Status</InputLabel>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as SupplierStatus })}
            >
              <SelectTrigger id="supplier-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <InputError role="alert">{error}</InputError>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Add Supplier"}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
}

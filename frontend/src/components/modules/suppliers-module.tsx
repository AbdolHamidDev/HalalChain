"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, Supplier, SupplierStatus } from "@/lib/api";
import { countryFlag } from "@/lib/countryFlag";
import { CountryPicker } from "@/components/ui/country-picker";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslation } from "@/i18n/hooks";
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
import { Pagination } from "@/components/ui/pagination";

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["suppliers", "paginated", page, pageSize],
    queryFn: () => api.getSuppliers({ page, limit: pageSize }),
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
      if (editing) {
        toast.success(t("suppliers.supplierUpdated"), {
          description: t("suppliers.supplierEdited", { values: { name: form.name } }),
        });
      } else {
        toast.success(t("suppliers.supplierCreated"), {
          description: t("suppliers.supplierAdded", { values: { name: form.name } }),
        });
      }
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSupplier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(t("suppliers.supplierDeleted"));
    },
    onError: (e: Error) => {
      toast.error(t("suppliers.supplierDeleteFailed"), { description: e.message });
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
        title={t("suppliers.pageTitle")}
        description={t("suppliers.pageDescription")}
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> {t("suppliers.addSupplier")}
            </Button>
          ) : undefined
        }
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 7 : 6} rows={5} />}
      {isError && (
        <ErrorState
          message={t("suppliers.errors.loadFailed")}
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
          <div className="grid gap-3 sm:hidden">
            {suppliers.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span aria-hidden="true">{countryFlag(s.country)} </span>{s.country}
                    </p>
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
                  <span><span className="font-medium text-foreground">{s._count?.products ?? 0}</span> {t("suppliers.table.products").toLowerCase()}</span>
                  <span><span className="font-medium text-foreground">{s._count?.halalCertificates ?? 0}</span> {t("suppliers.table.certificates").toLowerCase()}</span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 pt-1 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={async () => {
                        const ok = await dialog.confirm({
                          type: "destructive",
                          title: t("suppliers.deleteConfirm"),
                          description: t("suppliers.deleteDescription", { values: { name: s.name } }),
                          confirmLabel: t("suppliers.deleteSupplier"),
                        });
                        if (ok) deleteMutation.mutate(s.id);
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
                  <TableHead>{t("suppliers.table.name")}</TableHead>
                  <TableHead>{t("suppliers.table.country")}</TableHead>
                  <TableHead>{t("suppliers.table.contact")}</TableHead>
                  <TableHead>{t("suppliers.table.status")}</TableHead>
                  <TableHead>{t("suppliers.table.products")}</TableHead>
                  <TableHead>{t("suppliers.table.certificates")}</TableHead>
                  {isAdmin && <TableHead className="text-right">{t("suppliers.table.actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <span aria-hidden="true">{countryFlag(s.country)} </span>{s.country}
                    </TableCell>
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
                            aria-label={t("suppliers.common.editItem", { values: { name: s.name } })}
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            aria-label={t("suppliers.common.deleteItem", { values: { name: s.name } })}
                            onClick={async () => {
                              const ok = await dialog.confirm({
                                type: "destructive",
                                title: t("suppliers.deleteConfirm"),
                                description: t("suppliers.deleteDescription", { values: { name: s.name } }),
                                confirmLabel: t("suppliers.deleteSupplier"),
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
        title={editing ? t("suppliers.editSupplier") : t("suppliers.newSupplier")}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <InputWrapper>
            <InputLabel htmlFor="supplier-name">{t("suppliers.form.name")} <span className="text-destructive" aria-hidden="true">*</span></InputLabel>
            <Input
              id="supplier-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("suppliers.form.namePlaceholder")}
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="supplier-country">{t("suppliers.form.country")} <span className="text-destructive" aria-hidden="true">*</span></InputLabel>
            <CountryPicker
              id="supplier-country"
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v })}
              placeholder={t("suppliers.form.countryPlaceholder")}
              required
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="supplier-email">{t("suppliers.form.email")} <span className="text-xs font-normal text-muted-foreground">({t("suppliers.form.optional")})</span></InputLabel>
            <Input
              id="supplier-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t("suppliers.form.emailPlaceholder")}
            />
          </InputWrapper>
          <InputWrapper>
            <InputLabel htmlFor="supplier-phone">{t("suppliers.form.phone")} <span className="text-xs font-normal text-muted-foreground">({t("suppliers.form.optional")})</span></InputLabel>
            <Input
              id="supplier-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder={t("suppliers.form.phonePlaceholder")}
            />
          </InputWrapper>
          <div className="space-y-2">
            <InputLabel htmlFor="supplier-status">{t("suppliers.form.status")}</InputLabel>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as SupplierStatus })}
            >
              <SelectTrigger id="supplier-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("suppliers.form.statusActive")}</SelectItem>
                <SelectItem value="INACTIVE">{t("suppliers.form.statusInactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <InputError role="alert">{error}</InputError>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t("common.saving") : editing ? t("suppliers.saveChanges") : t("suppliers.addSupplier")}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
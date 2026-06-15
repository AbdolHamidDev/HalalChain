"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, HalalCertificate, CertificateStatus } from "@/lib/api";
import { CertificateUploadZone } from "@/components/settings/certificate-upload-zone";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslation } from "@/i18n/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { dialog } from "@/lib/dialog";
import { Input, InputWrapper, InputLabel, InputError, InputHint } from "@/components/ui/input";
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

function certStatusFromExpiry(expiry: string) {
  const days = (new Date(expiry).getTime() - Date.now()) / 86400000;
  if (days < 0) return { labelKey: "certificates.status.expired", variant: "danger" as const };
  if (days <= 90) return { labelKey: "certificates.status.expiringSoon", variant: "warning" as const };
  return { labelKey: "certificates.status.valid", variant: "success" as const };
}

function certStatusProps(c: HalalCertificate) {
  if (c.status) {
    const map: Record<CertificateStatus, { labelKey: string; variant: "success" | "warning" | "danger" }> = {
      VALID: { labelKey: "certificates.status.valid", variant: "success" },
      EXPIRING_SOON: { labelKey: "certificates.status.expiringSoon", variant: "warning" },
      EXPIRED: { labelKey: "certificates.status.expired", variant: "danger" },
    };
    return map[c.status];
  }
  return certStatusFromExpiry(c.expiryDate);
}

type FormData = {
  supplierId: string;
  certificateNumber: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
};

const empty: FormData = {
  supplierId: "",
  certificateNumber: "",
  issuedBy: "JAKIM",
  issueDate: "",
  expiryDate: "",
  fileUrl: "",
};

export function CertificatesModule() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<HalalCertificate | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["certificates"],
    queryFn: () => api.getCertificates(),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.getSuppliers(),
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, fileUrl: form.fileUrl || undefined, supplierId: editing ? editing.supplierId : form.supplierId };
      if (editing) { const { supplierId: _, ...update } = payload; return api.updateCertificate(editing.id, update); }
      return api.createCertificate(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      setSheetOpen(false);
      setEditing(null);
      setForm(empty);
      setFormError(null);
      if (editing) {
        toast.success(t("certificates.certificateUpdated"), {
          description: `${t("certificates.form.certificateNumber")} ${form.certificateNumber} ${t("common.updated")}`,
        });
      } else {
        toast.success(t("certificates.certificateCreated"), {
          description: `${t("certificates.form.certificateNumber")} ${form.certificateNumber} ${t("common.added")}`,
        });
      }
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCertificate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      toast.success(t("certificates.certificateDeleted"));
    },
    onError: (e: Error) => {
      toast.error(t("certificates.certificateDeleteFailed"), { description: e.message });
    },
  });

  function openCreate() { setEditing(null); setForm(empty); setFormError(null); setSheetOpen(true); }
  function openEdit(c: HalalCertificate) {
    setEditing(c);
    setForm({ supplierId: c.supplierId, certificateNumber: c.certificateNumber, issuedBy: c.issuedBy, issueDate: c.issueDate.slice(0, 10), expiryDate: c.expiryDate.slice(0, 10), fileUrl: c.fileUrl ?? "" });
    setFormError(null);
    setSheetOpen(true);
  }

  const certificates = data?.certificates ?? [];

  const formContent = (
    <form id="certificate-form" className="space-y-5" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
      {!editing && (
        <div className="space-y-2">
          <InputLabel htmlFor="cert-supplier">{t("certificates.form.supplier")} <span className="text-destructive" aria-hidden="true">*</span></InputLabel>
          <Select required value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
            <SelectTrigger id="cert-supplier"><SelectValue placeholder={t("certificates.form.supplier")} /></SelectTrigger>
            <SelectContent>{(suppliersData?.suppliers ?? []).map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      )}
      <InputWrapper>
        <InputLabel htmlFor="cert-number">{t("certificates.form.certificateNumber")} <span className="text-destructive" aria-hidden="true">*</span></InputLabel>
        <Input id="cert-number" required value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} placeholder={t("certificates.form.certificateNumberPlaceholder")} />
      </InputWrapper>
      <InputWrapper>
        <InputLabel htmlFor="cert-issuer">{t("certificates.form.issuedBy")} <span className="text-destructive" aria-hidden="true">*</span></InputLabel>
        <Input id="cert-issuer" required list="issuer-suggestions" value={form.issuedBy} onChange={(e) => setForm({ ...form, issuedBy: e.target.value })} placeholder={t("certificates.form.issuedByPlaceholder")} />
        <datalist id="issuer-suggestions">
          <option value="JAKIM" /><option value="MUI" /><option value="CICOT" /><option value="MUIS" />
          <option value="IFANCA" /><option value="HFA" /><option value="ESMA" /><option value="HFCE" /><option value="ISNA" /><option value="HIPL"/>
        </datalist>
      </InputWrapper>
      <div className="grid grid-cols-2 gap-4">
        <InputWrapper>
          <InputLabel htmlFor="cert-issue-date">{t("certificates.form.issueDate")} <span className="text-destructive" aria-hidden="true">*</span></InputLabel>
          <Input id="cert-issue-date" type="date" required value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
        </InputWrapper>
        <InputWrapper>
          <InputLabel htmlFor="cert-expiry-date">{t("certificates.form.expiryDate")} <span className="text-destructive" aria-hidden="true">*</span></InputLabel>
          <Input id="cert-expiry-date" type="date" required value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        </InputWrapper>
      </div>
      {formError && <InputError role="alert">{formError}</InputError>}
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("certificates.pageTitle")}
        description={t("certificates.pageDescription")}
        action={isAdmin ? (<Button onClick={openCreate}><Plus className="h-4 w-4" /> {t("certificates.addCertificate")}</Button>) : undefined}
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 7 : 6} rows={5} />}
      {isError && <ErrorState message={t("certificates.errors.loadFailed")} onRetry={() => refetch()} />}
      {!isLoading && !isError && certificates.length === 0 && (<EmptyState variant="certificates" onAction={isAdmin ? openCreate : undefined} />)}

      {certificates.length > 0 && (
        <>
          <div className="grid gap-3 sm:hidden">
            {certificates.map((c) => {
              const st = certStatusProps(c);
              return (
                <div key={c.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{c.certificateNumber}</p>
                      <p className="font-medium truncate">{c.supplier?.name}</p>
                    </div>
                    <Badge variant={st.variant} className="shrink-0">{t(st.labelKey as any)}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t("certificates.table.issuedBy")}: <span className="font-medium text-foreground">{c.issuedBy}</span></span>
                    <span>{t("certificates.table.issueDate")}: <span className="font-medium text-foreground">{new Date(c.issueDate).toLocaleDateString()}</span></span>
                    <span>{t("certificates.table.expiryDate")}: <span className="font-medium text-foreground">{new Date(c.expiryDate).toLocaleDateString()}</span></span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 pt-1 border-t">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> {t("common.edit")}
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1"
                        aria-label={t("certificates.common.deleteItem", { values: { certificateNumber: c.certificateNumber } })}
                        onClick={async () => {
                          const ok = await dialog.confirm({
                            type: "destructive",
                            title: t("certificates.deleteConfirm"),
                            description: t("certificates.deleteDescription", { values: { certificateNumber: c.certificateNumber, supplierName: c.supplier?.name ?? "" } }),
                            confirmLabel: t("certificates.deleteCertificate"),
                          });
                          if (ok) deleteMutation.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> {t("common.delete")}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("certificates.table.certificateNumber")}</TableHead>
                  <TableHead>{t("certificates.table.issuedBy")}</TableHead>
                  <TableHead>{t("certificates.table.supplier")}</TableHead>
                  <TableHead>{t("certificates.table.issueDate")}</TableHead>
                  <TableHead>{t("certificates.table.expiryDate")}</TableHead>
                  <TableHead>{t("certificates.table.status")}</TableHead>
                  {isAdmin && <TableHead className="text-right">{t("certificates.table.actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((c) => {
                  const st = certStatusProps(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.certificateNumber}</TableCell>
                      <TableCell>{c.issuedBy}</TableCell>
                      <TableCell>{c.supplier?.name}</TableCell>
                      <TableCell>{new Date(c.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(c.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant={st.variant}>{t(st.labelKey as any)}</Badge></TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline"
                              aria-label={t("certificates.common.editItem", { values: { certificateNumber: c.certificateNumber } })}
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="destructive"
                              aria-label={t("certificates.common.deleteItem", { values: { certificateNumber: c.certificateNumber } })}
                              onClick={async () => {
                                const ok = await dialog.confirm({
                                  type: "destructive",
                                  title: t("certificates.deleteConfirm"),
                                  description: t("certificates.deleteDescription", { values: { certificateNumber: c.certificateNumber, supplierName: c.supplier?.name ?? "" } }),
                                  confirmLabel: t("certificates.deleteCertificate"),
                                });
                                if (ok) deleteMutation.mutate(c.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? t("certificates.editCertificate") : t("certificates.newCertificate")}
        description={editing ? t("certificates.form.editCertificateDescription") : t("certificates.form.newCertificateDescription")}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" form="certificate-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t("common.saving") : editing ? t("certificates.saveChanges") : t("certificates.addCertificate")}
            </Button>
          </>
        }
      >
        {formContent}
        {editing && isAdmin && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">{t("certificates.uploadDocument")}</p>
            <CertificateUploadZone
              certificateId={editing.id}
              existingFileUrl={editing.fileUrl}
              onSuccess={(url) => {
                setEditing({ ...editing, fileUrl: url });
                setForm({ ...form, fileUrl: url });
                toast.success(t("common.upload"));
              }}
            />
          </div>
        )}
      </Sheet>
    </div>
  );
}
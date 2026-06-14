"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, HalalCertificate } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { dialog } from "@/lib/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function certStatus(expiry: string) {
  const days = (new Date(expiry).getTime() - Date.now()) / 86400000;
  if (days < 0) return { label: "Expired", variant: "danger" as const };
  if (days <= 90) return { label: "Expiring Soon", variant: "warning" as const };
  return { label: "Valid", variant: "success" as const };
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
      const payload = {
        ...form,
        fileUrl: form.fileUrl || undefined,
        supplierId: editing ? editing.supplierId : form.supplierId,
      };
      if (editing) {
        const { supplierId: _, ...update } = payload;
        return api.updateCertificate(editing.id, update);
      }
      return api.createCertificate(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      setSheetOpen(false);
      setEditing(null);
      setForm(empty);
      setFormError(null);
      toast.success(editing ? "Certificate updated" : "Certificate added", {
        description: editing
          ? `Certificate ${form.certificateNumber} has been updated.`
          : `Certificate ${form.certificateNumber} issued by ${form.issuedBy} has been added.`,
      });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCertificate(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Certificate deleted");
    },
    onError: (e: Error) => {
      toast.error("Failed to delete certificate", { description: e.message });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setFormError(null);
    setSheetOpen(true);
  }

  function openEdit(c: HalalCertificate) {
    setEditing(c);
    setForm({
      supplierId: c.supplierId,
      certificateNumber: c.certificateNumber,
      issuedBy: c.issuedBy,
      issueDate: c.issueDate.slice(0, 10),
      expiryDate: c.expiryDate.slice(0, 10),
      fileUrl: c.fileUrl ?? "",
    });
    setFormError(null);
    setSheetOpen(true);
  }

  const certificates = data?.certificates ?? [];

  const formContent = (
    <form
      id="certificate-form"
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
    >
      {!editing && (
        <div className="space-y-2">
          <Label htmlFor="cert-supplier">
            Supplier <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Select
            required
            value={form.supplierId}
            onValueChange={(v) => setForm({ ...form, supplierId: v })}
          >
            <SelectTrigger id="cert-supplier">
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {(suppliersData?.suppliers ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="cert-number">
          Certificate Number <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="cert-number"
          required
          value={form.certificateNumber}
          onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })}
          placeholder="e.g. JAKIM/2024/001234"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cert-issuer">
          Issuing Authority <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Select
          value={form.issuedBy}
          onValueChange={(v) => setForm({ ...form, issuedBy: v })}
        >
          <SelectTrigger id="cert-issuer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="JAKIM">JAKIM (Malaysia)</SelectItem>
            <SelectItem value="MUI">MUI (Indonesia)</SelectItem>
            <SelectItem value="CICOT">CICOT (Thailand)</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cert-issue-date">
            Issue Date <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="cert-issue-date"
            type="date"
            required
            value={form.issueDate}
            onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cert-expiry-date">
            Expiry Date <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="cert-expiry-date"
            type="date"
            required
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cert-file-url">
          Document URL{" "}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="cert-file-url"
          type="url"
          value={form.fileUrl}
          onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          Link to the official certificate document (PDF or image)
        </p>
      </div>
      {formError && (
        <p className="text-sm text-destructive" role="alert">{formError}</p>
      )}
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Halal Certificate Tracking"
        description="Manage JAKIM, MUI, CICOT certifications and expiry compliance"
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Certificate
            </Button>
          ) : undefined
        }
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 7 : 6} rows={5} />}
      {isError && (
        <ErrorState
          message="Failed to load certificates"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && certificates.length === 0 && (
        <EmptyState
          variant="certificates"
          onAction={isAdmin ? openCreate : undefined}
        />
      )}

      {certificates.length > 0 && (
        <>
          {/* Mobile card view */}
          <div className="grid gap-3 sm:hidden">
            {certificates.map((c) => {
              const st = certStatus(c.expiryDate);
              return (
                <div key={c.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{c.certificateNumber}</p>
                      <p className="font-medium truncate">{c.supplier?.name}</p>
                    </div>
                    <Badge variant={st.variant} className="shrink-0">{st.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Issued by: <span className="font-medium text-foreground">{c.issuedBy}</span></span>
                    <span>Issued: <span className="font-medium text-foreground">{new Date(c.issueDate).toLocaleDateString()}</span></span>
                    <span>Expires: <span className="font-medium text-foreground">{new Date(c.expiryDate).toLocaleDateString()}</span></span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 pt-1 border-t">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        aria-label={`Delete certificate ${c.certificateNumber}`}
                        onClick={async () => {
                          const ok = await dialog.confirm({
                            type: "destructive",
                            title: "Delete certificate?",
                            description: `This will permanently remove certificate "${c.certificateNumber}". Compliance records for this supplier may be affected.`,
                            confirmLabel: "Delete Certificate",
                          });
                          if (ok) deleteMutation.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((c) => {
                  const st = certStatus(c.expiryDate);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.certificateNumber}</TableCell>
                      <TableCell>{c.issuedBy}</TableCell>
                      <TableCell>{c.supplier?.name}</TableCell>
                      <TableCell>{new Date(c.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(c.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={`Edit certificate ${c.certificateNumber}`}
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              aria-label={`Delete certificate ${c.certificateNumber}`}
                              onClick={async () => {
                                const ok = await dialog.confirm({
                                  type: "destructive",
                                  title: "Delete certificate?",
                                  description: `This will permanently remove certificate "${c.certificateNumber}". Compliance records for this supplier may be affected.`,
                                  confirmLabel: "Delete Certificate",
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

      {/* Create / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? "Edit Certificate" : "New Halal Certificate"}
        description={
          editing
            ? "Update certificate details and expiry information."
            : "Add a new halal certification to track compliance."
        }
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="certificate-form"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Add Certificate"}
            </Button>
          </>
        }
      >
        {formContent}
      </Sheet>

    </div>
  );
}

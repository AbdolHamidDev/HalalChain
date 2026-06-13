"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, HalalCertificate } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-blocks";

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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HalalCertificate | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
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
      setOpen(false);
      setEditing(null);
      setForm(empty);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCertificate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError(null);
    setOpen(true);
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
    setError(null);
    setOpen(true);
  }

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

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load certificates" />}
      {!isLoading && !isError && (data?.certificates ?? []).length === 0 && <EmptyState message="No certificates yet" />}

      {(data?.certificates ?? []).length > 0 && (
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
            {(data?.certificates ?? []).map((c) => {
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
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          if (confirm("Delete certificate?")) deleteMutation.mutate(c.id);
                        }}>
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
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit Certificate" : "New Certificate"}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          {!editing && (
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">Select supplier</option>
                {(suppliersData?.suppliers ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Certificate Number</Label>
            <Input required value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Issued By</Label>
            <Select value={form.issuedBy} onChange={(e) => setForm({ ...form, issuedBy: e.target.value })}>
              <option value="JAKIM">JAKIM (Malaysia)</option>
              <option value="MUI">MUI (Indonesia)</option>
              <option value="CICOT">CICOT (Thailand)</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input type="date" required value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" required value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Document URL (optional)</Label>
            <Input type="url" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
          </div>
          {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>Save</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

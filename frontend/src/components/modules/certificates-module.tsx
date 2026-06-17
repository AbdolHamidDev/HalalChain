"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, Search, X, Filter, Undo2, ArrowUpDown, Download, Eye, ExternalLink,
} from "lucide-react";
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
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// ── Debounce hook ───────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Status helpers ──────────────────────────────────────────────────
function certStatusFromExpiry(expiry: string) {
  const days = (new Date(expiry).getTime() - Date.now()) / 86400000;
  if (days < 0) return { labelKey: "certificates.status.expired" as const, variant: "danger" as const };
  if (days <= 90) return { labelKey: "certificates.status.expiringSoon" as const, variant: "warning" as const };
  return { labelKey: "certificates.status.valid" as const, variant: "success" as const };
}

function certStatusProps(c: HalalCertificate) {
  if (c.status) {
    const map: Record<CertificateStatus, { labelKey: "certificates.status.valid" | "certificates.status.expiringSoon" | "certificates.status.expired"; variant: "success" | "warning" | "danger" }> = {
      VALID: { labelKey: "certificates.status.valid", variant: "success" },
      EXPIRING_SOON: { labelKey: "certificates.status.expiringSoon", variant: "warning" },
      EXPIRED: { labelKey: "certificates.status.expired", variant: "danger" },
    };
    return map[c.status];
  }
  return certStatusFromExpiry(c.expiryDate);
}

/** Returns a percentage (0-100) of how much time has been used */
function certTimeUsed(issueDate: string, expiryDate: string): number {
  const now = Date.now();
  const start = new Date(issueDate).getTime();
  const end = new Date(expiryDate).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return ((now - start) / (end - start)) * 100;
}

function certTimeColor(pct: number): string {
  if (pct >= 90) return "bg-destructive";
  if (pct >= 65) return "bg-warning";
  return "bg-success";
}

// ── Form types ──────────────────────────────────────────────────────
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

type CertFilterStatus = "all" | "valid" | "expiring" | "expired";
type SortField = "certificateNumber" | "issueDate" | "expiryDate" | "issuedBy" | "supplierName";
type SortDir = "asc" | "desc";

// ── Undo stack ──────────────────────────────────────────────────────
interface UndoEntry {
  id: string;
  cert: HalalCertificate;
}

// ══════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════

export function CertificatesModule() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<HalalCertificate | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [formError, setFormError] = useState<string | null>(null);
  /** When creating: after save, switch to upload mode using the new cert ID */
  const [uploadAfterCreate, setUploadAfterCreate] = useState(false);

  // View detail dialog
  const [viewingCert, setViewingCert] = useState<HalalCertificate | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  // Search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<CertFilterStatus>("all");
  const [issuerFilter, setIssuerFilter] = useState<string>("all");

  // Sort
  const [sortField, setSortField] = useState<SortField>("expiryDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Undo
  const undoStack = useRef<UndoEntry[]>([]);

  // ── Queries ─────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["certificates", "paginated", page, pageSize, debouncedSearch, statusFilter, issuerFilter, sortField, sortDir],
    queryFn: () => api.getCertificates({ page, limit: pageSize }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.getSuppliers(),
    enabled: isAdmin,
  });

  // ── Mutations ──────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, fileUrl: form.fileUrl || undefined, supplierId: editing ? editing.supplierId : form.supplierId };
      if (editing) { const { supplierId: _, ...update } = payload; return api.updateCertificate(editing.id, update); }
      return api.createCertificate(payload);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["certificates"] });

      if (editing) {
        // Edit: close sheet
        setSheetOpen(false);
        setEditing(null);
        setForm(empty);
        setFormError(null);
        toast.success(t("certificates.certificateUpdated"), {
          description: `${t("certificates.form.certificateNumber")} ${form.certificateNumber} ${t("common.updated")}`,
        });
      } else {
        // Create: keep sheet open, switch to upload mode
        const newCert = data?.certificate;
        if (newCert && isAdmin) {
          setEditing(newCert);
          setForm({
            ...form,
            fileUrl: newCert.fileUrl ?? "",
          });
          setUploadAfterCreate(true);
        } else {
          setSheetOpen(false);
          setForm(empty);
        }
        setFormError(null);
        toast.success(t("certificates.certificateCreated"), {
          description: `${t("certificates.form.certificateNumber")} ${form.certificateNumber} ${t("common.added")}`,
        });
      }
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCertificate(id),
    onSuccess: (_data, deletedId) => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      toast.success(t("certificates.certificateDeleted"), {
        description: t("certificates.deleteConfirm"),
        action: {
          label: t("common.undo"),
          onClick: () => handleUndo(deletedId),
        },
      });
    },
    onError: (e: Error) => {
      toast.error(t("certificates.certificateDeleteFailed"), { description: e.message });
    },
  });

  // ── Undo handler ───────────────────────────────────────────────
  const handleUndo = useCallback((deletedId: string) => {
    const entry = undoStack.current.find((u) => u.id === deletedId);
    if (!entry) {
      toast.error(t("common.undoUnavailable"));
      return;
    }
    // Re-create the certificate via API
    api.createCertificate({
      supplierId: entry.cert.supplierId,
      certificateNumber: entry.cert.certificateNumber,
      issuedBy: entry.cert.issuedBy,
      issueDate: entry.cert.issueDate,
      expiryDate: entry.cert.expiryDate,
      fileUrl: entry.cert.fileUrl ?? undefined,
    }).then(() => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      toast.success(t("certificates.certificateRestored"));
      undoStack.current = undoStack.current.filter((u) => u.id !== deletedId);
    }).catch((err: Error) => {
      toast.error(t("certificates.certificateDeleteFailed"), { description: err.message });
    });
  }, [qc, t]);

  // ── Handlers ───────────────────────────────────────────────────
  function openCreate() { setEditing(null); setForm(empty); setFormError(null); setSheetOpen(true); }
  function openEdit(c: HalalCertificate) {
    setEditing(c);
    setForm({ supplierId: c.supplierId, certificateNumber: c.certificateNumber, issuedBy: c.issuedBy, issueDate: c.issueDate.slice(0, 10), expiryDate: c.expiryDate.slice(0, 10), fileUrl: c.fileUrl ?? "" });
    setFormError(null);
    setSheetOpen(true);
  }

  function handleDelete(c: HalalCertificate) {
    dialog.confirm({
      type: "destructive",
      title: t("certificates.deleteConfirm"),
      description: t("certificates.deleteDescription", { values: { certificateNumber: c.certificateNumber, supplierName: c.supplier?.name ?? "" } }),
      confirmLabel: t("certificates.deleteCertificate"),
    }).then((ok) => {
      if (ok) {
        // Save to undo stack before deleting
        undoStack.current.push({ id: c.id, cert: c });
        // Limit undo stack to 5 entries
        if (undoStack.current.length > 5) undoStack.current.shift();
        deleteMutation.mutate(c.id);
      }
    });
  }

  // ── Data processing ────────────────────────────────────────────
  const certificates = useMemo(() => {
    let list = data?.certificates ?? [];

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.certificateNumber.toLowerCase().includes(q) ||
          c.issuedBy.toLowerCase().includes(q) ||
          c.supplier?.name.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((c) => {
        const props = certStatusProps(c);
        if (statusFilter === "valid") return props.labelKey === "certificates.status.valid";
        if (statusFilter === "expiring") return props.labelKey === "certificates.status.expiringSoon";
        if (statusFilter === "expired") return props.labelKey === "certificates.status.expired";
        return true;
      });
    }

    // Issuer filter
    if (issuerFilter !== "all") {
      list = list.filter((c) => c.issuedBy === issuerFilter);
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "certificateNumber":
          cmp = a.certificateNumber.localeCompare(b.certificateNumber);
          break;
        case "issueDate":
          cmp = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          break;
        case "expiryDate":
          cmp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          break;
        case "issuedBy":
          cmp = a.issuedBy.localeCompare(b.issuedBy);
          break;
        case "supplierName":
          cmp = (a.supplier?.name ?? "").localeCompare(b.supplier?.name ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [data, debouncedSearch, statusFilter, issuerFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const uniqueIssuers = useMemo(() => {
    const issuers = new Set((data?.certificates ?? []).map((c) => c.issuedBy));
    return Array.from(issuers).sort();
  }, [data]);

  const hasActiveFilters = searchQuery || statusFilter !== "all" || issuerFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setIssuerFilter("all");
  }

  // ── Form content ───────────────────────────────────────────────
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
      {/* Preview status badge */}
      {form.issueDate && form.expiryDate && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t("certificates.table.status")}:</span>
          <StatusPreview issueDate={form.issueDate} expiryDate={form.expiryDate} />
        </div>
      )}
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

      {/* ── Search & Filter bar ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("certificates.searchPlaceholder") ?? "Search certificates..."}
            className="h-10 pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CertFilterStatus)}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("certificates.filter.all") ?? "All"}</SelectItem>
              <SelectItem value="valid">{t("certificates.status.valid")}</SelectItem>
              <SelectItem value="expiring">{t("certificates.status.expiringSoon")}</SelectItem>
              <SelectItem value="expired">{t("certificates.status.expired")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Issuer filter */}
          {uniqueIssuers.length > 0 && (
            <Select value={issuerFilter} onValueChange={setIssuerFilter}>
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <SelectValue placeholder="Issuer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("certificates.filter.allIssuers") ?? "All Issuers"}</SelectItem>
                {uniqueIssuers.map((issuer) => (
                  <SelectItem key={issuer} value={issuer}>{issuer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Export button */}
          {certificates.length > 0 && (
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => exportCSV(certificates)}>
              <Download className="h-3.5 w-3.5 mr-1" />
              {t("common.export") ?? "Export"}
            </Button>
          )}
        </div>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("certificates.filter.active") ?? "Active filters:"}</span>
          <button onClick={clearFilters} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 hover:bg-accent transition-colors">
            <X className="h-3 w-3" />
            {t("certificates.filter.clear") ?? "Clear all"}
          </button>
          <span className="text-muted-foreground/60">
            {certificates.length} {t("certificates.filter.results") ?? "results"}
          </span>
        </div>
      )}

      {/* ── Loading / Error / Empty ───────────────────────────────── */}
      {isLoading && <TableSkeleton columns={isAdmin ? 8 : 7} rows={5} />}
      {isError && <ErrorState message={t("certificates.errors.loadFailed")} onRetry={() => refetch()} />}
      {!isLoading && !isError && certificates.length === 0 && !hasActiveFilters && (
        <EmptyState variant="certificates" onAction={isAdmin ? openCreate : undefined} />
      )}
      {!isLoading && !isError && certificates.length === 0 && hasActiveFilters && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">{t("certificates.filter.noResults") ?? "No matching certificates"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("certificates.filter.tryDifferent") ?? "Try different search terms or filters"}</p>
          <button onClick={clearFilters} className="mt-4 text-sm text-primary hover:underline">
            {t("certificates.filter.clearAll") ?? "Clear all filters"}
          </button>
        </div>
      )}

      {/* ── Certificate list ──────────────────────────────────────── */}
      {certificates.length > 0 && (
        <>
          {/* Mobile: Card view */}
          <div className="grid gap-3 sm:hidden">
            {certificates.map((c) => {
              const st = certStatusProps(c);
              const timePct = certTimeUsed(c.issueDate, c.expiryDate);
              return (
                <div key={c.id} className="rounded-xl bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{c.certificateNumber}</p>
                      <p className="font-medium truncate">{c.supplier?.name}</p>
                    </div>
                    <Badge variant={st.variant} className="shrink-0">{t(st.labelKey)}</Badge>
                  </div>

                  {/* Timeline bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{new Date(c.issueDate).toLocaleDateString()}</span>
                      <span>{new Date(c.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("absolute inset-y-0 left-0 rounded-full transition-all", certTimeColor(timePct))}
                        style={{ width: `${Math.min(timePct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">
                      {Math.round(100 - timePct)}% {t("certificates.timeRemaining") ?? "remaining"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t("certificates.table.issuedBy")}: <span className="font-medium text-foreground">{c.issuedBy}</span></span>
                    <span>{t("certificates.table.issueDate")}: <span className="font-medium text-foreground">{new Date(c.issueDate).toLocaleDateString()}</span></span>
                    <span>{t("certificates.table.expiryDate")}: <span className="font-medium text-foreground">{new Date(c.expiryDate).toLocaleDateString()}</span></span>
                  </div>
                  {/* View & action buttons */}
                  <div className="flex gap-2 pt-1 border-t">
                    <Button size="sm" variant="ghost" className="flex-1" onClick={() => { setViewingCert(c); setViewOpen(true); }}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> {t("common.view") ?? "View"}
                    </Button>
                    {isAdmin && (
                      <>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> {t("common.edit")}
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1"
                          aria-label={t("certificates.common.deleteItem", { values: { certificateNumber: c.certificateNumber } })}
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> {t("common.delete")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead onClick={() => toggleSort("certificateNumber")} active={sortField === "certificateNumber"} dir={sortDir}>
                    {t("certificates.table.certificateNumber")}
                  </SortableHead>
                  <SortableHead onClick={() => toggleSort("issuedBy")} active={sortField === "issuedBy"} dir={sortDir}>
                    {t("certificates.table.issuedBy")}
                  </SortableHead>
                  <SortableHead onClick={() => toggleSort("supplierName")} active={sortField === "supplierName"} dir={sortDir}>
                    {t("certificates.table.supplier")}
                  </SortableHead>
                  <SortableHead onClick={() => toggleSort("issueDate")} active={sortField === "issueDate"} dir={sortDir}>
                    {t("certificates.table.issueDate")}
                  </SortableHead>
                  <SortableHead onClick={() => toggleSort("expiryDate")} active={sortField === "expiryDate"} dir={sortDir}>
                    {t("certificates.table.expiryDate")}
                  </SortableHead>
                  <TableHead>{t("certificates.table.timeline")}</TableHead>
                  <TableHead>{t("certificates.table.status")}</TableHead>
                  {isAdmin && <TableHead className="text-right">{t("certificates.table.actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((c) => {
                  const st = certStatusProps(c);
                  const timePct = certTimeUsed(c.issueDate, c.expiryDate);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.certificateNumber}</TableCell>
                      <TableCell>{c.issuedBy}</TableCell>
                      <TableCell>{c.supplier?.name}</TableCell>
                      <TableCell>{new Date(c.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(c.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="relative h-2 w-20 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("absolute inset-y-0 left-0 rounded-full transition-all", certTimeColor(timePct))}
                              style={{ width: `${Math.min(timePct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {Math.round(100 - timePct)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={st.variant}>{t(st.labelKey)}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost"
                            aria-label="View certificate"
                            onClick={() => { setViewingCert(c); setViewOpen(true); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button size="sm" variant="outline"
                                aria-label={t("certificates.common.editItem", { values: { certificateNumber: c.certificateNumber } })}
                                onClick={() => openEdit(c)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="destructive"
                                aria-label={t("certificates.common.deleteItem", { values: { certificateNumber: c.certificateNumber } })}
                                onClick={() => handleDelete(c)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* ── Create/Edit Sheet ──────────────────────────────────────── */}
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

        {/* Upload document — available for BOTH create and edit */}
        {isAdmin && (editing || form.certificateNumber) && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">{t("certificates.uploadDocument")}</p>
            {editing ? (
              <CertificateUploadZone
                certificateId={editing.id}
                existingFileUrl={editing.fileUrl}
                onSuccess={(url) => {
                  setEditing({ ...editing, fileUrl: url });
                  setForm({ ...form, fileUrl: url });
                  toast.success(t("common.upload"));
                }}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("certificates.upload.saveFirstToUpload") ?? "Save the certificate first, then upload documents."}
                </p>
              </div>
            )}
          </div>
        )}
      </Sheet>

      {/* ── View Detail Sheet ──────────────────────────────────────── */}
      <Sheet
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={t("certificates.certificateDetails")}
        description={viewingCert ? viewingCert.certificateNumber : ""}
      >
        {viewingCert && (
          <div className="space-y-5">
            {/* Status badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("certificates.table.status")}</span>
              <Badge variant={certStatusProps(viewingCert).variant}>
                {t(certStatusProps(viewingCert).labelKey)}
              </Badge>
            </div>

            {/* Timeline visualization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(viewingCert.issueDate).toLocaleDateString()}</span>
                <span>{new Date(viewingCert.expiryDate).toLocaleDateString()}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-full transition-all", certTimeColor(certTimeUsed(viewingCert.issueDate, viewingCert.expiryDate)))}
                  style={{ width: `${Math.min(certTimeUsed(viewingCert.issueDate, viewingCert.expiryDate), 100)}%` }}
                />
              </div>
              <p className="text-xs text-right text-muted-foreground">
                {Math.round(100 - certTimeUsed(viewingCert.issueDate, viewingCert.expiryDate))}% {t("certificates.timeRemaining") ?? "remaining"}
              </p>
            </div>

            {/* Detail fields */}
            <div className="space-y-3">
              <DetailField label={t("certificates.form.certificateNumber")} value={viewingCert.certificateNumber} mono />
              <DetailField label={t("certificates.table.supplier")} value={viewingCert.supplier?.name ?? "—"} />
              <DetailField label={t("certificates.table.issuedBy")} value={viewingCert.issuedBy} />
              <DetailField label={t("certificates.form.issueDate")} value={new Date(viewingCert.issueDate).toLocaleDateString()} />
              <DetailField label={t("certificates.form.expiryDate")} value={new Date(viewingCert.expiryDate).toLocaleDateString()} />
            </div>

            {/* Document link */}
            {viewingCert.fileUrl && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">{t("certificates.uploadDocument")}</p>
                <a
                  href={viewingCert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("common.view") ?? "View document"}
                </a>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

/** Detail field row for view sheet */
function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium text-right max-w-[200px] truncate", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}

/** Sortable column header */
function SortableHead({
  children, onClick, active, dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
}) {
  return (
    <TableHead>
      <button
        onClick={onClick}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown className={cn(
          "h-3 w-3 transition-opacity",
          active ? "opacity-100 text-primary" : "opacity-30"
        )} />
      </button>
    </TableHead>
  );
}

/** Live status badge preview in form */
function StatusPreview({ issueDate, expiryDate }: { issueDate: string; expiryDate: string }) {
  const st = certStatusFromExpiry(expiryDate);
  return <Badge variant={st.variant}>{st.labelKey.replace("certificates.status.", "")}</Badge>;
}

/** Export certificates list to CSV */
function exportCSV(certificates: HalalCertificate[]) {
  const headers = ["Certificate Number", "Issued By", "Supplier", "Issue Date", "Expiry Date", "Status"];
  const rows = certificates.map((c) => {
    const st = certStatusProps(c);
    return [
      c.certificateNumber,
      c.issuedBy,
      c.supplier?.name ?? "",
      new Date(c.issueDate).toLocaleDateString(),
      new Date(c.expiryDate).toLocaleDateString(),
      st.labelKey.replace("certificates.status.", ""),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `certificates-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
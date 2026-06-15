"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, type ExportFormat, type ExportModule } from "@/lib/api";
import { countryFlag } from "@/lib/countryFlag";
import { useTranslation } from "@/i18n/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ErrorState, LoadingState } from "@/components/shared/state-blocks";

export function ReportsModule() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-summary"],
    queryFn: () => api.getReportSummary(),
  });

  const [isExporting, setIsExporting] = useState(false);
  const [moduleName, setModuleName] = useState<ExportModule>("inventory");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function downloadReport() {
    setIsExporting(true);
    try {
      const res = await api.exportReport(moduleName, format, { from, to });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `halalchain-${moduleName}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("reports.export"), { description: t("reports.export") + " " + t("common.download") });
    } catch {
      toast.error(t("reports.errors.loadFailed"), { description: t("common.errors.generic") });
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={t("reports.errors.loadFailed")} />;

  const s = data.summary;

  const moduleOptions: { value: ExportModule; label: string }[] = [
    { value: "inventory", label: t("inventory.pageTitle") },
    { value: "products", label: t("products.pageTitle") },
    { value: "suppliers", label: t("suppliers.pageTitle") },
    { value: "certificates", label: t("certificates.pageTitle") },
    { value: "purchase-orders", label: t("purchaseOrders.pageTitle") },
    { value: "shipments", label: t("shipments.pageTitle") },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("reports.pageTitle")}
        description={t("reports.pageDescription")}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={moduleName} onValueChange={(v) => setModuleName(v as ExportModule)}>
              <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder={t("reports.pageTitle")} /></SelectTrigger>
              <SelectContent>{moduleOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue placeholder={t("reports.format.csv")} /></SelectTrigger>
              <SelectContent><SelectItem value="csv">{t("reports.format.csv")}</SelectItem><SelectItem value="xlsx">{t("reports.format.xlsx")} (.xlsx)</SelectItem><SelectItem value="pdf">{t("reports.format.pdf")}</SelectItem></SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-full sm:w-36" placeholder={t("common.from")} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-full sm:w-36" placeholder={t("common.to")} />
            <Button variant="outline" onClick={downloadReport} disabled={isExporting} className="shrink-0">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? t("common.saving") : t("reports.export")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("dashboard.kpis.activeSuppliers")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{s.activeSuppliers}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("dashboard.kpis.inventoryValue")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${s.totalInventoryValue.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("reports.summary.title")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{s.totalStockUnits.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("reports.empty.title")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-warning">{s.lowStockCount}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>{t("reports.summary.title")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(s.suppliersByCountry).map(([country, count]) => (
              <div key={country} className="flex justify-between text-sm">
                <span><span aria-hidden="true">{countryFlag(country)} </span>{country}</span>
                <Badge>{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>{t("certificates.pageTitle")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{t("common.all")}</span><span>{s.certificates.total}</span></div>
            <div className="flex justify-between"><span>{t("certificates.status.valid")}</span><span>{s.certificates.active}</span></div>
            <div className="flex justify-between text-warning"><span>{t("certificates.status.expiringSoon")}</span><span>{s.certificates.expiringSoon}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
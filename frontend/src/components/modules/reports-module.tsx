"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, type ExportFormat, type ExportModule } from "@/lib/api";
import { useTranslation } from "@/i18n/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState, LoadingState } from "@/components/shared/state-blocks";
import { WorldMap } from "@/components/shared/world-map";

/* ── Theme-aware palette ──────────────────────────────────────────── */
const C = {
  primary: "var(--chart-1)",
  emerald: "var(--chart-2)",
  amber: "var(--chart-3)",
  red: "var(--chart-4)",
  muted: "var(--chart-5)",
  violet: "#7c3aed",
  cyan: "#0891b2",
} as const;

const DONUT_COLORS = [C.primary, C.emerald, C.amber, C.red, C.violet, C.cyan];
const PO_COLORS = [C.emerald, C.amber, C.primary, C.red, C.violet, C.muted];

type DonutLabelProps = { name?: string | number; percent?: number };
function renderDonutLabel(props: unknown) {
  const { name, percent } = props as DonutLabelProps;
  if (!percent || percent <= 0.06) return null;
  return `${name ?? ""} ${(percent * 100).toFixed(0)}%`;
}

function DonutTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const e = payload[0];
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.payload.fill }} />
        <span className="text-[var(--muted-foreground)]">{e.name}</span>
        <span className="ml-auto font-semibold text-[var(--foreground)]">{e.value}</span>
      </div>
    </div>
  );
}

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

  /* Prepare chart data */
  const suppliersByCountryData = Object.entries(s.suppliersByCountry).map(([country, count]) => ({
    country,
    count,
  }));

  const purchaseOrdersData = s.purchaseOrders.map((po) => ({
    status: po.status,
    count: po.count,
  }));

  const shipmentsData = s.shipments.map((sh) => ({
    status: sh.status,
    count: sh.count,
  }));

  const certData = [
    { status: "Active", count: s.certificates.active },
    { status: "Expiring Soon", count: s.certificates.expiringSoon },
    { status: "Other", count: Math.max(0, s.certificates.total - s.certificates.active - s.certificates.expiringSoon) },
  ].filter((d) => d.count > 0);

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

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("dashboard.kpis.activeSuppliers")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{s.activeSuppliers}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("dashboard.kpis.inventoryValue")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${s.totalInventoryValue.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("reports.summary.title")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{s.totalStockUnits.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("reports.empty.title")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-warning">{s.lowStockCount}</p></CardContent></Card>
      </div>

      {/* ── Charts Row 1: Suppliers by Country (World Map) + Certificates ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Suppliers by Country – Satellite Map */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-[15px]">{t("reports.summary.title")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <WorldMap data={suppliersByCountryData} />
          </CardContent>
        </Card>

        {/* Certificate Status – Donut */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-[15px]">{t("certificates.pageTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <StatusDonut data={certData} colors={[C.primary, C.amber, C.muted]} />
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2: PO Status + Shipment Status ─────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Purchase Orders by Status – Donut */}
        {purchaseOrdersData.length > 0 && (
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-[15px]">{t("purchaseOrders.pageTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <StatusDonut data={purchaseOrdersData} colors={PO_COLORS} />
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Shipments by Status – Donut */}
        {shipmentsData.length > 0 && (
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-[15px]">{t("shipments.pageTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <StatusDonut data={shipmentsData} />
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Chart Compositions                                                  */
/* ──────────────────────────────────────────────────────────────────── */

/** Donut Chart – Generic status distribution */
function StatusDonut({
  data,
  colors = DONUT_COLORS,
}: {
  data: { status: string; count: number }[];
  colors?: string[];
}) {
  return (
    <PieChart>
      <Pie
        data={data}
        dataKey="count"
        nameKey="status"
        cx="50%"
        cy="50%"
        innerRadius={52}
        outerRadius={86}
        paddingAngle={3}
        label={renderDonutLabel}
        labelLine={false}
        strokeWidth={0}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={colors[i % colors.length]} />
        ))}
      </Pie>
      <Tooltip content={<DonutTip />} />
      <Legend
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
      />
    </PieChart>
  );
}
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ErrorState, LoadingState } from "@/components/shared/state-blocks";

export function ReportsModule() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-summary"],
    queryFn: () => api.getReportSummary(),
  });

  const [isExporting, setIsExporting] = useState(false);

  async function downloadCsv() {
    setIsExporting(true);
    try {
      const res = await api.exportInventoryCsv();
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "halalchain-inventory.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export ready", { description: "Inventory CSV has been downloaded." });
    } catch {
      toast.error("Export failed", { description: "Could not generate the CSV file. Please try again." });
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Failed to load reports" />;

  const s = data.summary;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Operational KPI reports for Managers — inventory, compliance and procurement"
        action={
          <Button variant="outline" onClick={downloadCsv} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? "Exporting…" : "Export Inventory CSV"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Suppliers</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{s.activeSuppliers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Inventory Value</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${s.totalInventoryValue.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Stock Units</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{s.totalStockUnits.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Low Stock Items</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-warning">{s.lowStockCount}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Suppliers by Country</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(s.suppliersByCountry).map(([country, count]) => (
              <div key={country} className="flex justify-between text-sm">
                <span>{country}</span>
                <Badge>{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Certificate Compliance</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Total</span><span>{s.certificates.total}</span></div>
            <div className="flex justify-between"><span>Active</span><span>{s.certificates.active}</span></div>
            <div className="flex justify-between text-warning"><span>Expiring Soon (90d)</span><span>{s.certificates.expiringSoon}</span></div>
          </CardContent>
        </Card>
      </div>

      {s.lowStockItems.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Low Stock Alert</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Reorder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.lowStockItems.map((item) => (
                <TableRow key={`${item.sku}-${item.warehouse}`}>
                  <TableCell>{item.product}</TableCell>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell>{item.warehouse}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.reorderLevel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {s.certificates.items.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Certificates Expiring Soon</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Issued By</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.certificates.items.map((c) => (
                <TableRow key={c.number}>
                  <TableCell className="font-mono text-xs">{c.number}</TableCell>
                  <TableCell>{c.issuedBy}</TableCell>
                  <TableCell>{c.supplier}</TableCell>
                  <TableCell>{new Date(c.expiryDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

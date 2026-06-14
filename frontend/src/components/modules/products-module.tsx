"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GitBranch, QrCode, Download } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api, Product } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton, LoadingState } from "@/components/shared/state-blocks";

type FormData = {
  supplierId: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  unitPrice: string;
};

const empty: FormData = {
  supplierId: "",
  name: "",
  sku: "",
  category: "",
  unit: "",
  unitPrice: "0",
};

function downloadQrCode(qrCodeUrl: string, productId: string) {
  const a = document.createElement("a");
  a.href = qrCodeUrl;
  a.download = `qr-${productId}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function ProductsModule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const canViewTraceability = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canViewQr = user?.role === "ADMIN" || user?.role === "MANAGER";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [formError, setFormError] = useState<string | null>(null);
  const [qrProductId, setQrProductId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.getSuppliers(),
    enabled: isAdmin,
  });

  const { data: productDetail, isLoading: isLoadingQr } = useQuery({
    queryKey: ["product", qrProductId],
    queryFn: () => api.getProduct(qrProductId!),
    enabled: qrProductId !== null,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        unitPrice: Number(form.unitPrice),
        supplierId: editing ? editing.supplierId : form.supplierId,
      };
      if (editing) {
        const { supplierId: _, ...update } = payload;
        return api.updateProduct(editing.id, update);
      }
      return api.createProduct(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setSheetOpen(false);
      setEditing(null);
      setForm(empty);
      setFormError(null);
      toast.success(editing ? "Product updated" : "Product created", {
        description: editing
          ? `${form.name} has been updated.`
          : `${form.name} (${form.sku}) has been added to your catalog.`,
      });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e: Error) => {
      toast.error("Failed to delete product", { description: e.message });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setFormError(null);
    setSheetOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      supplierId: p.supplierId,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      unitPrice: String(p.unitPrice),
    });
    setFormError(null);
    setSheetOpen(true);
  }

  const stockTotal = (p: Product) =>
    p.inventory?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const products = data?.products ?? [];

  const formContent = (
    <form
      id="product-form"
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
    >
      {!editing && (
        <div className="space-y-2">
          <Label htmlFor="product-supplier">
            Supplier <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Select
            required
            value={form.supplierId}
            onValueChange={(v) => setForm({ ...form, supplierId: v })}
          >
            <SelectTrigger id="product-supplier">
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {(suppliersData?.suppliers ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({s.country})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="product-name">
          Name <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="product-name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Halal Chicken Breast"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-sku">
            SKU <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="product-sku"
            required
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="e.g. HCB-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-category">
            Category <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="product-category"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Poultry"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-unit">
            Unit <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="product-unit"
            required
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="e.g. kg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-price">
            Unit Price (USD) <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
          />
        </div>
      </div>
      {formError && (
        <p className="text-sm text-destructive" role="alert">{formError}</p>
      )}
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Management"
        description="Halal product catalog by SKU, category, unit and linked supplier"
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          ) : undefined
        }
      />

      {isLoading && <TableSkeleton columns={isAdmin ? 10 : 8} rows={5} />}
      {isError && (
        <ErrorState
          message="Failed to load products"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && products.length === 0 && (
        <EmptyState
          variant="products"
          onAction={isAdmin ? openCreate : undefined}
        />
      )}

      {products.length > 0 && (
        <>
          {/* Mobile card view */}
          <div className="grid gap-3 sm:hidden">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">${Number(p.unitPrice).toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{p.category}</span>
                  <span>{p.supplier?.name}</span>
                  <span>{p.unit} · <span className="font-medium text-foreground">{stockTotal(p)}</span> in stock</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 border-t">
                  {canViewTraceability && (
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link href={`/dashboard/products/${p.id}/traceability`}>
                        <GitBranch className="h-3.5 w-3.5 mr-1" /> Traceability
                      </Link>
                    </Button>
                  )}
                  {canViewQr && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setQrProductId(p.id)}>
                      <QrCode className="h-3.5 w-3.5 mr-1" /> QR Code
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button size="sm" variant="outline" aria-label={`Edit ${p.name}`} onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        aria-label={`Delete ${p.name}`}
                        onClick={async () => {
                          const ok = await dialog.confirm({
                            type: "destructive",
                            title: "Delete product?",
                            description: `This will permanently remove "${p.name}" (${p.sku}) and all associated inventory records. This cannot be undone.`,
                            confirmLabel: "Delete Product",
                          });
                          if (ok) deleteMutation.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  {canViewTraceability && <TableHead>Traceability</TableHead>}
                  {canViewQr && <TableHead>QR Code</TableHead>}
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{p.supplier?.name}</TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell>${Number(p.unitPrice).toFixed(2)}</TableCell>
                    <TableCell>{stockTotal(p)}</TableCell>
                    {canViewTraceability && (
                      <TableCell>
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/dashboard/products/${p.id}/traceability`}
                            aria-label={`View traceability for ${p.name}`}
                          >
                            <GitBranch className="h-3.5 w-3.5" />
                            <span className="ml-1 hidden sm:inline">Trace</span>
                          </Link>
                        </Button>
                      </TableCell>
                    )}
                    {canViewQr && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`View QR code for ${p.name}`}
                          onClick={() => setQrProductId(p.id)}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span className="ml-1 hidden sm:inline">QR</span>
                        </Button>
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Edit ${p.name}`}
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            aria-label={`Delete ${p.name}`}
                            onClick={async () => {
                              const ok = await dialog.confirm({
                                type: "destructive",
                                title: "Delete product?",
                                description: `This will permanently remove "${p.name}" (${p.sku}) and all associated inventory records. This cannot be undone.`,
                                confirmLabel: "Delete Product",
                              });
                              if (ok) deleteMutation.mutate(p.id);
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

      {/* QR Code Dialog */}
      <Dialog
        open={qrProductId !== null}
        onClose={() => setQrProductId(null)}
        title="QR Code"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          {isLoadingQr && <LoadingState />}
          {productDetail && (
            <>
              <img
                src={productDetail.qrCodeUrl}
                alt={`QR Code for ${productDetail.product.name}`}
                width={256}
                height={256}
                className="rounded-lg"
              />
              <p className="text-sm text-center font-medium">{productDetail.product.name}</p>
              <p className="text-xs text-muted-foreground text-center">
                Scan to view halal supply chain traceability
              </p>
              <Button
                onClick={() => downloadQrCode(productDetail.qrCodeUrl, productDetail.product.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </Button>
            </>
          )}
        </div>
      </Dialog>

      {/* Create / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? "Edit Product" : "New Product"}
        description={
          editing
            ? "Update product details. SKU and supplier cannot be changed after creation."
            : "Add a new halal product to your catalog."
        }
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="product-form"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Add Product"}
            </Button>
          </>
        }
      >
        {formContent}
      </Sheet>

    </div>
  );
}

// app/vendor/big-save-campaign/components/CampaignCreateDialog.tsx
"use client";

import React from "react";
import { CampaignStatus, DiscountType } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS: CampaignStatus[] = ["ACTIVE", "INACTIVE", "EXPIRED"];
const DISCOUNT_OPTIONS: DiscountType[] = ["PERCENT", "FIXED"];

type VendorProduct = { _id: string; title: string; price: number; status?: string };

export default function CampaignCreateDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  cName: string;
  setCName: (v: string) => void;
  cStatus: CampaignStatus;
  setCStatus: (v: CampaignStatus) => void;
  cDiscountType: DiscountType;
  setCDiscountType: (v: DiscountType) => void;
  cDiscountValue: number;
  setCDiscountValue: (v: number) => void;
  cStartAt: string;
  setCStartAt: (v: string) => void;
  cEndAt: string;
  setCEndAt: (v: string) => void;

  products: VendorProduct[];
  productsLoading: boolean;

  selectedProductIds: string[];
  selectedProductIdSet: Set<string>;
  setSelectedProductIds: (v: string[]) => void;
  toggleProduct: (id: string) => void;

  onCreate: () => void;
}) {
  const {
    open,
    onOpenChange,
    cName,
    setCName,
    cStatus,
    setCStatus,
    cDiscountType,
    setCDiscountType,
    cDiscountValue,
    setCDiscountValue,
    cStartAt,
    setCStartAt,
    cEndAt,
    setCEndAt,
    products,
    productsLoading,
    selectedProductIds,
    selectedProductIdSet,
    setSelectedProductIds,
    toggleProduct,
    onCreate,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Big Save Campaign</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name (optional)</Label>
            <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Auto name if empty" />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={cStatus} onValueChange={(v) => setCStatus(v as CampaignStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Discount Type</Label>
            <Select value={cDiscountType} onValueChange={(v) => setCDiscountType(v as DiscountType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DISCOUNT_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Discount Value</Label>
            <Input type="number" value={cDiscountValue} onChange={(e) => setCDiscountValue(Number(e.target.value))} />
          </div>

          <div className="space-y-2">
            <Label>Start At</Label>
            <Input type="datetime-local" value={cStartAt} onChange={(e) => setCStartAt(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>End At</Label>
            <Input type="datetime-local" value={cEndAt} onChange={(e) => setCEndAt(e.target.value)} />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Select Products</div>
              <div className="text-xs text-muted-foreground">Selected: {selectedProductIds.length}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProductIds(products.map((p) => p._id))}
              disabled={productsLoading || products.length === 0}
            >
              Select All
            </Button>
          </div>

          <div className="border rounded-md p-3 max-h-64 overflow-auto">
            {productsLoading ? (
              <div className="text-sm">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-sm">No products found.</div>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <Checkbox checked={selectedProductIdSet.has(p._id)} onCheckedChange={() => toggleProduct(p._id)} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.price} • {p.status || "—"}</div>
                    </div>
                    <code className="text-xs">{p._id}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onCreate}>Save Campaign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

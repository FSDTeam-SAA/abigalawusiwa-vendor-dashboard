"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CampaignStatus, DiscountType } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: CampaignStatus[] = ["ACTIVE", "INACTIVE", "EXPIRED"];
const DISCOUNT_OPTIONS: DiscountType[] = ["PERCENT", "FIXED"];

type VendorProduct = { _id: string; title: string; price: number; status?: string };

const getErrorMessage = (err: any, fallback = "Something went wrong") =>
  err?.response?.data?.message || err?.message || fallback;

export default function CampaignUpdateDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  // update fields
  eName: string;
  setEName: (v: string) => void;
  eStatus: CampaignStatus;
  setEStatus: (v: CampaignStatus) => void;
  eDiscountType: DiscountType;
  setEDiscountType: (v: DiscountType) => void;
  eDiscountValue: number;
  setEDiscountValue: (v: number) => void;
  eStartAt: string;
  setEStartAt: (v: string) => void;
  eEndAt: string;
  setEEndAt: (v: string) => void;

  onUpdate: () => void;

  // products
  products: VendorProduct[];
  productsLoading: boolean;

  // ✅ already attached ids (preselect)
  attachedProductIds: string[];

  // attach action
  onAttachProducts: (productIds: string[]) => Promise<any>;
  onAfterAttach?: () => void;
}) {
  const {
    open,
    onOpenChange,
    eName,
    setEName,
    eStatus,
    setEStatus,
    eDiscountType,
    setEDiscountType,
    eDiscountValue,
    setEDiscountValue,
    eStartAt,
    setEStartAt,
    eEndAt,
    setEEndAt,
    onUpdate,
    products,
    productsLoading,
    attachedProductIds,
    onAttachProducts,
    onAfterAttach,
  } = props;

  // ✅ local selection starts with attached products
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const attachedSet = useMemo(() => new Set(attachedProductIds || []), [attachedProductIds]);

  // ✅ whenever dialog opens or attached list changes, prefill selection
  useEffect(() => {
    if (open) {
      setSelectedIds(attachedProductIds || []);
    }
  }, [open, attachedProductIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return Array.from(s);
    });
  };

  // ✅ only new products = selected - attached
  const newSelectedIds = useMemo(() => {
    return selectedIds.filter((id) => !attachedSet.has(id));
  }, [selectedIds, attachedSet]);

  const onAttach = () => {
    if (!newSelectedIds.length) {
      toast.info("No new products selected");
      return;
    }

    const promise = onAttachProducts(newSelectedIds);

    toast.promise(promise, {
      loading: "Attaching selected products...",
      success: (data: any) => {
        onAfterAttach?.();
        return data?.message || "Products attached";
      },
      error: (err: any) => getErrorMessage(err, "Failed to attach products"),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSelectedIds([]);
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Update Campaign</DialogTitle>
        </DialogHeader>

        {/* Update fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={eName} onChange={(e) => setEName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={eStatus} onValueChange={(v) => setEStatus(v as CampaignStatus)}>
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
            <Select value={eDiscountType} onValueChange={(v) => setEDiscountType(v as DiscountType)}>
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
            <Input
              type="number"
              value={eDiscountValue}
              onChange={(e) => setEDiscountValue(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Start At</Label>
            <Input type="datetime-local" value={eStartAt} onChange={(e) => setEStartAt(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>End At</Label>
            <Input type="datetime-local" value={eEndAt} onChange={(e) => setEEndAt(e.target.value)} />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Products selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Select Products</div>
              <div className="text-xs text-muted-foreground">
                Already attached: {attachedProductIds?.length || 0} •
                Selected: {selectedIds.length} •
                New: {newSelectedIds.length}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(Array.from(new Set([...selectedIds, ...products.map((p) => p._id)])))}
                disabled={productsLoading || products.length === 0}
              >
                Select All
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedIds(attachedProductIds || [])}
              >
                Reset
              </Button>

              <Button
                size="sm"
                onClick={onAttach}
                disabled={productsLoading || newSelectedIds.length === 0}
              >
                Attach New Selected
              </Button>
            </div>
          </div>

          <div className="border rounded-md p-3 max-h-56 overflow-auto">
            {productsLoading ? (
              <div className="text-sm">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-sm">No products found.</div>
            ) : (
              <div className="space-y-2">
                {products.map((p) => {
                  const isAttached = attachedSet.has(p._id);
                  return (
                    <div key={p._id} className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedSet.has(p._id)}
                        onCheckedChange={() => toggle(p._id)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium flex items-center gap-2">
                          {p.title}
                          {isAttached ? (
                            <span className="text-xs px-2 py-0.5 rounded bg-muted">Attached</span>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.price} • {p.status || "—"}
                        </div>
                      </div>
                      <code className="text-xs">{p._id}</code>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onUpdate}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// app/vendor/big-save-campaign/components/CampaignDetailsDialog.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CampaignDetailsData } from "../page";

export default function CampaignDetailsDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  details: CampaignDetailsData | null;
}) {
  const { open, onOpenChange, details } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Campaign Details</DialogTitle>
        </DialogHeader>

        {!details ? (
          <div className="text-sm">Loading details...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="font-medium">{details.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-medium">{details.status}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Discount</div>
                <div className="font-medium">
                  {details.discountType}{" "}
                  {details.discountType === "PERCENT"
                    ? `${details.discountValue}%`
                    : details.discountValue}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="font-medium">
                  {new Date(details.startAt).toLocaleString()} →{" "}
                  {new Date(details.endAt).toLocaleString()}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="font-medium mb-2">
                Attached Products ({details.products?.length || 0})
              </div>

              {details.products?.length ? (
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 p-2 bg-muted text-xs font-medium">
                    <div className="col-span-6">Title</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Rating</div>
                  </div>

                  {details.products.map((p) => (
                    <div key={p._id} className="grid grid-cols-12 gap-2 p-2 border-t text-sm">
                      <div className="col-span-6">
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: <code>{p._id}</code>
                        </div>
                      </div>
                      <div className="col-span-2">{p.price}</div>
                      <div className="col-span-2">{p.status || "-"}</div>
                      <div className="col-span-2">
                        {typeof p.rating === "number" ? p.rating.toFixed(1) : "-"} (
                        {p.ratingCount ?? 0})
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No products attached.</div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// app/vendor/big-save-campaign/components/CampaignTable.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CampaignListItem } from "../page";
import { Edit, Eye, Trash2 } from "lucide-react";

export default function CampaignTable({
  loading,
  campaigns,
  onDetails,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  campaigns: CampaignListItem[];
  onDetails: (id: string) => void;
  onEdit: (row: CampaignListItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-2 p-3 bg-muted text-sm font-medium">
        <div className="col-span-4">Name</div>
        <div className="col-span-2">Discount</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Products</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {loading ? (
        <div className="p-4 text-sm">Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="p-4 text-sm">No campaigns found.</div>
      ) : (
        campaigns.map((c) => (
          <div key={c._id} className="grid grid-cols-12 gap-2 p-3 border-t items-center text-sm">
            <div className="col-span-4">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(c.startAt).toLocaleString()} → {new Date(c.endAt).toLocaleString()}
              </div>
            </div>

            <div className="col-span-2">
              {c.discountType} {c.discountType === "PERCENT" ? `${c.discountValue}%` : c.discountValue}
            </div>

            <div className="col-span-2">{c.status}</div>

            <div className="col-span-2">{c.attachedProductCount ?? "-"}</div>

            <div className="col-span-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onDetails(c._id)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onEdit(c)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(c._id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

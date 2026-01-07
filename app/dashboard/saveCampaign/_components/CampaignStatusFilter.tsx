// app/vendor/big-save-campaign/components/CampaignStatusFilter.tsx
"use client";

import React from "react";
import { CampaignStatus } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS: CampaignStatus[] = ["ACTIVE", "INACTIVE", "EXPIRED"];

export default function CampaignStatusFilter({
  value,
  onChange,
}: {
  value: CampaignStatus | "ALL";
  onChange: (v: CampaignStatus | "ALL") => void;
}) {
  return (
    <div className="w-48">
      <Select value={value} onValueChange={(v) => onChange(v as any)}>
        <SelectTrigger>
          <SelectValue placeholder="Filter status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">ALL</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

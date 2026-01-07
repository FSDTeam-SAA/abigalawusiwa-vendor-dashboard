// app/vendor/big-save-campaign/components/CampaignPagination.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function CampaignPagination({
  pagination,
  onPrev,
  onNext,
}: {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalData: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!pagination) return null;

  return (
    <div className="flex items-center justify-between text-sm">
      <div>
        Page {pagination.currentPage} / {pagination.totalPages} • Total: {pagination.totalData}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" disabled={!pagination.hasPrevPage} onClick={onPrev}>
          Prev
        </Button>
        <Button variant="outline" disabled={!pagination.hasNextPage} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

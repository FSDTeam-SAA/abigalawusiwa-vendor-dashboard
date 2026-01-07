// app/vendor/big-save-campaign/components/CampaignDeleteDialog.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function CampaignDeleteDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDelete: () => void;
}) {
  const { open, onOpenChange, onDelete } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Campaign</DialogTitle>
        </DialogHeader>

        <div className="text-sm">Are you sure you want to delete this campaign?</div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// app/vendor/big-save-campaign/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  bigSaveCampaignApi,
  productApi,
  CampaignStatus,
  DiscountType,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import CampaignStatusFilter from "./_components/CampaignStatusFilter";
import CampaignTable from "./_components/CampaignTable";
import CampaignPagination from "./_components/CampaignPagination";
import CampaignCreateDialog from "./_components/createSaveCompaigns";
import CampaignUpdateDialog from "./_components/updateSaveCompaigns";
import CampaignDeleteDialog from "./_components/deleteSaveCompaign";
import CampaignDetailsDialog from "./_components/saveCompaignDetails";

type ApiResponse<T> = { success: boolean; message: string; data: T };

export type CampaignListItem = {
  _id: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startAt: string;
  endAt: string;
  status: CampaignStatus;
  attachedProductCount?: number;
};

type CampaignListData = {
  campaigns: CampaignListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalData: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type CampaignDetailsData = {
  _id: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startAt: string;
  endAt: string;
  status: CampaignStatus;
  products: Array<{
    _id: string;
    title: string;
    price: number;
    status?: string;
    rating?: number;
    ratingCount?: number;
  }>;
};

export type VendorProduct = {
  _id: string;
  title: string;
  price: number;
  status?: string;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [pagination, setPagination] = useState<
    CampaignListData["pagination"] | null
  >(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "ALL">(
    "ALL"
  );

  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState<VendorProduct[]>([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [details, setDetails] = useState<CampaignDetailsData | null>(null);

  // create
  const [cName, setCName] = useState("");
  const [cDiscountType, setCDiscountType] = useState<DiscountType>("PERCENT");
  const [cDiscountValue, setCDiscountValue] = useState<number>(10);
  const [cStartAt, setCStartAt] = useState("");
  const [cEndAt, setCEndAt] = useState("");
  const [cStatus, setCStatus] = useState<CampaignStatus>("ACTIVE");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const selectedProductIdSet = useMemo(
    () => new Set(selectedProductIds),
    [selectedProductIds]
  );

  // edit
  const [eName, setEName] = useState("");
  const [eDiscountType, setEDiscountType] = useState<DiscountType>("PERCENT");
  const [eDiscountValue, setEDiscountValue] = useState<number>(10);
  const [eStartAt, setEStartAt] = useState("");
  const [eEndAt, setEEndAt] = useState("");
  const [eStatus, setEStatus] = useState<CampaignStatus>("INACTIVE");

  const toISO = (dtLocal: string) => {
    const d = new Date(dtLocal);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  };

  const toDatetimeLocalValue = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const resetCreateForm = () => {
    setCName("");
    setCDiscountType("PERCENT");
    setCDiscountValue(10);
    setCStartAt("");
    setCEndAt("");
    setCStatus("ACTIVE");
    setSelectedProductIds([]);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return Array.from(set);
    });
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await bigSaveCampaignApi.getAll(
        page,
        limit,
        statusFilter === "ALL" ? undefined : statusFilter
      );
      const payload = res.data as ApiResponse<CampaignListData>;
      setCampaigns(payload?.data?.campaigns || []);
      setPagination(payload?.data?.pagination || null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await productApi.getAll(undefined, undefined, 1, 200);
      const payload = res.data as any;
      const items: VendorProduct[] =
        payload?.data?.products || payload?.products || payload?.data || [];
      setProducts(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const openEditDialog = async (row: CampaignListItem) => {
    setSelectedCampaignId(row._id);

    setEName(row.name || "");
    setEDiscountType(row.discountType || "PERCENT");
    setEDiscountValue(Number(row.discountValue || 0));
    setEStartAt(toDatetimeLocalValue(row.startAt));
    setEEndAt(toDatetimeLocalValue(row.endAt));
    setEStatus(row.status || "INACTIVE");

    setOpenEdit(true);

    // ✅ fetch details => attached products
    try {
      const res = await bigSaveCampaignApi.getById(row._id);
      const payload = res.data as ApiResponse<CampaignDetailsData>;
      setDetails(payload?.data || null);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to load campaign details"
      );
    }
  };

  const openDetailsDialog = async (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setOpenDetails(true);
    setDetails(null);

    try {
      const res = await bigSaveCampaignApi.getById(campaignId);
      const payload = res.data as ApiResponse<CampaignDetailsData>;
      setDetails(payload?.data || null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to load details");
    }
  };

  const openDeleteDialog = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setOpenDelete(true);
  };

  const onCreate = async () => {
    try {
      if (!cStartAt || !cEndAt)
        return toast.error("startAt and endAt are required");
      if (!cDiscountValue || cDiscountValue <= 0)
        return toast.error("discountValue must be > 0");
      if (cDiscountType === "PERCENT" && cDiscountValue > 100) {
        return toast.error("Percentage discount cannot be greater than 100");
      }

      const payload: any = {
        name: cName || undefined,
        discountType: cDiscountType,
        discountValue: Number(cDiscountValue),
        startAt: toISO(cStartAt),
        endAt: toISO(cEndAt),
        status: cStatus,
      };
      if (selectedProductIds.length) payload.productIds = selectedProductIds;

      const promise = bigSaveCampaignApi
        .create(payload)
        .then((res) => res.data);
      toast.promise(promise, {
        loading: "Creating campaign...",
        success: (data: any) => {
          setOpenCreate(false);
          resetCreateForm();
          fetchCampaigns();
          return data?.message || "Campaign created";
        },
        error: (e: any) =>
          e?.response?.data?.message || e?.message || "Create failed",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err?.message || "Create failed"
      );
    }
  };

  const onUpdate = async () => {
    if (!selectedCampaignId) return;

    try {
      if (!eStartAt || !eEndAt)
        return toast.error("startAt and endAt are required");
      if (!eDiscountValue || eDiscountValue <= 0)
        return toast.error("discountValue must be > 0");
      if (eDiscountType === "PERCENT" && eDiscountValue > 100) {
        return toast.error("Percentage discount cannot be greater than 100");
      }

      const payload = {
        name: eName || undefined,
        discountType: eDiscountType,
        discountValue: Number(eDiscountValue),
        startAt: toISO(eStartAt),
        endAt: toISO(eEndAt),
        status: eStatus,
      };

      const promise = bigSaveCampaignApi
        .update(selectedCampaignId, payload)
        .then((res) => res.data);
      toast.promise(promise, {
        loading: "Updating campaign...",
        success: (data: any) => {
          setOpenEdit(false);
          setSelectedCampaignId(null);
          fetchCampaigns();
          return data?.message || "Campaign updated";
        },
        error: (e: any) =>
          e?.response?.data?.message || e?.message || "Update failed",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err?.message || "Update failed"
      );
    }
  };

  const onAttachProducts = async (productIds: string[]) => {
    if (!selectedCampaignId) return toast.error("No campaign selected");

    const promise = bigSaveCampaignApi
      .attachProducts(selectedCampaignId, productIds)
      .then((res) => res.data);

    toast.promise(promise, {
      loading: "Attaching products...",
      success: (data: any) => data?.message || "Products attached",
      error: (e: any) =>
        e?.response?.data?.message || e?.message || "Attach failed",
    });

    return promise; // still return promise if dialog expects it
  };

  const onDelete = async () => {
    if (!selectedCampaignId) return;

    try {
      const promise = bigSaveCampaignApi
        .delete(selectedCampaignId)
        .then((res) => res.data);
      toast.promise(promise, {
        loading: "Deleting campaign...",
        success: (data: any) => {
          setOpenDelete(false);
          setSelectedCampaignId(null);
          fetchCampaigns();
          return data?.message || "Campaign deleted";
        },
        error: (e: any) =>
          e?.response?.data?.message || e?.message || "Delete failed",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err?.message || "Delete failed"
      );
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Big Save Campaign</h1>
          <p className="text-sm text-muted-foreground">
            Create, update, delete, and view details
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CampaignStatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Button onClick={() => setOpenCreate(true)}>Create Campaign</Button>
        </div>
      </div>

      <Separator />

      <CampaignTable
        loading={loading}
        campaigns={campaigns}
        onDetails={openDetailsDialog}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

      <CampaignPagination
        pagination={pagination}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      <CampaignCreateDialog
        open={openCreate}
        onOpenChange={(v) => {
          setOpenCreate(v);
          if (!v) resetCreateForm();
        }}
        cName={cName}
        setCName={setCName}
        cStatus={cStatus}
        setCStatus={setCStatus}
        cDiscountType={cDiscountType}
        setCDiscountType={setCDiscountType}
        cDiscountValue={cDiscountValue}
        setCDiscountValue={setCDiscountValue}
        cStartAt={cStartAt}
        setCStartAt={setCStartAt}
        cEndAt={cEndAt}
        setCEndAt={setCEndAt}
        products={products}
        productsLoading={productsLoading}
        selectedProductIds={selectedProductIds}
        selectedProductIdSet={selectedProductIdSet}
        setSelectedProductIds={setSelectedProductIds}
        toggleProduct={toggleProduct}
        onCreate={onCreate}
      />

      <CampaignUpdateDialog
        open={openEdit}
        onOpenChange={(v) => {
          setOpenEdit(v);
          if (!v) setSelectedCampaignId(null);
        }}
        eName={eName}
        setEName={setEName}
        eStatus={eStatus}
        setEStatus={setEStatus}
        eDiscountType={eDiscountType}
        setEDiscountType={setEDiscountType}
        eDiscountValue={eDiscountValue}
        setEDiscountValue={setEDiscountValue}
        eStartAt={eStartAt}
        setEStartAt={setEStartAt}
        eEndAt={eEndAt}
        setEEndAt={setEEndAt}
        onUpdate={onUpdate}
        products={products}
        productsLoading={productsLoading}
        attachedProductIds={details?.products?.map((p) => p._id) || []} // ✅ pre-select
        onAttachProducts={onAttachProducts}
        onAfterAttach={() => {
          fetchCampaigns();
          if (selectedCampaignId) openDetailsDialog(selectedCampaignId); // refresh attached list
        }}
      />

      <CampaignDeleteDialog
        open={openDelete}
        onOpenChange={(v) => {
          setOpenDelete(v);
          if (!v) setSelectedCampaignId(null);
        }}
        onDelete={onDelete}
      />

      <CampaignDetailsDialog
        open={openDetails}
        onOpenChange={(v) => {
          setOpenDetails(v);
          if (!v) {
            setSelectedCampaignId(null);
            setDetails(null);
          }
        }}
        details={details}
      />
    </div>
  );
}

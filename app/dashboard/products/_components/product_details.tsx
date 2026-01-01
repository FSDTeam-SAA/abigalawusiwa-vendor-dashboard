"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { productApi, categoryApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type ChildCategory = {
  _id: string;
  name: string;
};

type SubCategory = {
  _id: string;
  name: string;
  childCategories: ChildCategory[];
};

type CategoryDoc = {
  _id: string;
  mainCategory: string;
  subCategories: SubCategory[];
};

function FieldRow({ label, value }: { label: string; value: any }) {
  const display =
    value === null || value === undefined || value === ""
      ? "-"
      : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : Array.isArray(value)
      ? value.length
        ? value.join(", ")
        : "-"
      : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3 py-2 border-b">
      <div className="sm:w-56 font-semibold text-gray-900">{label}</div>
      <div className="flex-1 text-gray-700 break-words">{display}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">{children}</h2>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Media */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-56 w-full rounded-md" />
        </div>

        <div className="bg-white border rounded-lg p-4 lg:col-span-2 space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>

      {/* Video */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-48 w-full rounded-md" />
      </div>

      {/* Sections */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetails({ productId }: { productId: string }) {
  const [payload, setPayload] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [storeReviewStats, setStoreReviewStats] = useState<any>(null);
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [subCategoryName, setSubCategoryName] = useState<string>("");
  const [childCategoryName, setChildCategoryName] = useState<string>("");

  useEffect(() => {
    if (!productId) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1) Get product payload
      const prodRes = await productApi.getById(productId);
      const data = prodRes.data?.data;
      setPayload(prodRes.data);

      const p = data?.product || data;
      setProduct(p);
      setReviews(data?.reviews || []);
      setStoreReviewStats(data?.storeReviewStats || null);

      // 2) Resolve sub/child category NAMES
      const catRes = await categoryApi.getAll(1, 100);
      const categories: CategoryDoc[] = catRes.data?.data?.categories || [];

      let subName = "";
      let childName = "";

      const subId = p?.subCategory;
      const childId = p?.childCategory;

      categories.forEach((main) => {
        main.subCategories.forEach((sub) => {
          if (sub._id === subId) subName = sub.name;

          sub.childCategories.forEach((child) => {
            if (child._id === childId) {
              childName = child.name;
              if (!subName) subName = sub.name;
            }
          });
        });
      });

      setSubCategoryName(subName);
      setChildCategoryName(childName);
    } catch (err) {
      console.error("Failed to fetch product:", err);
    } finally {
      setLoading(false);
    }
  };

  const mainCategoryLabel = useMemo(() => {
    return product?.mainCategory || product?.category?.mainCategory || "-";
  }, [product]);

  if (loading) return <ProductDetailsSkeleton />;
  if (!product) return <div className="p-6">Product not found</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar + Back */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Optional fallback */}
        <Button
          type="button"
          variant="ghost"
          className="text-gray-600"
          onClick={() => router.push("/dashboard/products")}
        >
          Go to Products
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {product.title || "Untitled Product"}
        </h1>
        <p className="text-sm text-gray-600">
          Product ID: <span className="font-mono">{product._id}</span>
        </p>
        <p className="text-sm text-gray-600">
          Status: <span className="font-semibold">{product.status || "-"}</span>
        </p>
      </div>

      {/* Media */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Image */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Main Image</h3>
          {product.mainImage ? (
            <div className="relative w-full h-56">
              <Image
                src={product.mainImage}
                alt="Main"
                fill
                className="object-cover rounded-md"
              />
            </div>
          ) : (
            <div className="text-sm text-gray-500">No main image</div>
          )}
        </div>

        {/* Gallery */}
        <div className="bg-white border rounded-lg p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3">Image Gallery</h3>
          {Array.isArray(product.imageGallery) &&
          product.imageGallery.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.imageGallery.map((src: string, idx: number) => (
                <div key={idx} className="relative w-full h-32">
                  <Image
                    src={src}
                    alt={`Gallery ${idx + 1}`}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No gallery images</div>
          )}
        </div>
      </div>

      {/* Video */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Video</h3>
        {product.videoUrl ? (
          <video
            className="w-full rounded-md"
            controls
            src={product.videoUrl}
          />
        ) : (
          <div className="text-sm text-gray-500">No video</div>
        )}
      </div>

      {/* Core Info */}
      <div className="bg-white border rounded-lg p-4">
        <SectionTitle>Category</SectionTitle>
        <FieldRow label="Main Category" value={mainCategoryLabel} />
        <FieldRow
          label="Category ID"
          value={product.category?._id || product.category || "-"}
        />
        <FieldRow
          label="Sub Category"
          value={subCategoryName || product.subCategory || "-"}
        />
        <FieldRow
          label="Child Category"
          value={childCategoryName || product.childCategory || "-"}
        />

        <SectionTitle>Pricing</SectionTitle>
        <FieldRow label="Price" value={product.price} />
        <FieldRow label="Discount Price" value={product.discountPrice} />
        <FieldRow label="Sales Count" value={product.salesCount} />

        <SectionTitle>Descriptions</SectionTitle>
        <FieldRow label="Description" value={product.description} />
        <FieldRow
          label="Delivery & Return Policy"
          value={product.deliveryAndReturnPolicy}
        />

        <SectionTitle>Tags</SectionTitle>
        <FieldRow label="Tags" value={product.tags} />
        <FieldRow label="Admin Tags" value={product.adminTags} />

        <SectionTitle>Ratings</SectionTitle>
        <FieldRow label="Rating" value={product.rating} />
        <FieldRow label="Rating Count" value={product.ratingCount} />

        <SectionTitle>Meta / SEO</SectionTitle>
        <FieldRow label="Meta Title" value={product.seo?.metaTitle} />
        <FieldRow label="Slug" value={product.seo?.slug} />
        <FieldRow
          label="Meta Description"
          value={product.seo?.metaDescription}
        />
        <FieldRow label="Meta Keywords" value={product.seo?.metaKeywords} />

        <SectionTitle>System</SectionTitle>
        <FieldRow label="Product Code" value={product.productCode} />
        <FieldRow label="Created At" value={product.createdAt} />
        <FieldRow label="Updated At" value={product.updatedAt} />
        <FieldRow label="Wishlisted By" value={product.wishlistedBy} />
        <FieldRow label="Announcements" value={product.announcements} />
      </div>

      {/* Created By */}
      <div className="bg-white border rounded-lg p-4">
        <SectionTitle>Created By</SectionTitle>
        <FieldRow label="User ID" value={product.createdBy?._id} />
        <FieldRow label="Name" value={product.createdBy?.name} />
        <FieldRow label="Email" value={product.createdBy?.email} />
      </div>

      {/* Store */}
      <div className="bg-white border rounded-lg p-4">
        <SectionTitle>Store</SectionTitle>
        <FieldRow label="Store ID" value={product.store?._id} />
        <FieldRow label="Store Name" value={product.store?.storeName} />
        <FieldRow label="Store Logo" value={product.store?.storeLogo} />
        <FieldRow label="Contact Email" value={product.store?.contactEmail} />
        <FieldRow label="Store Phone" value={product.store?.storePhone} />
      </div>

      {/* Product-type specific */}
      {product.generalGoods && (
        <div className="bg-white border rounded-lg p-4">
          <SectionTitle>General Goods</SectionTitle>

          <FieldRow label="Size" value={product.generalGoods?.size} />
          <FieldRow label="Brand" value={product.generalGoods?.brand} />
          <FieldRow
            label="Measurement"
            value={product.generalGoods?.measurement}
          />
          <FieldRow
            label="Wholesale Price"
            value={product.generalGoods?.wholesalePrice}
          />
          <FieldRow
            label="Stock Quantity"
            value={product.generalGoods?.stockQuantity}
          />
          <FieldRow label="Color" value={product.generalGoods?.color} />

          {/* ✅ Documents */}
          <div className="pt-3">
            <div className="font-semibold text-gray-900 mb-2">Documents</div>

            {Array.isArray(product.generalGoods?.documents) &&
            product.generalGoods.documents.length ? (
              <ul className="space-y-2">
                {product.generalGoods.documents.map(
                  (url: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-3"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {url}
                      </a>

                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50 whitespace-nowrap"
                      >
                        Open
                      </a>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No documents</p>
            )}
          </div>

          {/* ✅ Optional: Inline PDF preview (only for .pdf) */}
          {Array.isArray(product.generalGoods?.documents) &&
            product.generalGoods.documents.some((u: string) =>
              u.toLowerCase().endsWith(".pdf")
            ) && (
              <div className="mt-4 space-y-4">
                {product.generalGoods.documents
                  .filter((u: string) => u.toLowerCase().endsWith(".pdf"))
                  .map((pdfUrl: string, idx: number) => (
                    <div
                      key={idx}
                      className="border rounded-md overflow-hidden"
                    >
                      <div className="px-3 py-2 text-sm font-medium bg-gray-50">
                        PDF Preview #{idx + 1}
                      </div>
                      <iframe src={pdfUrl} className="w-full h-[500px]" />
                    </div>
                  ))}
              </div>
            )}
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white border rounded-lg p-4">
        <SectionTitle>Reviews</SectionTitle>
        {reviews?.length ? (
          <div className="space-y-3">
            {reviews.map((r: any, idx: number) => (
              <div key={idx} className="border rounded-md p-3">
                <div className="text-sm text-gray-700">
                  <strong>Rating:</strong> {r.rating ?? "-"}
                </div>
                <div className="text-sm text-gray-700">
                  <strong>Comment:</strong> {r.comment ?? "-"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {r.createdAt || ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No reviews</div>
        )}

        <SectionTitle>Store Review Stats</SectionTitle>
        <FieldRow
          label="Total Reviews"
          value={storeReviewStats?.totalReviews}
        />
        <FieldRow
          label="Average Rating"
          value={storeReviewStats?.averageRating}
        />
      </div>
    </div>
  );
}

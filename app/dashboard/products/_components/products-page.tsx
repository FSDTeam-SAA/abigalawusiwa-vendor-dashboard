"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Search, Eye } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import Link from "next/link";
import { categoryApi, productApi } from "@/lib/api";
import { DeleteModal } from "@/components/delete-modal";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  _id: string;
  title: string;
  mainCategory: string;
  subCategory?: { name: string };
  childCategory?: { name: string };
  price: number;
  status: "pending" | "approved" | "rejected";
  discountPrice?: number;
  isActive: boolean;

  // ✅ Added for image
  mainImage?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  // Filters
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [childCategories, setChildCategories] = useState<any[]>([]);

  const [selectedMain, setSelectedMain] = useState("all");
  const [selectedSub, setSelectedSub] = useState("all");
  const [selectedChild, setSelectedChild] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { addToast } = useToast();

  // Fetch categories once
  useEffect(() => {
    loadCategories();
  }, []);

  // Fetch products when page changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll(1, 100);
      const cats = res.data.data.categories;
      setMainCategories(cats);

      // Build sub & child category lists
      const allSubs: any[] = [];
      const allChildren: any[] = [];

      cats.forEach((m: any) => {
        m.subCategories.forEach((s: any) => {
          allSubs.push({ name: s.name });
          s.childCategories.forEach((c: any) => {
            allChildren.push({ name: c.name });
          });
        });
      });

      setSubCategories(allSubs);
      setChildCategories(allChildren);
    } catch {
      addToast({ title: "Failed to load categories", type: "error" });
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll(undefined, undefined, currentPage, 10);

      if (res.data.status) {
        setProducts(res.data.data.products);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (error: any) {
      addToast({
        title: error?.response?.data?.message || "Failed to fetch products",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      await productApi.delete(deleteId);
      addToast({ title: "Product deleted successfully", type: "success" });
      setDeleteId(null);
      fetchProducts();
    } catch (error: any) {
      addToast({
        title: error?.response?.data?.message || "Failed to delete product",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Local filtering
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchMain = selectedMain === "all" || p.mainCategory === selectedMain;

    const matchSub =
      selectedSub === "all" || p.subCategory?.name === selectedSub;

    const matchChild =
      selectedChild === "all" || p.childCategory?.name === selectedChild;

    return matchSearch && matchMain && matchSub && matchChild;
  });

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {/* SEARCH */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-100 border-0 rounded-md"
              />
            </div>

            {/* MAIN CATEGORY FILTER */}
            <div className="relative">
              <select
                value={selectedMain}
                onChange={(e) => {
                  setSelectedMain(e.target.value);
                  setSelectedSub("all");
                  setSelectedChild("all");
                }}
                className="bg-gray-100 border-0 px-4 py-2 rounded-md text-gray-600 appearance-none pr-8"
              >
                <option value="all">All Categories</option>
                {mainCategories.map((c) => (
                  <option key={c._id} value={c.mainCategory}>
                    {c.mainCategory}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                ▾
              </span>
            </div>

            {/* SUB CATEGORY FILTER */}
            <div className="relative">
              <select
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                className="bg-gray-100 border-0 px-4 py-2 rounded-md text-gray-600 appearance-none pr-8"
              >
                <option value="all">All Sub Categories</option>
                {subCategories.map((s, i) => (
                  <option key={i} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                ▾
              </span>
            </div>

            {/* CHILD CATEGORY FILTER */}
            <div className="relative">
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="bg-gray-100 border-0 px-4 py-2 rounded-md text-gray-600 appearance-none pr-8"
              >
                <option value="all">All Child Categories</option>
                {childCategories.map((c, i) => (
                  <option key={i} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                ▾
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Product Image
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Product Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Sub Category
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Child Category
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Price
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product._id}
                        className="border-b hover:bg-gray-50"
                      >
                        {/* ✅ IMAGE */}
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                            {product.mainImage ? (
                              <img
                                src={product.mainImage}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">
                                No image
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {product.title}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-gray-700">
                          {product.mainCategory}
                        </td>

                        {/* Sub */}
                        <td className="py-3 px-4 text-gray-700">
                          {product.subCategory?.name || "-"}
                        </td>

                        {/* Child */}
                        <td className="py-3 px-4 text-gray-700">
                          {product.childCategory?.name || "-"}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 font-semibold">
                          ${product.price}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              product.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : product.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.status.charAt(0).toUpperCase() +
                              product.status.slice(1)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/products/view/${product._id}`}>
                              <button className="p-1 hover:bg-gray-200 rounded">
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                            </Link>

                            <Link href={`/dashboard/products/edit/${product._id}`}>
                              <button className="p-1 hover:bg-gray-200 rounded">
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </button>
                            </Link>

                            <button
                              onClick={() => setDeleteId(product._id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DeleteModal
        open={!!deleteId}
        title="Delete Product"
        message="Are you sure you want to delete this product?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}

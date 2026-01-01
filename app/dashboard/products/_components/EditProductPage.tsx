// app/dashboard/products/edit/[id]/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState, ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, ArrowLeft, X, Plus } from "lucide-react"

import { productApi, categoryApi } from "@/lib/api"
import { useToast } from "@/components/toast-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ---------------- Types ----------------
type ProductType = "generalgoods" | "vehicles" | "services"

interface ChildCategory {
  _id: string
  name: string
}

interface SubCategory {
  _id: string
  name: string
  childCategories: ChildCategory[]
}

interface CategoryDoc {
  _id: string
  mainCategory: string
  subCategories: SubCategory[]
}

type SeoPayload = {
  metaTitle?: string
  slug?: string
  metaDescription?: string
  metaKeywords?: string[] | string
}

interface ProductFromApi {
  _id: string
  title: string
  description: string
  deliveryAndReturnPolicy?: string
  mainCategory: "general goods" | "vehicles" | "services"

  category: { _id: string; mainCategory: string } | string
  subCategory?: any
  childCategory?: any

  price: number
  discountPrice?: number
  tags: string[]

  mainImage?: string
  imageGallery?: string[]
  videoUrl?: string

  seo?: {
    metaTitle?: string
    slug?: string
    metaDescription?: string
    metaKeywords?: string[]
  }

  generalGoods?: {
    stockQuantity?: number
    wholesalePrice?: number
    size?: string
    brand?: string
    measurement?: string
    color?: string[]
    documents?: string[] // ✅ from your API
  }

  vehicle?: {
    specialFeatures?: string
    vehicleCondition?: "new" | "used" | "refurbished"
    registration?: "registered" | "unregistered" | "not_applicable"
    fuelType?: string
    cc?: string
    transmission?: string
    color?: string[]
    documents?: string[]
  }

  service?: {
    detailedDescription?: string
    serviceDocuments?: string[]
  }

  store?: { _id: string }
}

interface FormState {
  // common
  title: string
  description: string
  deliveryPolicy: string
  regularPrice: string
  discountPrice: string
  tags: string[]

  // SEO
  metaTitle: string
  slug: string
  metaDescription: string
  metaKeywords: string // comma separated

  // general goods
  stockQuantity: string
  wholesalePrice: string
  size: string
  brand: string
  measurement: string
  color: string // comma separated

  // vehicles
  specialFeatures: string
  vehicleCondition: string
  registration: string
  fuelType: string
  cc: string
  transmission: string
  vehicleColor: string // comma separated

  // services
  serviceDetailedDescription: string
}

const emptyForm: FormState = {
  title: "",
  description: "",
  deliveryPolicy: "",
  regularPrice: "",
  discountPrice: "",
  tags: [],

  metaTitle: "",
  slug: "",
  metaDescription: "",
  metaKeywords: "",

  stockQuantity: "",
  wholesalePrice: "",
  size: "",
  brand: "",
  measurement: "",
  color: "",

  specialFeatures: "",
  vehicleCondition: "",
  registration: "",
  fuelType: "",
  cc: "",
  transmission: "",
  vehicleColor: "",

  serviceDetailedDescription: "",
}

// ---------------- Helpers ----------------
const toId = (v: any) => (v && typeof v === "object" ? v._id : v) || ""

const toComma = (arr?: string[]) => (Array.isArray(arr) && arr.length ? arr.join(",") : "")

const splitComma = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)

const mainToTab = (main: string): ProductType => {
  const m = (main || "").toLowerCase()
  if (m === "vehicles") return "vehicles"
  if (m === "services") return "services"
  return "generalgoods"
}

const tabToMain = (tab: ProductType) => {
  if (tab === "vehicles") return "vehicles"
  if (tab === "services") return "services"
  return "general goods"
}

// ---------------- Component ----------------
export default function EditProductPage({ productId }: { productId?: string }) {
  const router = useRouter()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [product, setProduct] = useState<ProductFromApi | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [tagInput, setTagInput] = useState("")

  const [activeTab, setActiveTab] = useState<ProductType>("generalgoods")

  // categories
  const [categories, setCategories] = useState<CategoryDoc[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [childCategories, setChildCategories] = useState<ChildCategory[]>([])

  const [selectedMainId, setSelectedMainId] = useState("")
  const [selectedSubId, setSelectedSubId] = useState("")
  const [selectedChildId, setSelectedChildId] = useState("")

  // existing media
  const [existingMainImage, setExistingMainImage] = useState<string>("")
  const [existingGallery, setExistingGallery] = useState<string[]>([])
  const [existingVideoUrl, setExistingVideoUrl] = useState<string>("")

  // existing docs by type
  const [existingGoodsDocs, setExistingGoodsDocs] = useState<string[]>([])
  const [existingVehicleDocs, setExistingVehicleDocs] = useState<string[]>([])
  const [existingServiceDocs, setExistingServiceDocs] = useState<string[]>([])

  // new uploads
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null)

  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("")

  // ✅ general goods docs upload
  const [goodsDocFiles, setGoodsDocFiles] = useState<File[]>([])
  const [goodsDocNames, setGoodsDocNames] = useState<string[]>([])

  // (optional) if you also want vehicles/services doc upload:
  // const [vehicleDocFiles, setVehicleDocFiles] = useState<File[]>([])
  // const [vehicleDocNames, setVehicleDocNames] = useState<string[]>([])
  // const [serviceDocFiles, setServiceDocFiles] = useState<File[]>([])
  // const [serviceDocNames, setServiceDocNames] = useState<string[]>([])

  const mainImageInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const goodsDocsInputRef = useRef<HTMLInputElement | null>(null)

  // ---------------- Load product + categories ----------------
  useEffect(() => {
    const load = async () => {
      if (!productId) return
      try {
        setLoading(true)

        const [prodRes, catRes] = await Promise.all([
          productApi.getById(productId),
          categoryApi.getAll(1, 100),
        ])

        const fetched: ProductFromApi = prodRes.data?.data?.product || prodRes.data?.data
        setProduct(fetched)

        const cats: CategoryDoc[] = catRes.data?.data?.categories || []
        setCategories(cats)

        // set tab
        setActiveTab(mainToTab(fetched.mainCategory))

        // category chain ids
        const mainId = toId(fetched.category)
        const subId = toId(fetched.subCategory)
        const childId = toId(fetched.childCategory)

        setSelectedMainId(mainId)
        setSelectedSubId(subId)
        setSelectedChildId(childId)

        const mainCat = cats.find((c) => c._id === mainId)
        const subs = mainCat ? mainCat.subCategories : []
        setSubCategories(subs)

        const subCat = subs.find((s) => s._id === subId)
        const childs = subCat ? subCat.childCategories : []
        setChildCategories(childs)

        // existing media
        setExistingMainImage(fetched.mainImage || "")
        setExistingGallery(Array.isArray(fetched.imageGallery) ? fetched.imageGallery : [])
        setExistingVideoUrl(fetched.videoUrl || "")

        // existing docs
        setExistingGoodsDocs(fetched.generalGoods?.documents || [])
        setExistingVehicleDocs(fetched.vehicle?.documents || [])
        setExistingServiceDocs(fetched.service?.serviceDocuments || [])

        // form fill
        setForm({
          // common
          title: fetched.title || "",
          description: fetched.description || "",
          deliveryPolicy: fetched.deliveryAndReturnPolicy || "",
          regularPrice: String(fetched.price ?? ""),
          discountPrice: String(fetched.discountPrice ?? ""),
          tags: fetched.tags || [],

          // SEO
          metaTitle: fetched.seo?.metaTitle || "",
          slug: fetched.seo?.slug || "",
          metaDescription: fetched.seo?.metaDescription || "",
          metaKeywords: toComma(fetched.seo?.metaKeywords),

          // general goods
          stockQuantity: String(fetched.generalGoods?.stockQuantity ?? ""),
          wholesalePrice: String(fetched.generalGoods?.wholesalePrice ?? ""),
          size: fetched.generalGoods?.size || "",
          brand: fetched.generalGoods?.brand || "",
          measurement: fetched.generalGoods?.measurement || "",
          color: toComma(fetched.generalGoods?.color),

          // vehicles
          specialFeatures: fetched.vehicle?.specialFeatures || "",
          vehicleCondition: fetched.vehicle?.vehicleCondition || "",
          registration: fetched.vehicle?.registration || "",
          fuelType: fetched.vehicle?.fuelType || "",
          cc: fetched.vehicle?.cc || "",
          transmission: fetched.vehicle?.transmission || "",
          vehicleColor: toComma(fetched.vehicle?.color),

          // services
          serviceDetailedDescription: fetched.service?.detailedDescription || "",
        })

        // preview default
        setMainImagePreview(fetched.mainImage || null)
      } catch (error: any) {
        console.error(error)
        addToast({
          title: error?.response?.data?.message || "Failed to load product",
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [productId, addToast])

  // cleanup object urls
  useEffect(() => {
    return () => {
      if (mainImagePreview?.startsWith("blob:")) URL.revokeObjectURL(mainImagePreview)
      galleryPreviews.forEach((p) => p.startsWith("blob:") && URL.revokeObjectURL(p))
      if (videoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(videoPreviewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------- Derived categories for current tab ----------------
  const filteredCategories = useMemo(() => {
    const label = tabToMain(activeTab).toLowerCase()
    return categories.filter((c) => c.mainCategory.toLowerCase() === label)
  }, [categories, activeTab])

  // ---------------- Generic handlers ----------------
  const handleInput =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const handleMainChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedMainId(id)
    setSelectedSubId("")
    setSelectedChildId("")

    const main = categories.find((c) => c._id === id)
    const subs = main ? main.subCategories : []
    setSubCategories(subs)
    setChildCategories([])
  }

  const handleSubChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedSubId(id)
    setSelectedChildId("")

    const sub = subCategories.find((s) => s._id === id)
    const childs = sub ? sub.childCategories : []
    setChildCategories(childs)
  }

  const handleChildChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedChildId(e.target.value)
  }

  // tags
  const handleAddTag = () => {
    const value = tagInput.trim()
    if (!value) return
    if (form.tags.includes(value)) {
      setTagInput("")
      return
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, value] }))
    setTagInput("")
  }

  const handleRemoveTag = (i: number) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, idx) => idx !== i),
    }))
  }

  // main image
  const onMainImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMainImageFile(file)
    const url = URL.createObjectURL(file)
    setMainImagePreview(url)
  }

  // gallery
  const onGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const previews = files.map((f) => URL.createObjectURL(f))
    setGalleryFiles((prev) => [...prev, ...files])
    setGalleryPreviews((prev) => [...prev, ...previews])

    e.target.value = ""
  }

  const removeNewGallery = (idx: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== idx))
    setGalleryPreviews((prev) => {
      const toRemove = prev[idx]
      if (toRemove?.startsWith("blob:")) URL.revokeObjectURL(toRemove)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const removeExistingGallery = (idx: number) => {
    setExistingGallery((prev) => prev.filter((_, i) => i !== idx))
  }

  // video
  const onVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoPreviewUrl(url)
    e.target.value = ""
  }

  // ✅ General goods documents upload
  const onGoodsDocumentsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setGoodsDocFiles((prev) => {
      const map = new Map(prev.map((f) => [`${f.name}-${f.size}`, f]))
      files.forEach((f) => map.set(`${f.name}-${f.size}`, f))
      return Array.from(map.values())
    })

    setGoodsDocNames((prev) => {
      const map = new Map(prev.map((n) => [n, true]))
      files.forEach((f) => map.set(f.name, true))
      return Array.from(map.keys())
    })

    e.target.value = ""
  }

  const removeNewGoodsDoc = (idx: number) => {
    setGoodsDocFiles((prev) => prev.filter((_, i) => i !== idx))
    setGoodsDocNames((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeExistingGoodsDoc = (idx: number) => {
    setExistingGoodsDocs((prev) => prev.filter((_, i) => i !== idx))
  }
  const removeExistingVehicleDoc = (idx: number) => {
    setExistingVehicleDocs((prev) => prev.filter((_, i) => i !== idx))
  }
  const removeExistingServiceDoc = (idx: number) => {
    setExistingServiceDocs((prev) => prev.filter((_, i) => i !== idx))
  }

  // ---------------- Submit update ----------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!productId || !product) return

    if (!form.title || !selectedMainId || !selectedSubId || !selectedChildId) {
      addToast({
        title: "Title, Category, Sub Category and Child Category are required",
        type: "error",
      })
      return
    }

    try {
      setSaving(true)

      const fd = new FormData()

      // store
      if (product.store?._id) fd.append("store", product.store._id)

      // common
      fd.append("title", form.title)
      fd.append("description", form.description)
      fd.append("deliveryAndReturnPolicy", form.deliveryPolicy)

      fd.append("mainCategory", tabToMain(activeTab))
      fd.append("category", selectedMainId)
      fd.append("subCategory", selectedSubId)
      fd.append("childCategory", selectedChildId)

      fd.append("price", form.regularPrice || "0")
      fd.append("discountPrice", form.discountPrice || "0")

      if (form.tags.length) fd.append("tags", form.tags.join(","))

      // ✅ SEO as JSON string (FormData)
      const seoPayload: SeoPayload = {
        metaTitle: form.metaTitle || undefined,
        slug: form.slug || undefined,
        metaDescription: form.metaDescription || undefined,
        metaKeywords: form.metaKeywords ? splitComma(form.metaKeywords) : [],
      }
      fd.append("seo", JSON.stringify(seoPayload))

      // General goods fields
      if (activeTab === "generalgoods") {
        fd.append("stockQuantity", form.stockQuantity || "0")
        fd.append("wholesalePrice", form.wholesalePrice || "0")
        fd.append("size", form.size || "")
        fd.append("brand", form.brand || "")
        fd.append("measurement", form.measurement || "")
        fd.append("color", form.color || "")
      }

      // Vehicles fields
      if (activeTab === "vehicles") {
        fd.append("specialFeatures", form.specialFeatures || "")
        fd.append("vehicleCondition", form.vehicleCondition || "")
        fd.append("registration", form.registration || "")
        fd.append("fuelType", form.fuelType || "")
        fd.append("cc", form.cc || "")
        fd.append("transmission", form.transmission || "")
        fd.append("color", form.vehicleColor || "")
      }

      // Services fields
      if (activeTab === "services") {
        fd.append("detailedDescription", form.serviceDetailedDescription || "")
      }

      // media (only if new chosen)
      if (mainImageFile) fd.append("mainImage", mainImageFile)

      // gallery
      galleryFiles.forEach((f) => fd.append("imageGallery", f))

      // video
      if (videoFile) fd.append("video", videoFile)

      // ✅ goods documents (multer field: documents)
      goodsDocFiles.forEach((f) => fd.append("documents", f))

      // ✅ tell backend what to keep (backend must merge)
      fd.append("existingImageGallery", JSON.stringify(existingGallery))
      fd.append("existingGoodsDocs", JSON.stringify(existingGoodsDocs))
      fd.append("existingVehicleDocs", JSON.stringify(existingVehicleDocs))
      fd.append("existingServiceDocs", JSON.stringify(existingServiceDocs))

      await productApi.update(productId, fd)

      addToast({ title: "Product updated successfully", type: "success" })
      router.push("/dashboard/products")
    } catch (error: any) {
      console.error(error)
      addToast({
        title: error?.response?.data?.message || "Failed to update product",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  // ---------------- Render ----------------
  if (loading || !product) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <p>Loading product...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Product – {product.title}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {[
          { id: "generalgoods", label: "General Goods" },
          { id: "vehicles", label: "Vehicles" },
          { id: "services", label: "Services" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as ProductType)}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input value={form.title} onChange={handleInput("title")} placeholder="Enter product title" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Detailed Description</label>
                <Textarea rows={4} value={form.description} onChange={handleInput("description")} />
              </div>

              {/* Delivery */}
              <div>
                <label className="block text-sm font-medium mb-1">Delivery & Return Policy</label>
                <Textarea rows={3} value={form.deliveryPolicy} onChange={handleInput("deliveryPolicy")} />
              </div>

              {/* Category selects */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category (Main)</label>
                  <select
                    value={selectedMainId}
                    onChange={handleMainChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Category</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.mainCategory}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sub Category</label>
                  <select
                    value={selectedSubId}
                    onChange={handleSubChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!selectedMainId}
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Child Category</label>
                  <select
                    value={selectedChildId}
                    onChange={handleChildChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!selectedSubId}
                  >
                    <option value="">Select Child Category</option>
                    {childCategories.map((child) => (
                      <option key={child._id} value={child._id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Regular Price</label>
                  <Input type="number" value={form.regularPrice} onChange={handleInput("regularPrice")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Price</label>
                  <Input type="number" value={form.discountPrice} onChange={handleInput("discountPrice")} />
                </div>
              </div>

              {/* SEO */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-3">SEO</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Meta Title</label>
                    <Input value={form.metaTitle} onChange={handleInput("metaTitle")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <Input value={form.slug} onChange={handleInput("slug")} placeholder="optional" />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Meta Description</label>
                  <Textarea rows={2} value={form.metaDescription} onChange={handleInput("metaDescription")} />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Meta Keywords (comma separated)</label>
                  <Input value={form.metaKeywords} onChange={handleInput("metaKeywords")} placeholder="keyword1, keyword2" />
                </div>
              </div>

              {/* TAB SPECIFIC */}
              {activeTab === "generalgoods" && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="font-semibold">General Goods</div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                    <Input type="number" value={form.stockQuantity} onChange={handleInput("stockQuantity")} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Wholesale Price</label>
                      <Input type="number" value={form.wholesalePrice} onChange={handleInput("wholesalePrice")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Size</label>
                      <Input value={form.size} onChange={handleInput("size")} placeholder="Small / Medium / Large" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Brand</label>
                      <Input value={form.brand} onChange={handleInput("brand")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Measurement</label>
                      <Input value={form.measurement} onChange={handleInput("measurement")} placeholder="optional" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Color (comma separated)</label>
                    <Input value={form.color} onChange={handleInput("color")} placeholder="red, black" />
                  </div>

                  {/* ✅ Documents: Existing + Upload */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Documents</div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => goodsDocsInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </Button>

                      <input
                        ref={goodsDocsInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        multiple
                        className="hidden"
                        onChange={onGoodsDocumentsChange}
                      />
                    </div>

                    {/* Existing documents */}
                    {existingGoodsDocs.length ? (
                      <div className="space-y-2">
                        {existingGoodsDocs.map((url, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 border rounded-md p-2"
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline break-all text-sm"
                            >
                              {url}
                            </a>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeExistingGoodsDoc(idx)}
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No existing documents</p>
                    )}

                    {/* Newly selected documents */}
                    {goodsDocNames.length ? (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-600 mb-2">
                          New uploads
                        </div>
                        <div className="space-y-2">
                          {goodsDocNames.map((name, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 border rounded-md p-2 bg-gray-50"
                            >
                              <span className="text-sm break-all">{name}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeNewGoodsDoc(idx)}
                                title="Remove selected"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {activeTab === "vehicles" && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="font-semibold">Vehicle</div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Special Features</label>
                    <Input value={form.specialFeatures} onChange={handleInput("specialFeatures")} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Vehicle Condition</label>
                      <select
                        value={form.vehicleCondition}
                        onChange={(e) => setForm((p) => ({ ...p, vehicleCondition: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="new">new</option>
                        <option value="used">used</option>
                        <option value="refurbished">refurbished</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Registration</label>
                      <select
                        value={form.registration}
                        onChange={(e) => setForm((p) => ({ ...p, registration: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="registered">registered</option>
                        <option value="unregistered">unregistered</option>
                        <option value="not_applicable">not_applicable</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Fuel Type</label>
                      <Input value={form.fuelType} onChange={handleInput("fuelType")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">CC</label>
                      <Input value={form.cc} onChange={handleInput("cc")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Transmission</label>
                      <Input value={form.transmission} onChange={handleInput("transmission")} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Color (comma separated)</label>
                    <Input value={form.vehicleColor} onChange={handleInput("vehicleColor")} placeholder="white, black" />
                  </div>

                  {/* Existing vehicle docs (view/remove) */}
                  <div>
                    <div className="text-sm font-medium mb-2">Existing Documents</div>
                    {existingVehicleDocs.length ? (
                      <div className="space-y-2">
                        {existingVehicleDocs.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 border rounded-md p-2">
                            <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all text-sm">
                              {url}
                            </a>
                            <Button type="button" variant="outline" size="sm" onClick={() => removeExistingVehicleDoc(idx)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No documents</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "services" && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="font-semibold">Service</div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Detailed Description</label>
                    <Textarea rows={4} value={form.serviceDetailedDescription} onChange={handleInput("serviceDetailedDescription")} />
                  </div>

                  {/* Existing service docs */}
                  <div>
                    <div className="text-sm font-medium mb-2">Existing Documents</div>
                    {existingServiceDocs.length ? (
                      <div className="space-y-2">
                        {existingServiceDocs.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 border rounded-md p-2">
                            <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all text-sm">
                              {url}
                            </a>
                            <Button type="button" variant="outline" size="sm" onClick={() => removeExistingServiceDoc(idx)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No documents</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag" />
                <Button type="button" onClick={handleAddTag} className="bg-blue-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-2">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(i)} className="hover:text-red-600">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Main image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Main Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="w-full h-48 relative rounded-lg overflow-hidden bg-gray-50 border">
                {mainImagePreview ? (
                  <Image src={mainImagePreview} alt="Preview" fill className="object-cover" />
                ) : existingMainImage ? (
                  <Image src={existingMainImage} alt="Existing" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
                )}
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={() => mainImageInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload New Main Image
              </Button>

              <input ref={mainImageInputRef} type="file" accept="image/*" className="hidden" onChange={onMainImageChange} />
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Image Gallery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {existingGallery.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {existingGallery.map((src, idx) => (
                    <div key={idx} className="relative h-24 rounded-md overflow-hidden border">
                      <Image src={src} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
                      <button type="button" onClick={() => removeExistingGallery(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No existing gallery images</p>
              )}

              {galleryPreviews.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {galleryPreviews.map((src, idx) => (
                    <div key={idx} className="relative h-24 rounded-md overflow-hidden border">
                      <Image src={src} alt={`New ${idx + 1}`} fill className="object-cover" />
                      <button type="button" onClick={() => removeNewGallery(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <Button type="button" variant="outline" className="w-full" onClick={() => galleryInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Add Gallery Images
              </Button>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onGalleryChange} />
            </CardContent>
          </Card>

          {/* Video */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {videoPreviewUrl ? (
                <video className="w-full rounded-md border" controls src={videoPreviewUrl} />
              ) : existingVideoUrl ? (
                <video className="w-full rounded-md border" controls src={existingVideoUrl} />
              ) : (
                <p className="text-sm text-gray-500">No video</p>
              )}

              <Button type="button" variant="outline" className="w-full" onClick={() => videoInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>

              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={onVideoChange} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom buttons */}
        <div className="lg:col-span-3 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-blue-600">
            {saving ? "Saving..." : "Update Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}

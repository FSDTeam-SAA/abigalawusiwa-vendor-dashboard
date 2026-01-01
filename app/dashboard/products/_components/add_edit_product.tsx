"use client"

import React, { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload, FileText, Image as ImageIcon, Video } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/toast-provider"
import { productApi, categoryApi } from "@/lib/api"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { useRouter } from "next/navigation"

type ProductType = "generalgoods" | "vehicles" | "services"

interface ProductFormData {
  title: string
  briefDescription: string
  description: string
  deliveryPolicy: string

  // category chain
  categoryId: string
  subCategoryId: string
  childCategory: string // id of child category

  regularPrice: string
  discountPrice: string
  tags: string[]

  stockQuantity?: string
  wholesalePrice?: string
  size?: string
  brands?: string
  colour?: string

  vehicleCondition?: string
  registration?: string
  specialFeatures?: string
  fuelType?: string
  cc?: string
  transmission?: string

  serviceFeatures?: string
}

const initialFormData: ProductFormData = {
  title: "",
  briefDescription: "",
  description: "",
  deliveryPolicy: "",

  categoryId: "",
  subCategoryId: "",
  childCategory: "",

  regularPrice: "",
  discountPrice: "",
  tags: [],

  stockQuantity: "",
  wholesalePrice: "",
  size: "",
  brands: "",
  colour: "",

  vehicleCondition: "",
  registration: "",
  specialFeatures: "",
  fuelType: "",
  cc: "",
  transmission: "",

  serviceFeatures: "",
}

// ---- Category types -------
interface ChildCategory {
  _id: string
  name: string
  thumbnail?: string
}

interface SubCategory {
  _id: string
  name: string
  thumbnail?: string
  childCategories: ChildCategory[]
}

interface Category {
  _id: string
  mainCategory: string
  mainCategoryImage?: string
  subCategories: SubCategory[]
}

export default function AddEditProductPage({ productId }: { productId?: string }) {
  const [activeTab, setActiveTab] = useState<ProductType>("generalgoods")
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const { addToast } = useToast()
  const router = useRouter()
  const { data: session } = useSession()

  const isEditing = !!productId
  const storeId = (session?.user as any)?.storeId

  // categories from API
  const [categories, setCategories] = useState<Category[]>([])

  // ─────────────────────────────
  // File states (MATCH BACKEND)
  // ─────────────────────────────

  // main image upload (mainImage)
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  // gallery upload (imageGallery)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  // video upload (video)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

  // documents upload (documents)
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  const documentsInputRef = useRef<HTMLInputElement | null>(null)

  // ─────────────────────────────
  // Helpers: mapping mainCategory <-> tab
  // ─────────────────────────────
  const tabToMainCategory = (tab: ProductType) => {
    if (tab === "vehicles") return "vehicles"
    if (tab === "services") return "services"
    return "general goods"
  }

  const mainCategoryToTab = (main: string): ProductType => {
    const m = (main || "").toLowerCase()
    if (m === "vehicles") return "vehicles"
    if (m === "services") return "services"
    return "generalgoods"
  }

  // ─────────────────────────────
  // Cleanup object URLs
  // ─────────────────────────────
  useEffect(() => {
    return () => {
      if (mainImagePreview?.startsWith("blob:")) URL.revokeObjectURL(mainImagePreview)
      galleryPreviews.forEach((p) => p.startsWith("blob:") && URL.revokeObjectURL(p))
      if (videoPreview?.startsWith("blob:")) URL.revokeObjectURL(videoPreview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─────────────────────────────
  // Load categories
  // ─────────────────────────────
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryApi.getAll(1, 50)
        const cats: Category[] = res.data?.data?.categories || []
        setCategories(cats)
      } catch {
        addToast({ title: "Failed to load categories", type: "error" })
      }
    }
    loadCategories()
  }, [addToast])

  // ─────────────────────────────
  // Load product if editing
  // ─────────────────────────────
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setLoading(false)
        return
      }

      try {
        const res = await productApi.getById(productId)
        const p = res.data?.data

        setFormData((prev) => ({
          ...prev,
          title: p?.title || "",
          briefDescription: p?.briefDescription || "",
          description: p?.description || "",
          deliveryPolicy: p?.deliveryAndReturnPolicy || "",

          categoryId: p?.category?._id || "",
          subCategoryId: p?.subCategory?._id || "",
          childCategory: p?.childCategory?._id || "",

          regularPrice: String(p?.price ?? ""),
          discountPrice: String(p?.discountPrice ?? ""),
          tags: p?.tags || [],

          stockQuantity: p?.generalGoods?.stockQuantity || "",
          wholesalePrice: p?.generalGoods?.wholesalePrice || "",
          size: p?.generalGoods?.size || "",
          brands: p?.generalGoods?.brand || "",
          colour: p?.generalGoods?.color?.[0] || "",

          vehicleCondition: p?.vehicleCondition || "",
          registration: p?.registration || "",
          specialFeatures: p?.specialFeatures || "",
          fuelType: p?.fuelType || "",
          cc: p?.cc || "",
          transmission: p?.transmission || "",

          serviceFeatures: p?.serviceFeatures || "",
        }))

        if (p?.mainCategory) setActiveTab(mainCategoryToTab(p.mainCategory))

        // existing main image preview (URL from backend)
        if (p?.mainImage || p?.photo) setMainImagePreview(p?.mainImage || p?.photo)

        // NOTE:
        // If your API returns gallery/video/doc URLs, you can set previews here too.
        // We do NOT set Files here because you can’t re-upload URLs as Files without fetching blobs.

        setLoading(false)
      } catch (err) {
        console.error(err)
        addToast({ title: "Failed to load product", type: "error" })
        setLoading(false)
      }
    }

    loadProduct()
  }, [productId, addToast])

  // ─────────────────────────────
  // Derived category options for current tab
  // ─────────────────────────────
  const currentMainCategoryLabel = tabToMainCategory(activeTab)

  const filteredCategories = categories.filter(
    (c) => c.mainCategory.toLowerCase() === currentMainCategoryLabel.toLowerCase(),
  )

  const selectedCategory = filteredCategories.find((c) => c._id === formData.categoryId)
  const subCategoryOptions: SubCategory[] = selectedCategory?.subCategories || []

  const selectedSubCategory = subCategoryOptions.find((s) => s._id === formData.subCategoryId)
  const childCategoryOptions: ChildCategory[] = selectedSubCategory?.childCategories || []

  // ─────────────────────────────
  // Tags
  // ─────────────────────────────
  const handleAddTag = () => {
    const t = tagInput.trim()
    if (!t) return
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, t] }))
    setTagInput("")
  }

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }))
  }

  // ─────────────────────────────
  // File handlers (MATCH BACKEND FIELD NAMES)
  // ─────────────────────────────
  const handleMainImageClick = () => photoInputRef.current?.click()
  const handleGalleryClick = () => galleryInputRef.current?.click()
  const handleVideoClick = () => videoInputRef.current?.click()
  const handleDocumentsClick = () => documentsInputRef.current?.click()

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMainImageFile(file)
    setMainImagePreview(URL.createObjectURL(file))
  }

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const next = files.slice(0, 10) // max 10
    setGalleryFiles(next)
    setGalleryPreviews(next.map((f) => URL.createObjectURL(f)))
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setDocumentFiles(files.slice(0, 5)) // max 5
  }

  // ─────────────────────────────
  // Submit Form → create / update
  // ─────────────────────────────
  const handleConfirm = async () => {
    if (!formData.title || !formData.childCategory || !formData.subCategoryId || !formData.categoryId) {
      addToast({ title: "Please fill in all required fields", type: "error" })
      return
    }

    if (!storeId) {
      addToast({ title: "Store ID is missing. Please re-login.", type: "error" })
      return
    }

    try {
      setSubmitting(true)

      const fd = new FormData()

      // core product info
      fd.append("store", storeId)
      fd.append("title", formData.title)
      fd.append("briefDescription", formData.briefDescription || "")
      fd.append("description", formData.description)
      fd.append("deliveryAndReturnPolicy", formData.deliveryPolicy)

      // category chain
      fd.append("category", formData.categoryId)
      fd.append("subCategory", formData.subCategoryId)
      fd.append("childCategory", formData.childCategory)

      const mainCategoryStr = tabToMainCategory(activeTab)
      fd.append("mainCategory", mainCategoryStr)

      // pricing
      fd.append("price", formData.regularPrice || "0")
      fd.append("discountPrice", formData.discountPrice || "0")

      // general goods extras (only if relevant)
      fd.append("stockQuantity", formData.stockQuantity || "")
      fd.append("wholesalePrice", formData.wholesalePrice || "")
      fd.append("size", formData.size || "")
      fd.append("brand", formData.brands || "")
      fd.append("measurement", "") // optional
      fd.append("color", formData.colour || "")

      // vehicle / service extras
      if (activeTab === "vehicles") {
        fd.append("vehicleCondition", formData.vehicleCondition || "")
        fd.append("registration", formData.registration || "")
        fd.append("specialFeatures", formData.specialFeatures || "")
        fd.append("fuelType", formData.fuelType || "")
        fd.append("cc", formData.cc || "")
        fd.append("transmission", formData.transmission || "")
      } else if (activeTab === "services") {
        fd.append("serviceFeatures", formData.serviceFeatures || "")
      }

      // tags (comma-separated)
      if (formData.tags.length) fd.append("tags", formData.tags.join(","))

      // ─────────────────────────────
      // FILES (MATCH BACKEND MULTER)
      // ─────────────────────────────
      if (mainImageFile) fd.append("mainImage", mainImageFile)

      galleryFiles.forEach((f) => fd.append("imageGallery", f))
      if (videoFile) fd.append("video", videoFile)
      documentFiles.forEach((f) => fd.append("documents", f))

      if (isEditing) {
        await productApi.update(productId!, fd)
        addToast({ title: "Product updated successfully", type: "success" })
        router.push("/dashboard/products")
      } else {
        await productApi.create(fd)
        addToast({ title: "Product created successfully", type: "success" })
        router.push("/dashboard/products")
      }
    } catch (e) {
      console.error(e)
      addToast({ title: "Something went wrong", type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────
  // Field groups
  // ─────────────────────────────
  const renderCommonFields = () => (
    <>
      <div>
        <label className="block text-sm font-medium mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter product title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Detailed Description</label>
        <textarea
          rows={4}
          className="w-full px-3 py-2 border rounded-lg"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Brief Description</label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border rounded-lg"
          value={formData.briefDescription}
          onChange={(e) => setFormData({ ...formData, briefDescription: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Delivery &amp; Return Policy</label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border rounded-lg"
          value={formData.deliveryPolicy}
          onChange={(e) => setFormData({ ...formData, deliveryPolicy: e.target.value })}
        />
      </div>

      {/* Category Chain Selects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) =>
              setFormData({
                ...formData,
                categoryId: e.target.value,
                subCategoryId: "",
                childCategory: "",
              })
            }
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

        {/* Subcategory */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Subcategory <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.subCategoryId}
            onChange={(e) =>
              setFormData({
                ...formData,
                subCategoryId: e.target.value,
                childCategory: "",
              })
            }
            className="w-full px-3 py-2 border rounded-lg"
            disabled={!formData.categoryId}
          >
            <option value="">Select Subcategory</option>
            {subCategoryOptions.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Child category */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Child Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.childCategory}
            onChange={(e) => setFormData({ ...formData, childCategory: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={!formData.subCategoryId}
          >
            <option value="">Select Child Category</option>
            {childCategoryOptions.map((child) => (
              <option key={child._id} value={child._id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Regular Price</label>
          <Input
            type="number"
            value={formData.regularPrice}
            onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Discount Price</label>
          <Input
            type="number"
            value={formData.discountPrice}
            onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
          />
        </div>
      </div>
    </>
  )

  const renderGeneralGoodsFields = () => (
    <>
      {renderCommonFields()}

      <div>
        <label className="block text-sm font-medium mb-2">Stock Quantity</label>
        <Input
          type="number"
          value={formData.stockQuantity}
          onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Wholesale Price</label>
          <Input
            type="number"
            value={formData.wholesalePrice}
            onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Size</label>
          <select
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select Size</option>
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
            <option>XL</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Brand</label>
          <Input
            value={formData.brands}
            onChange={(e) => setFormData({ ...formData, brands: e.target.value })}
            placeholder="Adidas"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <Input
            value={formData.colour}
            onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
            placeholder="red,black"
          />
        </div>
      </div>
    </>
  )

  const renderVehiclesFields = () => (
    <>
      {renderCommonFields()}

      <div>
        <label className="block text-sm font-medium mb-2">Special Features</label>
        <Input
          value={formData.specialFeatures}
          onChange={(e) => setFormData({ ...formData, specialFeatures: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Vehicle Condition</label>
          <select
            value={formData.vehicleCondition}
            onChange={(e) => setFormData({ ...formData, vehicleCondition: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select</option>
            <option>new</option>
            <option>used</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Registration</label>
          <select
            value={formData.registration}
            onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select</option>
            <option>registered</option>
            <option>unregistered</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Fuel Type</label>
          <Input value={formData.fuelType} onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">CC</label>
          <Input value={formData.cc} onChange={(e) => setFormData({ ...formData, cc: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Transmission</label>
          <Input
            value={formData.transmission}
            onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
          />
        </div>
      </div>
    </>
  )

  const renderServicesFields = () => (
    <>
      {renderCommonFields()}
      <div>
        <label className="block text-sm font-medium mb-2">Service Features</label>
        <Input
          value={formData.serviceFeatures}
          onChange={(e) => setFormData({ ...formData, serviceFeatures: e.target.value })}
        />
      </div>
    </>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "vehicles":
        return renderVehiclesFields()
      case "services":
        return renderServicesFields()
      default:
        return renderGeneralGoodsFields()
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-3xl font-bold">{isEditing ? "Edit Product" : "Add New Product"}</h1>
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
            onClick={() => setActiveTab(tab.id as ProductType)}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">{renderTabContent()}</CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>

                <div className="flex gap-2 mb-3">
                  <Input placeholder="Tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
                  <Button onClick={handleAddTag} className="bg-blue-600">
                    +
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="text-blue-800 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UPLOADS RIGHT */}
        <div className="space-y-6">
          {/* MAIN IMAGE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Main Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center flex flex-col items-center gap-3 cursor-pointer"
                onClick={handleMainImageClick}
              >
                {mainImagePreview ? (
                  <div className="w-full h-40 relative mb-2">
                    <Image src={mainImagePreview} alt="Product" fill className="object-cover rounded-md" />
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Drag &amp; drop or click to upload</p>
                  </>
                )}

                <Button className="mt-2 bg-blue-600" type="button">
                  {mainImagePreview ? "Change Image" : "Upload Image"}
                </Button>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMainImageChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* GALLERY */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Image Gallery (max 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer"
                onClick={handleGalleryClick}
              >
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Upload className="w-5 h-5 text-blue-400" />
                  <span>Click to upload gallery images</span>
                </div>

                {galleryPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {galleryPreviews.map((src, idx) => (
                      <div key={idx} className="relative w-full h-20">
                        <Image src={src} alt={`Gallery ${idx}`} fill className="object-cover rounded-md" />
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* VIDEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="w-4 h-4" /> Video (1)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer"
                onClick={handleVideoClick}
              >
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Upload className="w-5 h-5 text-blue-400" />
                  <span>Click to upload video</span>
                </div>

                {videoPreview && (
                  <video className="w-full mt-4 rounded-md" controls src={videoPreview} />
                )}

                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
              </div>
            </CardContent>
          </Card>

          {/* DOCUMENTS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documents (max 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer"
                onClick={handleDocumentsClick}
              >
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Upload className="w-5 h-5 text-blue-400" />
                  <span>Click to upload documents</span>
                </div>

                {documentFiles.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm">
                    {documentFiles.map((f, idx) => (
                      <li key={idx} className="flex items-center justify-between border rounded-md px-2 py-1">
                        <span className="truncate">{f.name}</span>
                        <span className="text-gray-500">{Math.round(f.size / 1024)} KB</span>
                      </li>
                    ))}
                  </ul>
                )}

                <input
                  ref={documentsInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleDocumentsChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4">
        <Link href="/dashboard/products">
          <Button variant="outline" className="border-red-500 text-red-500">
            Cancel
          </Button>
        </Link>

        <Button onClick={handleConfirm} className="bg-blue-600" disabled={submitting}>
          {submitting ? "Saving..." : "Confirm"}
        </Button>
      </div>
    </div>
  )
}

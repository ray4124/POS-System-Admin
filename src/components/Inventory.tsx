import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Edit, AlertTriangle, Filter, Trash2, PackagePlus, PowerOff, Power } from 'lucide-react'
import { clsx } from 'clsx'
import { 
  getProducts,
  Product,
  createProduct,
  updateProduct,
  stockProduct,
  statusProduct,
  deleteProduct,
} from '../api/productAPI'
import {
  Branch,
  getBranches,
  Brand,
  getBrands,
  BranchBrand,
  getBranchBrands,
} from '../api/staticAPI'

type ConfirmModalType = "status" | "delete" | "restock" | null;

interface ConfirmModalState {
  type: ConfirmModalType;
  product: Product | null;
}

interface ConfirmModalProps {
  modal: ConfirmModalState;
  onCancel: () => void;
  onConfirm: (type: ConfirmModalType, product: Product, restockAmount?: number) => void;
}

export function Inventory() {
  // states for API data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [branchBrand, setBranchBrand] = useState<BranchBrand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // State management for page functionality
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(0);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    type: "status" | "delete" | "restock" | null;
    product: Product | null;
  }>({ type: null, product: null });
  const [restockAmount, setRestockAmount] = useState<number>(0);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [branchesRes, brandsRes, branchBrandsRes, productsRes] = await Promise.all([
        getBranches(),
        getBrands(),
        getBranchBrands(),
        getProducts()
      ]);

      setBranches(branchesRes);
      setBrands(brandsRes);
      setBranchBrand(branchBrandsRes);

      // enrich products with branch_id & brand_id
      const enriched = productsRes.map(p => {
        const relation = branchBrandsRes.find(bb => bb.id === p.branch_brand_id);
        return {
          ...p,
          branch_id: relation?.branch_id,
          brand_id: relation?.brand_id,
          isLowStock: p.stock < p.alert_at,
        };
      });

      setProducts(enriched);
    }

    loadData();
  }, [confirmModal, showProductModal, editingProduct]);

  const lowStockList = useMemo(() => {
    return products
      .filter(p => p.stock <= p.alert_at) // low stock condition
      .sort((a, b) => a.stock - b.stock) // sort by stock ascending
      .map(p => {
        // find relation row
        const relation = branchBrand.find(bb => bb.id === p.branch_brand_id);

        const branch = branches.find(b => b.id === relation?.branch_id)?.branch_name || 'Unknown Branch';
        const brand = brands.find(br => br.id === relation?.brand_id)?.brand_name || 'Unknown Brand';

        return `${branch} - ${brand}: low stock of ${p.product_name} remaining ${p.stock}`;
      });
  }, [products, branches, brands, branchBrand, confirmModal]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // 🔹 Filter by branch-brand
    if (filter !== 0) {
      result = result.filter((p) => p.branch_brand_id === filter);
    }

    // 🔹 Search by product name
    if (search.trim() !== "") {
      const term = search.toLowerCase();
      result = result.filter((p) =>
        p.product_name.toLowerCase().includes(term)
      );
    }

    // 🔹 Sort by stock ascending
    return result.sort((a, b) => {
      if (a.branch_brand_id === b.branch_brand_id) {
        return a.product_name.localeCompare(b.product_name); // sort by name if same branch_brand_id
      }
      return a.branch_brand_id - b.branch_brand_id; // sort by branch_brand_id first
    });
  }, [products, filter, search, confirmModal]);


  // 🔹 Handle Product Creation and Editing
  const ProductModal = ({
    product,
    onClose,
    onSave,
    products,
    branchBrands, // <-- pass this from parent
  }: {
    product: Product | null;
    onClose: () => void;
    onSave: (formData: FormData) => void;
    products: Product[];
    branchBrands: { id: number; name: string }[]; // <-- adjust to your table fields
  }) => {
    const [form, setForm] = useState({
      bbID: product?.branch_brand_id || "",
      name: product?.product_name || "",
      category: product?.category || "",
      price: product?.price || "",
      stock: product?.stock || "",
      alert: product?.alert_at || "",
      isActive: product?.is_active ?? true,
      picture: null as File | null,
    });

    const [useCustomCategory, setUseCustomCategory] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const categories = useMemo(
      () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
      [products]
    );

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;
      if (type === "checkbox") {
        const target = e.target as HTMLInputElement;
        setForm({ ...form, [name]: target.checked });
      } else {
        setForm({ ...form, [name]: value });
      }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setForm({ ...form, picture: file });
      if (file) {
        setPreviewImage(URL.createObjectURL(file));
      }
    };

    const handleSubmit = () => {
      if (!form.bbID) {
        alert("Please select a Branch/Brand before saving.");
        return;
      }

      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null) data.append(key, value as any);
      });
      if (product) {
        data.append("id", String(product.id));
      }
      onSave(data);
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold mb-4">
            {product ? "Edit Product" : "Add Product"}
          </h2>

          <div className="space-y-3">
            {/* 🔹 Branch/Brand Selector */}
            <div>
              <label className="block text-sm">Branch / Brand</label>
              <select
                name="bbID"
                value={form.bbID}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="">Select Branch/Brand</option>
                {branchBrands.map((bb) => (
                  <option key={bb.id} value={bb.id}>
                    {bb.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔹 Product Name */}
            <div>
              <label className="block text-sm">Product Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            {/* 🔹 Category */}
            <div>
              <label className="block text-sm">Category</label>
              {!useCustomCategory ? (
                <select
                  name="category"
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === "__other__") {
                      setUseCustomCategory(true);
                      setForm({ ...form, category: "" });
                    } else {
                      handleChange(e);
                    }
                  }}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__other__">Other...</option>
                </select>
              ) : (
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  placeholder="Enter new category"
                />
              )}
            </div>

            {/* 🔹 Price + Active toggle */}
            <div className="flex gap-3">
              {/* Price (3/4 width) */}
              <div className="w-3/4">
                <label className="block text-sm">Price</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Status (1/4 width, only show if product exists) */}
              {product && (
                <div className="w-1/4 flex flex-col justify-center">
                  <label className="block text-sm">Status</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                    />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              )}
            </div>

            {/* 🔹 Stock + Alert */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm">Alert At</label>
                <input
                  type="number"
                  name="alert"
                  value={form.alert}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>

            {/* 🔹 Picture */}
            <div>
              <label className="block text-sm">Picture</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {(previewImage || product?.picture) && (
                <img
                  src={previewImage || `http://localhost:5000/product_image/${product?.picture}`}
                  alt="Preview"
                  className="w-32 h-32 mt-2 object-cover rounded"
                />
              )}
            </div>
          </div>

          {/* 🔹 Footer buttons */}
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-brown-600 text-white rounded"
            >
              {product ? (loading ? "Updating" : "Update") : (loading ? "Saving..." : "Save")}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Handle Product Stock Change, Status Change and Delete

  const ConfirmModal: React.FC<ConfirmModalProps> = ({ modal, onCancel, onConfirm }) => {
    if (!modal.type || !modal.product) return null;

    const { type, product } = modal;

    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
        onClick={onCancel}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold text-gray-800">
            {type === "delete" && "Removing Product"}
            {type === "status" && "Status Change"}
            {type === "restock" && `Restocking "${product.product_name}"`}
          </h2>

          {type === "delete" && (
            <p className="mt-2 text-gray-600">
              Do you want to remove <b>{product.product_name}</b> entirely?
            </p>
          )}

          {type === "status" && (
            <p className="mt-2 text-gray-600">
              {product.is_active
                ? "Do you want to stop selling "
                : "Do you want to start selling "}
              <b>{product.product_name}</b>?
            </p>
          )}

          {type === "restock" && (
            <div className="mt-4 space-y-3">
              <p className="text-gray-600">
                Current Stock: <b>{product.stock}</b>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Adding to Stock
                </label>
                <input
                  type="number"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={restockAmount}
                  min={0}
                  onChange={(e) => setRestockAmount(Number(e.target.value))}
                />
              </div>
              <p className="text-gray-600">
                Total Stock:{" "}
                <b>{product.stock + (restockAmount || 0)}</b>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              className="px-4 py-2 rounded-md border"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-red-600 text-white"
              onClick={() => {
                onConfirm(type, product, restockAmount);
                setRestockAmount(0); // reset after confirm
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Inventory Management</h1>
          <p className="text-brown-600">Manage your product inventory and stock levels</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockList.length !== 0 && (
        <div className="bg-error/10 border border-error/20 p-4 rounded-xl animate-pulse-soft">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-error" />
            <div>
              <h3 className="font-semibold text-error">Low Stock Alert</h3>
              {lowStockList.map((item, index) => (
                <p key={index} className="text-error/80 text-sm">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      )} 

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="relative flex-1 col-span-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {setSearch(e.target.value)}}
            className="w-full pl-10 pr-4 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            onClick={() => setSearch('')}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-brown-600" />
          <select
            value={filter}
            onChange={(e) => {setFilter(Number(e.target.value))}}
            className="flex-1 px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value={0}>All Products</option>
            {branchBrand.map((bb) => {
              const branchName =
                branches.find((b) => b.id === bb.branch_id)?.branch_name ||
                `Branch ${bb.branch_id}`;
              const brandName =
                brands.find((br) => br.id === bb.brand_id)?.brand_name ||
                `Brand ${bb.brand_id}`;
              return (
                <option key={bb.id} value={bb.id}>
                  {branchName} - {brandName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-brown-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brown-50 border-b border-brown-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Category</th>
                {filter === 0 && (
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Branch and Brand</th>
                )}
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Cost</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-brown-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const bb = branchBrand.find((bb) => bb.id === p.branch_brand_id);

                const branchName =
                  branches.find((b) => b.id === bb?.branch_id)?.branch_name ||
                  `Branch ${bb?.branch_id}`;
                const brandName =
                  brands.find((br) => br.id === bb?.brand_id)?.brand_name ||
                  `Brand ${bb?.brand_id}`;
                
                return (
                  <tr key={p.id} className="border-b border-brown-100 hover:bg-background transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-brown-900">{p.product_name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-brown-900">{p.category}</p>
                    </td>
                    {filter === 0 && (
                      <td className="py-3 px-4">
                        {branchName} - {brandName}
                      </td>
                    )}
                    <td className="py-3 px-4 font-semibold text-primary">₱{p.price}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "font-medium",
                          p.stock < p.alert_at ? "text-error" : "text-brown-900"
                        )}>
                          {p.stock}
                        </span>
                        {p.stock < p.alert_at && (
                          <AlertTriangle className="h-4 w-4 text-error" />
                        )}
                      </div>
                      <p className="text-xs text-brown-600">Alert at {p.alert_at}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={clsx(
                        "px-2 py-1 text-xs rounded-full",
                        p.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-brown-100 text-brown-600"
                      )}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setConfirmModal({ type: "restock", product: p })
                          }}
                          className="p-1 text-green-500 hover:bg-brown-100 hover:text-green-900 rounded transition-colors"
                        >
                          <PackagePlus className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({ type: "status", product: p })
                          }}
                          className={`p-1 text-yellow-600 hover:bg-brown-100 hover:text-yellow-900 rounded transition-colors`}
                        >
                          {p.is_active ? (
                            <PowerOff className="h-6 w-6" />
                          ) : (
                            <Power className="h-6 w-6" />
                          )}
                        </button>
                        <button
                          onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                          className="p-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                        >
                          <Edit className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({ type: "delete", product: p })
                          }}
                          className="p-1 text-error hover:bg-error hover:text-white rounded transition-colors"
                        >
                          <Trash2 className="h-6 w-6" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => setShowProductModal(false)}
          onSave={async (formData) => {
            try {
              setLoading(true); // start loading
              if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
              } else {
                await createProduct(formData);
              }
              setShowProductModal(false);
            } finally {
              setLoading(false); // stop loading
            }
          }}
          products={products}
          branchBrands={branchBrand.map(bb => ({
            id: bb.id,
            name: `${branches.find(b => b.id === bb.branch_id)?.branch_name || 'Unknown Branch'} - ${brands.find(br => br.id === bb.brand_id)?.brand_name || 'Unknown Brand'}`
          }))}
        />
      )}
      {/* Confirm Modal for Status/Stock Update and Delete */}
      <ConfirmModal
        modal={confirmModal}
        onCancel={() => {
          setConfirmModal({ type: null, product: null });
          setRestockAmount(0);
        }}
        onConfirm={(type, product, restockAmount) => {
          if (type === "delete") {
            deleteProduct(product.id);
          } else if (type === "status") {
            statusProduct(product.id, !product.is_active);
          } else if (type === "restock") {
            stockProduct(product.id, product.stock + (restockAmount || 0))
          }
          setConfirmModal({ type: null, product: null });
          setRestockAmount(0);
        }}
      />
    </div>
  )
}
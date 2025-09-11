import { useState, useMemo, useEffect } from 'react'
import { Gift, Plus, Edit, Calendar, Percent, Tag, Clock, Trash2, Filter, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { Promotion, getPromotions, createPromotion, updatePromotion, deletePromotion } from '../api/promotionsAPI'
import { Product, getProducts } from '../api/productAPI'

const useSegregatedPromotions = (promotions: any[]) => {
  return useMemo(() => {
    const now = new Date();

    const ongoing = promotions.filter((p) => {
      const start = new Date(p.start_date);

      const end = new Date(p.end_date);
      // extend end_date to end of the day
      end.setHours(23, 59, 59, 999);

      return now >= start && now <= end;
    });

    const incoming = promotions.filter((p) => {
      const start = new Date(p.start_date);
      return start > now;
    });

    const expired = promotions.filter((p) => {
      const end = new Date(p.end_date);
      end.setHours(23, 59, 59, 999);
      return end < now;
    });

    return { ongoing, incoming, expired };
  }, [promotions]);
};

interface PromotionModalProps {
  open: boolean
  onClose: () => void
  onSaved: (promotion: Omit<Promotion, "id">) => void
  editingPromotion: Promotion | null
  products: Product[]
}

export function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(0)

  const { ongoing, incoming, expired } = useSegregatedPromotions(promotions);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [promotionsData, productsData] = await Promise.all([
          getPromotions(),
          getProducts()
        ]);
        setPromotions(promotionsData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching promotions or products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showModal, editingPromotion]);

  const getPromotionIcon = (type: Promotion['type']) => {
    switch (type) {
      case 'percentage': return <Percent className="h-5 w-5" />
      case 'fixed': return <Tag className="h-5 w-5" />
      case 'bogo': return <Gift className="h-5 w-5" />
      default: return <Gift className="h-5 w-5" />
    }
  }

  const getPromotionColor = (type: Promotion['type']) => {
    switch (type) {
      case 'percentage': return 'bg-primary/10 text-primary'
      case 'fixed': return 'bg-secondary/10 text-secondary'
      case 'bogo': return 'bg-promo/20 text-gray-800'
      default: return 'bg-brown-100 text-gray-800'
    }
  }

  const OtherPromotions: Promotion[] = useMemo(() => {
    const combined = [...incoming, ...expired]

    if (!search.trim()) {
      if (category === 1) return incoming
      if (category === 2) return expired
      return combined
    }

    const term = search.toLowerCase()

    if (category === 0) {
      return combined.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.type.toLowerCase().includes(term)
      )
    }
    if (category === 1) {
      return incoming.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.type.toLowerCase().includes(term)
      )
    }
    if (category === 2) {
      return expired.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.type.toLowerCase().includes(term)
      )
    }

    // fallback (in case category is not 0/1/2)
    return combined
  }, [incoming, expired, search, category])

  const PromotionModal = ({
    open,
    onClose,
    onSaved,
    editingPromotion,
    products,
  }: PromotionModalProps) => {
    const [form, setForm] = useState<Omit<Promotion, "id">>({
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      start_date: "",
      end_date: "",
      start_time_frame: "",
      end_time_frame: "",
      minimum_spend: 0,
      minimum_item: 0,
      products: [],
    })

    const [error, setError] = useState<string | null>(null);

    // Fill form if editing
    useEffect(() => {
      if (editingPromotion) {
        const { id, ...rest } = editingPromotion
        setForm(rest)
      } else {
        setForm({
          name: "",
          description: "",
          type: "percentage",
          value: 0,
          start_date: "",
          end_date: "",
          start_time_frame: null,
          end_time_frame: null,
          minimum_spend: null,
          minimum_item: null,
          products: [],
        })
      }
    }, [editingPromotion])

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
      setError(null)
    }

    const handleCheckboxChange = (id: number) => {
      setForm(prev => ({
        ...prev,
        products: prev.products.includes(id)
          ? prev.products.filter(pid => pid !== id)
          : [...prev.products, id]
      }))
      setError(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      // --- Validation ---
      if (form.type !== "bogo" && (form.value === null || form.value <= 0)) {
        setError("Discount value must be greater than 0.");
        return;
      }
      if (!form.start_date || !form.end_date) {
        setError("Start and end dates are required.");
        return;
      }
      if (form.products.length === 0) {
        setError("At least one product must be selected.");
        return;
      }

      setError(null);
      setLoading(true);
      onSaved(form);
      setLoading(false);
    };

    const handleClearTime = () => {
      setForm((prev) => ({
        ...prev,
        start_time_frame: null,
        end_time_frame: null,
      }));
    };

    if (!open) return null

    return (
      <div 
        className="fixed inset-0 bg-black/50 flex justify-center items-center"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg p-6 w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold mb-4">
            {editingPromotion ? "Edit Promotion" : "Add Promotion"}
          </h2>

          {error && <div className="text-red-600 mb-3">Error: {error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <label>
              Promotion
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Promotion Name"
              className="w-full border p-2 rounded mb-2"
              required
            />
            <label>
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              className="w-full border p-2 rounded mb-2"
            />

            {/* Type + Value */}
            <div className="flex gap-3">
              <div className="flex flex-col flex-1 mb-2">
                <label>
                  Discount Type
                </label>
                <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="border p-2 rounded flex-1"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                  <option value="bogo">Buy One Get One</option>
                </select>
              </div>
              <div className="flex flex-col flex-1 mb-2">
                <label>
                  Discount Value
                </label>
                <input
                  type="number"
                  name="value"
                  value={form.type === "bogo" ? 1 : form.value}
                  onChange={handleChange}
                  className="border p-2 rounded flex-1"
                  placeholder="Value"
                  disabled={form.type === "bogo"}
                />
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col flex-1 mb-2">
                <label>
                  Starting Date of Discount
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              </div>
              <div className="flex flex-col flex-1 mb-2">
                <label>
                  Starting Date of Discount
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              </div>
            </div>

            {/* Time frame */}
            <div className='mb-2'>
              <div className="flex justify-between items-center">
                <label>
                  Time Discount is Active (Remain Empty if Whole Day)
                </label>
                <button
                  type="button"
                  onClick={handleClearTime}
                  className="text-sm text-blue-600 underline"
                >
                  Clear Time
                </button>
              </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col flex-1 mb-2">
                    <label>Discount Starting Time</label>
                    <input
                      type="time"
                      name="start_time_frame"
                      value={form.start_time_frame ?? ""}
                      min="10:00"
                      max="21:00"
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          start_time_frame: e.target.value === "" ? null : e.target.value,
                        }))
                      }
                      className="border p-2 rounded"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label>Discount Ending Time</label>
                    <input
                      type="time"
                      name="end_time_frame"
                      value={form.end_time_frame ?? ""}
                      min="10:30"
                      max="22:00"
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          end_time_frame: e.target.value === "" ? null : e.target.value,
                        }))}
                      className="border p-2 rounded"
                    />
                  </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col flex-1 mb-2">
                <label>
                  Minimum Spend
                </label>
                <input
                  type="number"
                  name="minimum_spend"
                  value={form.minimum_spend ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      minimum_spend: e.target.value === "" || e.target.value === "0" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="Minimum Spend"
                  className="border p-2 rounded"
                />
              </div>
              <div className="flex flex-col flex-1 mb-2">
                <label>
                  Minimum Item
                </label>
                <input
                  type="number"
                  name="minimum_item"
                  value={form.minimum_item ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      minimum_item: e.target.value === "" || e.target.value === "0" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="Minimum Items"
                  className="border p-2 rounded"
                />
              </div>
            </div>

            {/* Product selection */}
            <div className='mb-4'>
              <h3 className="text-sm font-semibold mb-2">Select Products</h3>
              <div className="max-h-40 overflow-y-auto border p-2 rounded">
                {products.map(p => (
                  <label key={p.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.products.includes(p.id)}
                      onChange={() => handleCheckboxChange(p.id)}
                    />
                    {p.product_name}
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Promotions</h1>
          <p className="text-gray-600">Manage your promotional campaigns and discounts</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Promotion
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Active Promotions</h3>
            <div className="bg-green-100 p-2 rounded-lg">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{ongoing.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Upcoming</h3>
            <div className="bg-primary/10 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-primary">{incoming.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#1F2937]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Expired</h3>
            <div className="bg-brown-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-brown-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-brown-600">{expired.length}</p>
        </div>
      </div>

      {/* On-going Promotions */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">On-going Promotions</h2>
        <div className="bg-white rounded-xl shadow-sm border border-[#1F2937] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brown-50 border-b border-[#1F2937]">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Promotion</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Time Frame</th>
                </tr>
              </thead>
              <tbody>
                {ongoing.map((promotion) => {
                  return (
                    <tr key={promotion.id} className="relative group border-b border-gray-400 hover:bg-background transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx("p-2 rounded-lg", getPromotionColor(promotion.type))}>
                            {getPromotionIcon(promotion.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{promotion.name}</p>
                            {(promotion.minimum_spend) && (
                              <p className="text-xs text-gray-600">Min. purchase: ₱{promotion.minimum_spend}</p>
                            )}
                            {(promotion.minimum_item) && (
                              <p className="text-xs text-gray-600">Min. items: {promotion.minimum_item}</p>
                            )}
                            {/* Tooltip inside td */}
                            <div className="absolute left-0 -top-8 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md z-10 whitespace-nowrap">
                              {promotion.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-200 text-gray-800 text-xs rounded-full capitalize">
                          {promotion.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {promotion.type === 'percentage' ? `${promotion.value}%` :
                         promotion.type === 'fixed' ? `₱${promotion.value}` :
                         promotion.type === 'bogo' ? `${promotion.value} free` :
                         `₱${promotion.value}`}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <p className='text-gray-600'>{new Date(promotion.start_date).toLocaleDateString()}</p>
                          <p className="text-blue-400">to {new Date(promotion.end_date).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={clsx(
                          "px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                        )}>
                          {promotion.start_time_frame && promotion.end_time_f ? (
                            <>
                              {new Date(`1970-01-01T${promotion.start_time_frame}`).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                              {" - "}
                              {new Date(`1970-01-01T${promotion.end_time_f}`).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </>
                          ) : (
                            "All Day"
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* All Promotions */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Upcoming and Expired Promotions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="relative flex-1 col-span-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search Promotion..."
              value={search}
              onChange={(e) => {setSearch(e.target.value)}}
              className="w-full pl-10 pr-4 py-2 border border-[#1F2937] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              onClick={() => setSearch('')}
            />
          </div>
                
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <select
              value={category}
              onChange={(e) => {setCategory(Number(e.target.value))}}
              className="flex-1 px-3 py-2 border border-[#1F2937] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value={0}>Other Promotions</option>
              <option value={1}>Upcoming Only</option>
              <option value={2}>Expired Only</option>
            </select>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#1F2937] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brown-50 border-b border-[#1F2937]">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Promotion</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Time Frame</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {OtherPromotions.map((promotion) => {
                  return (
                    <tr key={promotion.id} className="border-b border-gray-400 hover:bg-background transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx("p-2 rounded-lg", getPromotionColor(promotion.type))}>
                            {getPromotionIcon(promotion.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{promotion.name}</p>
                            {promotion.minimum_spend && (
                              <p className="text-xs text-gray-600">Min. purchase: ₱{promotion.minimum_spend}</p>
                            )}
                            {promotion.minimum_item && (
                              <p className="text-xs text-gray-600">Min. items: {promotion.minimum_item}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-200 text-gray-800 text-xs rounded-full capitalize">
                          {promotion.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {promotion.type === 'percentage' ? `${promotion.value}%` :
                         promotion.type === 'fixed' ? `₱${promotion.value}` :
                         promotion.type === 'bogo' ? `${promotion.value} free` :
                         `₱${promotion.value}`}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <p className='text-gray-600'>{new Date(promotion.start_date).toLocaleDateString()}</p>
                          <p className="text-blue-400">to {new Date(promotion.end_date).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={clsx(
                          "px-2 py-1 text-xs rounded-full bg-blue-200 text-gray-600"
                        )}>
                          {promotion.start_time_frame && promotion.end_time_frame ? (
                            <>
                              {new Date(`1970-01-01T${promotion.start_time_frame}`).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                              {" - "}
                              {new Date(`1970-01-01T${promotion.end_time_frame}`).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </>
                          ) : (
                            "All Day"
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={clsx(
                          "px-2 py-1 text-xs rounded-full",
                          new Date(promotion.end_date) < new Date() ? "bg-brown-100 text-brown-600" :
                          new Date(promotion.start_date) > new Date() ? "bg-primary/10 text-primary" :
                          "bg-green-100 text-green-800"
                        )}>
                          {new Date(promotion.end_date) < new Date() ? 'Expired' :
                           new Date(promotion.start_date) > new Date() ? 'Upcoming' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPromotion(promotion)
                              setShowModal(true)
                            }}
                            className="p-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteModal(true)
                              setEditingPromotion(promotion)
                            }}
                            className="p-1 text-error hover:bg-error hover:text-white rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Add/Edit Promotion Modal */}
      <PromotionModal
        open={showModal}
        onClose={() => {setShowModal(false); setEditingPromotion(null)}}
        onSaved={async (saved) => {
          if (editingPromotion) {
            await updatePromotion(editingPromotion.id, saved)
          } else {
            await createPromotion(saved)
          }
          setShowModal(false)
        }}
        editingPromotion={editingPromotion}
        products={products} // pass your product list here
      />

      {showDeleteModal && editingPromotion && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => {setShowDeleteModal(false); setEditingPromotion(null)}}
        >
          <div 
            className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4 text-red-600">Confirm Delete</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">Promotion:</span> {editingPromotion.name}</p>
              <p><span className="font-semibold">Description:</span> {editingPromotion.description || "—"}</p>
              <p>
                <span className="font-semibold">Type:</span>{" "}
                {editingPromotion.type === "percentage"
                  ? `${editingPromotion.value}%`
                  : editingPromotion.type === "fixed"
                  ? `₱${editingPromotion.value}`
                  : editingPromotion.type === "bogo"
                  ? `${editingPromotion.value} free`
                  : `₱${editingPromotion.value}`}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(editingPromotion.start_date).toLocaleDateString()} -{" "}
                {new Date(editingPromotion.end_date).toLocaleDateString()}
              </p>
              {editingPromotion.start_time_frame && editingPromotion.end_time_frame && (
                <p>
                  <span className="font-semibold">Time Frame:</span>{" "}
                  {new Date(`1970-01-01T${editingPromotion.start_time_frame}`).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  -{" "}
                  {new Date(`1970-01-01T${editingPromotion.end_time_frame}`).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              )}
              {editingPromotion.products?.length > 0 && (
                <div>
                  <span className="font-semibold">Products:</span>
                  <ul className="list-disc pl-5 mt-1">
                    {editingPromotion.products.map((prodId, idx) => {
                      const product = products.find(p => p.id === prodId) // lookup by ID
                      return (
                        <li key={idx}>
                          {product ? product.product_name : `Product ID: ${prodId}`}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {setShowDeleteModal(false); setEditingPromotion(null)}}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // ✅ Call your API delete function here
                  deletePromotion(editingPromotion.id)
                  setShowDeleteModal(false);
                  setEditingPromotion(null);
                }}
                className="px-4 py-2 rounded-lg bg-error text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
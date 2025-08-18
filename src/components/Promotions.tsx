import { useState, useMemo } from 'react'
import { Gift, Plus, Edit, Calendar, Percent, Tag, Clock, Trash2, Filter, Search, Cat } from 'lucide-react'
import { clsx } from 'clsx'
import promotions from '../mockdata/promotions.json'

interface Promotion {
  id: string
  name: string
  description: string
  type: 'percentage' | 'fixed' | 'bogo'
  value: number
  start_date: string
  end_date: string
  start_time_frame: string
  end_time_f: string
  minimunSpend: number
  minimum_item: number
  products: string[]
}

const useSegregatedPromotions = (promotions: any[]) => {
  return useMemo(() => {
    const now = new Date();

    const ongoing = promotions.filter((p) => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      return now >= start && now <= end;
    });

    const incoming = promotions.filter((p) => {
      const start = new Date(p.start_date);
      return start > now;
    });

    const expired = promotions.filter((p) => {
      const end = new Date(p.end_date);
      return end < now;
    });

    return { ongoing, incoming, expired };
  }, [promotions]);
};

export function Promotions() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(0)

  const { ongoing, incoming, expired } = useSegregatedPromotions(promotions);

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
      case 'bogo': return 'bg-promo/20 text-brown-800'
      default: return 'bg-brown-100 text-brown-800'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Promotions</h1>
          <p className="text-brown-600">Manage your promotional campaigns and discounts</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Promotion
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-brown-900">Active Promotions</h3>
            <div className="bg-green-100 p-2 rounded-lg">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{ongoing.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-brown-900">Upcoming</h3>
            <div className="bg-primary/10 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-primary">{incoming.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-brown-900">Expired</h3>
            <div className="bg-brown-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-brown-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-brown-600">{expired.length}</p>
        </div>
      </div>

      {/* On-going Promotions */}
      <div>
        <h2 className="text-xl font-bold text-brown-900 mb-4">On-going Promotions</h2>
        <div className="bg-white rounded-xl shadow-sm border border-brown-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brown-50 border-b border-brown-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Promotion</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Time Frame</th>
                </tr>
              </thead>
              <tbody>
                {ongoing.map((promotion) => {
                  return (
                    <tr key={promotion.id} className="relative group border-b border-brown-100 hover:bg-background transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx("p-2 rounded-lg", getPromotionColor(promotion.type))}>
                            {getPromotionIcon(promotion.type)}
                          </div>
                          <div>
                            <p className="font-medium text-brown-900">{promotion.name}</p>
                            {(promotion.minimum_spend) && (
                              <p className="text-xs text-brown-600">Min. purchase: ₱{promotion.minimum_spend}</p>
                            )}
                            {(promotion.minimum_item) && (
                              <p className="text-xs text-brown-600">Min. items: {promotion.minimum_item}</p>
                            )}
                            {/* Tooltip inside td */}
                            <div className="absolute left-0 -top-8 hidden group-hover:block bg-brown-900 text-white text-xs rounded px-2 py-1 shadow-md z-10 whitespace-nowrap">
                              {promotion.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-brown-100 text-brown-800 text-xs rounded-full capitalize">
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
                          <p>{new Date(promotion.start_date).toLocaleDateString()}</p>
                          <p className="text-brown-600">to {new Date(promotion.end_date).toLocaleDateString()}</p>
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
        <h2 className="text-xl font-bold text-brown-900 mb-2">Upcoming and Expired Promotions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="relative flex-1 col-span-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search Promotion..."
              value={search}
              onChange={(e) => {setSearch(e.target.value)}}
              className="w-full pl-10 pr-4 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              onClick={() => setSearch('')}
            />
          </div>
                
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-brown-600" />
            <select
              value={category}
              onChange={(e) => {setCategory(Number(e.target.value))}}
              className="flex-1 px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value={0}>Other Promotions</option>
              <option value={1}>Upcoming Only</option>
              <option value={2}>Expired Only</option>
            </select>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-brown-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brown-50 border-b border-brown-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Promotion</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Time Frame</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {OtherPromotions.map((promotion) => {
                  return (
                    <tr key={promotion.id} className="border-b border-brown-100 hover:bg-background transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx("p-2 rounded-lg", getPromotionColor(promotion.type))}>
                            {getPromotionIcon(promotion.type)}
                          </div>
                          <div>
                            <p className="font-medium text-brown-900">{promotion.name}</p>
                            {promotion.minimunSpend && (
                              <p className="text-xs text-brown-600">Min. purchase: ₱{promotion.minimunSpend}</p>
                            )}
                            {promotion.minimum_item && (
                              <p className="text-xs text-brown-600">Min. items: {promotion.minimum_item}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-brown-100 text-brown-800 text-xs rounded-full capitalize">
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
                          <p>{new Date(promotion.start_date).toLocaleDateString()}</p>
                          <p className="text-brown-600">to {new Date(promotion.end_date).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={clsx(
                          "px-2 py-1 text-xs rounded-full bg-brown-100 text-brown-600"
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
                              setShowAddModal(true)
                            }}
                            className="p-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            // onClick={() => handleDeletePromotion(promotion.id)}
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
      {/* {showAddModal && (
        <PromotionModal
          promotion={editingPromotion}
          onClose={() => {
            setShowAddModal(false)
            setEditingPromotion(null)
          }}
          onSave={handleSavePromotion}
        />
      )} */}
    </div>
  )
}
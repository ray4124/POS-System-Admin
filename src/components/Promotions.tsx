import React, { useState, useEffect } from 'react'
import { Gift, Plus, Edit, Calendar, Percent, Tag, Clock, Trash2 } from 'lucide-react'
import { Promotion } from '../lib/supabase'
import { clsx } from 'clsx'

export function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)

  // Mock data for demo
  useEffect(() => {
    const mockPromotions: Promotion[] = [
      {
        id: '1',
        name: 'Happy Hour Coffee',
        type: 'percentage',
        value: 20,
        start_date: '2025-01-01T14:00:00Z',
        end_date: '2025-01-01T17:00:00Z',
        is_active: true,
        applicable_items: ['1', '2', '6'], // Espresso, Cappuccino, Iced Latte
        branch_id: 'branch1',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Buy 1 Get 1 Pastries',
        type: 'bogo',
        value: 1,
        start_date: '2025-01-15T00:00:00Z',
        end_date: '2025-01-31T23:59:59Z',
        is_active: true,
        applicable_items: ['5'], // Cheesecake
        branch_id: 'branch1',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Lunch Combo Deal',
        type: 'fixed',
        value: 50,
        min_purchase: 300,
        start_date: '2025-01-01T11:00:00Z',
        end_date: '2025-01-31T15:00:00Z',
        is_active: true,
        applicable_items: ['3', '4'], // Chicken Sandwich, Caesar Salad
        branch_id: 'branch1',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Weekend Special',
        type: 'percentage',
        value: 15,
        start_date: '2025-01-11T00:00:00Z',
        end_date: '2025-01-12T23:59:59Z',
        is_active: true,
        branch_id: 'branch1',
        created_at: new Date().toISOString()
      }
    ]
    setPromotions(mockPromotions)
  }, [])

  const PromotionModal = ({ promotion, onClose, onSave }: {
    promotion?: Promotion | null
    onClose: () => void
    onSave: (promotion: Partial<Promotion>) => void
  }) => {
    const [formData, setFormData] = useState({
      name: promotion?.name || '',
      type: promotion?.type || 'percentage' as Promotion['type'],
      value: promotion?.value || 0,
      min_purchase: promotion?.min_purchase || 0,
      start_date: promotion?.start_date || new Date().toISOString().slice(0, -1),
      end_date: promotion?.end_date || new Date().toISOString().slice(0, -1),
      is_active: promotion?.is_active ?? true,
      applicable_items: promotion?.applicable_items || []
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSave(formData)
      onClose()
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-brown-900 mb-4">
            {promotion ? 'Edit Promotion' : 'Create New Promotion'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">Promotion Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">Promotion Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Promotion['type'] })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="percentage">Percentage Discount</option>
                <option value="fixed">Fixed Amount Off</option>
                <option value="bogo">Buy One Get One</option>
                <option value="combo">Combo Deal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-800 mb-1">
                {formData.type === 'percentage' ? 'Discount Percentage (%)' : 
                 formData.type === 'fixed' ? 'Discount Amount (₱)' :
                 formData.type === 'bogo' ? 'Free Items Count' : 'Combo Value (₱)'}
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                max={formData.type === 'percentage' ? 100 : undefined}
                required
              />
            </div>

            {(formData.type === 'fixed' || formData.type === 'combo') && (
              <div>
                <label className="block text-sm font-medium text-brown-800 mb-1">Minimum Purchase Amount (₱)</label>
                <input
                  type="number"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-brown-800 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-800 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-brown-200 text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm text-brown-800">Active Promotion</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-brown-200 text-brown-800 rounded-lg hover:bg-brown-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                {promotion ? 'Update' : 'Create'} Promotion
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const handleSavePromotion = (promotionData: Partial<Promotion>) => {
    if (editingPromotion) {
      // Update existing promotion
      setPromotions(promotions.map(p => 
        p.id === editingPromotion.id 
          ? { ...p, ...promotionData } 
          : p
      ))
    } else {
      // Add new promotion
      const newPromotion: Promotion = {
        id: Date.now().toString(),
        branch_id: 'branch1',
        created_at: new Date().toISOString(),
        ...promotionData
      } as Promotion
      setPromotions([...promotions, newPromotion])
    }
  }

  const handleDeletePromotion = (id: string) => {
    if (confirm('Are you sure you want to delete this promotion?')) {
      setPromotions(promotions.filter(p => p.id !== id))
    }
  }

  const getPromotionIcon = (type: Promotion['type']) => {
    switch (type) {
      case 'percentage': return <Percent className="h-5 w-5" />
      case 'fixed': return <Tag className="h-5 w-5" />
      case 'bogo': return <Gift className="h-5 w-5" />
      case 'combo': return <Tag className="h-5 w-5" />
      default: return <Gift className="h-5 w-5" />
    }
  }

  const getPromotionColor = (type: Promotion['type']) => {
    switch (type) {
      case 'percentage': return 'bg-primary/10 text-primary'
      case 'fixed': return 'bg-secondary/10 text-secondary'
      case 'bogo': return 'bg-promo/20 text-brown-800'
      case 'combo': return 'bg-brown-200 text-brown-800'
      default: return 'bg-brown-100 text-brown-800'
    }
  }

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date()
    const start = new Date(promotion.start_date)
    const end = new Date(promotion.end_date)
    return promotion.is_active && now >= start && now <= end
  }

  const activePromotions = promotions.filter(isPromotionActive)
  const upcomingPromotions = promotions.filter(p => p.is_active && new Date(p.start_date) > new Date())
  const expiredPromotions = promotions.filter(p => new Date(p.end_date) < new Date())

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
          <p className="text-3xl font-bold text-green-600">{activePromotions.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-brown-900">Upcoming</h3>
            <div className="bg-primary/10 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-primary">{upcomingPromotions.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-brown-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-brown-900">Expired</h3>
            <div className="bg-brown-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-brown-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-brown-600">{expiredPromotions.length}</p>
        </div>
      </div>

      {/* Active Promotions */}
      {activePromotions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-brown-900 mb-4">🔥 Currently Active</h2>
          <div className="grid gap-6">
            {activePromotions.map((promotion) => (
              <div key={promotion.id} className="bg-white p-6 rounded-xl shadow-sm border border-brown-100 animate-pulse-soft">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={clsx("p-3 rounded-lg", getPromotionColor(promotion.type))}>
                      {getPromotionIcon(promotion.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brown-900 mb-1">{promotion.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-brown-600">
                        <span>
                          {promotion.type === 'percentage' ? `${promotion.value}% off` :
                           promotion.type === 'fixed' ? `₱${promotion.value} off` :
                           promotion.type === 'bogo' ? `Buy 1 Get ${promotion.value} Free` :
                           `Combo Deal: ₱${promotion.value}`}
                        </span>
                        {promotion.min_purchase && (
                          <span>• Min. ₱{promotion.min_purchase}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                      Active
                    </span>
                    <button
                      onClick={() => {
                        setEditingPromotion(promotion)
                        setShowAddModal(true)
                      }}
                      className="p-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-brown-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Promotions */}
      <div>
        <h2 className="text-xl font-bold text-brown-900 mb-4">All Promotions</h2>
        <div className="bg-white rounded-xl shadow-sm border border-brown-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brown-50 border-b border-brown-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Promotion</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-brown-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promotion) => {
                  const isActive = isPromotionActive(promotion)
                  const isUpcoming = new Date(promotion.start_date) > new Date()
                  const isExpired = new Date(promotion.end_date) < new Date()
                  
                  return (
                    <tr key={promotion.id} className="border-b border-brown-100 hover:bg-background transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx("p-2 rounded-lg", getPromotionColor(promotion.type))}>
                            {getPromotionIcon(promotion.type)}
                          </div>
                          <div>
                            <p className="font-medium text-brown-900">{promotion.name}</p>
                            {promotion.min_purchase && (
                              <p className="text-xs text-brown-600">Min. purchase: ₱{promotion.min_purchase}</p>
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
                          "px-2 py-1 text-xs rounded-full",
                          isActive ? "bg-green-100 text-green-800" :
                          isUpcoming ? "bg-primary/10 text-primary" :
                          isExpired ? "bg-brown-100 text-brown-600" :
                          "bg-brown-100 text-brown-600"
                        )}>
                          {isActive ? 'Active' : isUpcoming ? 'Upcoming' : isExpired ? 'Expired' : 'Inactive'}
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
                            onClick={() => handleDeletePromotion(promotion.id)}
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
      {showAddModal && (
        <PromotionModal
          promotion={editingPromotion}
          onClose={() => {
            setShowAddModal(false)
            setEditingPromotion(null)
          }}
          onSave={handleSavePromotion}
        />
      )}
    </div>
  )
}
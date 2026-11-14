import React, { useState, useEffect } from 'react';
import {
  InventoryItemDto,
  CreateInventoryItemRequest,
  StockTransactionDto,
  StockTransactionRequest,
  StockTransactionType,
} from '../../shared/types';
import { inventoryApi } from '../../services/api';
import { useAuth } from '../../shared/context/AuthContext';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  History,
  Layers,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react';

export const InventoryManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const isPrivileged = hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']);
  const canIssue = hasRole(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_PRODUCTION']);

  const [activeTab, setActiveTab] = useState<'items' | 'transactions'>('items');
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [transactions, setTransactions] = useState<StockTransactionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);

  // Modal States
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItemDto | null>(null);

  // Create Item Form
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Print Media');
  const [newItemUnit, setNewItemUnit] = useState('Sq. Ft.');
  const [newItemInitialStock, setNewItemInitialStock] = useState('100');
  const [newItemReorderLevel, setNewItemReorderLevel] = useState('20');
  const [newItemUnitCost, setNewItemUnitCost] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Stock Adjustment Form
  const [adjustType, setAdjustType] = useState<StockTransactionType>('PURCHASE_RECEIPT');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'items') {
      loadItems();
    } else {
      loadTransactions();
    }
  }, [activeTab, filterLowStockOnly, selectedCategory]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getItems({
        search: searchQuery.trim() || undefined,
        category: selectedCategory || undefined,
        lowStock: filterLowStockOnly ? true : undefined,
      });
      setItems(data);
    } catch (err) {
      console.error('Failed to load inventory items', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getAllTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newItemCode.trim() || !newItemName.trim() || !newItemUnit.trim()) {
      setFormError('Item code, name, and unit are required');
      return;
    }

    try {
      const req: CreateInventoryItemRequest = {
        itemCode: newItemCode.trim().toUpperCase(),
        name: newItemName.trim(),
        category: newItemCategory.trim(),
        unit: newItemUnit.trim(),
        initialStock: newItemInitialStock ? parseFloat(newItemInitialStock) : 0,
        reorderLevel: newItemReorderLevel ? parseFloat(newItemReorderLevel) : 10,
        unitCost: newItemUnitCost ? parseFloat(newItemUnitCost) : undefined,
        location: newItemLocation.trim() || undefined,
        notes: newItemNotes.trim() || undefined,
      };

      await inventoryApi.createItem(req);
      setActionSuccess(`Material item ${req.name} created successfully!`);
      setIsCreateItemModalOpen(false);
      resetCreateForm();
      loadItems();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create inventory item');
    }
  };

  const resetCreateForm = () => {
    setNewItemCode('');
    setNewItemName('');
    setNewItemCategory('Print Media');
    setNewItemUnit('Sq. Ft.');
    setNewItemInitialStock('100');
    setNewItemReorderLevel('20');
    setNewItemUnitCost('');
    setNewItemLocation('');
    setNewItemNotes('');
    setFormError(null);
  };

  const handleRecordAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedItemForAdjust || !adjustQty || parseFloat(adjustQty) <= 0) {
      setFormError('Please enter a valid positive quantity');
      return;
    }

    try {
      const req: StockTransactionRequest = {
        inventoryItemId: selectedItemForAdjust.id,
        transactionType: adjustType,
        quantity: parseFloat(adjustQty),
        reason: adjustReason.trim() || undefined,
      };

      await inventoryApi.recordTransaction(req);
      setActionSuccess(`Stock transaction recorded for ${selectedItemForAdjust.name}`);
      setIsAdjustModalOpen(false);
      setSelectedItemForAdjust(null);
      setAdjustQty('');
      setAdjustReason('');
      loadItems();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to record stock adjustment');
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package size={24} /> Advertising Inventory & Raw Materials
          </h1>
          <p style={{ fontSize: '13px', color: '#666666', margin: '4px 0 0 0' }}>
            Track physical media stock, sheet inventory, hardware, reservations, and auditable stock transactions.
          </p>
        </div>

        {isPrivileged && (
          <button
            onClick={() => {
              resetCreateForm();
              setIsCreateItemModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              background: '#000000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Material Item
          </button>
        )}
      </div>

      {actionSuccess && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: '#F0FFF4',
            border: '1px solid #38A169',
            borderRadius: '4px',
            color: '#22543D',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} /> {actionSuccess}
          </div>
          <button onClick={() => setActionSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('items')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.75rem 1.25rem',
            fontSize: '13px',
            fontWeight: activeTab === 'items' ? 700 : 500,
            color: '#000000',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'items' ? '2px solid #000000' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          <Layers size={16} /> Inventory Stock Catalog
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.75rem 1.25rem',
            fontSize: '13px',
            fontWeight: activeTab === 'transactions' ? 700 : 500,
            color: '#000000',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'transactions' ? '2px solid #000000' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          <History size={16} /> Audit Trail & Stock Transactions
        </button>
      </div>

      {/* TAB 1: STOCK ITEMS */}
      {activeTab === 'items' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
              <input
                type="text"
                placeholder="Search by material code, name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadItems()}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  fontSize: '13px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '13px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                background: '#FFFFFF',
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterLowStockOnly}
                onChange={(e) => setFilterLowStockOnly(e.target.checked)}
              />
              <span>Low Stock Only</span>
            </label>

            <button
              onClick={loadItems}
              style={{
                padding: '0.5rem 0.85rem',
                fontSize: '13px',
                background: '#F5F5F5',
                border: '1px solid #D9D9D9',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
              <p>Loading inventory...</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#FAFAFA', border: '1px dashed #D0D0D0', borderRadius: '4px' }}>
              <Package size={36} style={{ color: '#AAAAAA', marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, color: '#444444' }}>No inventory items matched your criteria</p>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E5E5', color: '#444444', fontWeight: 600, fontSize: '12px' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Item Code</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Physical Stock</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Reserved</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Available</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#000000' }}>
                        {item.itemCode}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#000000' }}>{item.name}</div>
                        {item.notes && <div style={{ fontSize: '11px', color: '#777777' }}>{item.notes}</div>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#555555' }}>
                        {item.category}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                        {item.currentStock} {item.unit}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#666666' }}>
                        {item.reservedStock} {item.unit}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: item.lowStock ? '#DC2626' : '#000000',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {item.lowStock && <AlertTriangle size={13} color="#DC2626" />}
                          {item.availableStock} {item.unit}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#666666', fontSize: '12px' }}>
                        {item.location || 'Warehouse'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        {canIssue && (
                          <button
                            onClick={() => {
                              setSelectedItemForAdjust(item);
                              setAdjustType('PURCHASE_RECEIPT');
                              setAdjustQty('');
                              setAdjustReason('');
                              setFormError(null);
                              setIsAdjustModalOpen(true);
                            }}
                            style={{
                              padding: '0.35rem 0.65rem',
                              background: '#FFFFFF',
                              border: '1px solid #D9D9D9',
                              borderRadius: '3px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Adjust / Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSACTIONS AUDIT LOG */}
      {activeTab === 'transactions' && (
        <div>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
              <p>Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#FAFAFA', border: '1px dashed #D0D0D0', borderRadius: '4px' }}>
              <History size={36} style={{ color: '#AAAAAA', marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, color: '#444444' }}>No stock transactions recorded yet</p>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E5E5', color: '#444444', fontWeight: 600, fontSize: '12px' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Code & Timestamp</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material Item</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Transaction Type</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Before → After</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Reference / Project</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Authorized By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#000000' }}>{tx.transactionCode}</div>
                        <div style={{ fontSize: '11px', color: '#777777' }}>{new Date(tx.createdAt).toLocaleString()}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#000000' }}>{tx.itemName}</div>
                        <div style={{ fontSize: '11px', color: '#666666' }}>{tx.itemCode}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: tx.transactionType === 'MATERIAL_ISSUE' || tx.transactionType === 'WASTAGE' ? '#FFF5F5' : '#F0FFF4',
                            color: tx.transactionType === 'MATERIAL_ISSUE' || tx.transactionType === 'WASTAGE' ? '#E53E3E' : '#2F855A',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          {tx.transactionType}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {tx.unit}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#555555', fontSize: '12px' }}>
                        {tx.balanceBefore} → {tx.balanceAfter}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '12px' }}>
                        {tx.projectCode ? <strong>{tx.projectCode}</strong> : tx.enquiryNumber ? <span>{tx.enquiryNumber}</span> : 'General Adjustment'}
                        {tx.reason && <div style={{ color: '#777777' }}>{tx.reason}</div>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '12px', color: '#333333' }}>
                        {tx.performedBy?.fullName || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE ITEM MODAL */}
      {isCreateItemModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setIsCreateItemModalOpen(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '6px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Add New Raw Material / Inventory Item</h3>
              <button onClick={() => setIsCreateItemModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', background: '#FFF5F5', border: '1px solid #E53E3E', color: '#C53030', borderRadius: '4px', fontSize: '12px', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MAT-FLX-01"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Print Media, Sheets, LED"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Star Flex 440gsm High Gloss"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>Stock Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sq. Ft., Sheet, Piece"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>Initial Stock</label>
                  <input
                    type="number"
                    step="any"
                    value={newItemInitialStock}
                    onChange={(e) => setNewItemInitialStock(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>Reorder Level</label>
                  <input
                    type="number"
                    step="any"
                    value={newItemReorderLevel}
                    onChange={(e) => setNewItemReorderLevel(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>Estimated Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 15.50"
                    value={newItemUnitCost}
                    onChange={(e) => setNewItemUnitCost(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>Storage Rack / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-12"
                    value={newItemLocation}
                    onChange={(e) => setNewItemLocation(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateItemModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', background: '#F5F5F5', border: '1px solid #D9D9D9', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: '#000000', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST / RECEIPT MODAL */}
      {isAdjustModalOpen && selectedItemForAdjust && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setIsAdjustModalOpen(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '6px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                Adjust Stock: {selectedItemForAdjust.name}
              </h3>
              <button onClick={() => setIsAdjustModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#F9F9F9', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '12px' }}>
              Current Physical Stock: <strong>{selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}</strong> | Available: <strong>{selectedItemForAdjust.availableStock} {selectedItemForAdjust.unit}</strong>
            </div>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', background: '#FFF5F5', border: '1px solid #E53E3E', color: '#C53030', borderRadius: '4px', fontSize: '12px', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Transaction Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockTransactionType)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px', background: '#FFFFFF' }}
                >
                  <option value="PURCHASE_RECEIPT">Purchase Receipt (Add to Stock)</option>
                  <option value="RETURN_TO_STOCK">Return from Production (Add to Stock)</option>
                  <option value="WASTAGE">Production Wastage (Deduct)</option>
                  <option value="DAMAGE">Damaged / Expired Media (Deduct)</option>
                  <option value="ADJUSTMENT">Physical Audit Count Adjustment (Set Exact)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Quantity ({selectedItemForAdjust.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="e.g. 50"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Audit Reason / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment invoice #4512 from supplier"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '13px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', background: '#F5F5F5', border: '1px solid #D9D9D9', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: '#000000', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

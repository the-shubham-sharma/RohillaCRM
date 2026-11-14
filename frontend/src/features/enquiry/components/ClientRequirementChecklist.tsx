import React, { useState, useEffect } from 'react';
import {
  EnquiryLineItemRequest,
  ServiceCatalogDto,
  DimensionUnit,
  QuantityUnit,
  PrintSides,
  PrintingType,
  DesignRequirementStatus,
} from '../../../shared/types';
import { enquiryApi } from '../../../services/api';
import { calculateArea } from '../../../shared/utils/dimensions';
import {
  Plus,
  Trash2,
  Copy,
  Layers,
  Maximize2,
  CheckSquare,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ClientRequirementChecklistProps {
  lineItems: EnquiryLineItemRequest[];
  onChange: (items: EnquiryLineItemRequest[]) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export const ClientRequirementChecklist: React.FC<ClientRequirementChecklistProps> = ({
  lineItems,
  onChange,
  errors: _errors = {},
  disabled = false,
}) => {
  const [catalog, setCatalog] = useState<ServiceCatalogDto[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [customMaterialInput, setCustomMaterialInput] = useState<{ [index: number]: string }>({});

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const data = await enquiryApi.getCatalog();
      setCatalog(data);
    } catch (err) {
      console.error('Failed to load service catalog', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const getServiceCatalogItem = (serviceName: string): ServiceCatalogDto | undefined => {
    return catalog.find((c) => c.serviceName.toLowerCase() === serviceName.toLowerCase());
  };

  const handleAddItem = (serviceName?: string) => {
    const defaultServiceName = serviceName || (catalog.length > 0 ? catalog[0].serviceName : 'Flex Printing');
    const catalogItem = getServiceCatalogItem(defaultServiceName);

    const defaultMaterials = catalogItem && catalogItem.materials.length > 0
      ? [catalogItem.materials[0]]
      : ['Frontlit Flex'];

    const newItem: EnquiryLineItemRequest = {
      serviceName: defaultServiceName,
      width: 10,
      height: 5,
      dimensionUnit: 'FEET',
      siteMeasurementRequired: false,
      quantity: 1,
      quantityUnit: 'PIECE',
      printSides: 'SINGLE_SIDED',
      printingType: 'FULL_COLOUR',
      areaPerSideSqFt: 50,
      totalAreaSqFt: 50,
      areaPerSideSqM: 4.65,
      totalAreaSqM: 4.65,
      installationRequired: false,
      installationLocation: '',
      siteInspectionRequired: false,
      designStatus: 'CLIENT_PROVIDED',
      selectedMaterials: defaultMaterials,
      materialConfirmedByManager: false,
      finishingRequirements: [],
      remarks: '',
    };

    const updated = [...lineItems, newItem];
    onChange(updated);
    setExpandedIndex(updated.length - 1);
  };

  const handleDuplicateItem = (index: number) => {
    const itemToClone = { ...lineItems[index], selectedMaterials: [...lineItems[index].selectedMaterials], finishingRequirements: [...lineItems[index].finishingRequirements] };
    const updated = [...lineItems, itemToClone];
    onChange(updated);
    setExpandedIndex(updated.length - 1);
  };

  const handleRemoveItem = (index: number) => {
    const updated = lineItems.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(updated.length > 0 ? Math.max(0, index - 1) : null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleItemFieldChange = <K extends keyof EnquiryLineItemRequest>(
    index: number,
    field: K,
    val: EnquiryLineItemRequest[K]
  ) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: val };

    // If service changed, update relevant default materials
    if (field === 'serviceName') {
      const cat = getServiceCatalogItem(val as string);
      if (cat && cat.materials.length > 0) {
        item.selectedMaterials = [cat.materials[0]];
      }
    }

    // Recalculate dimensions if width, height, unit, or printSides change
    if (
      field === 'width' ||
      field === 'height' ||
      field === 'dimensionUnit' ||
      field === 'printSides' ||
      field === 'quantity'
    ) {
      const areaRes = calculateArea(
        item.width,
        item.height,
        item.dimensionUnit,
        item.printSides
      );
      item.areaPerSideSqFt = areaRes.areaPerSideSqFt;
      item.totalAreaSqFt = areaRes.totalAreaSqFt;
      item.areaPerSideSqM = areaRes.areaPerSideSqM;
      item.totalAreaSqM = areaRes.totalAreaSqM;
    }

    updated[index] = item;
    onChange(updated);
  };

  const toggleMaterial = (index: number, material: string) => {
    const item = lineItems[index];
    const current = item.selectedMaterials || [];
    const exists = current.includes(material);
    const updated = exists ? current.filter((m) => m !== material) : [...current, material];
    handleItemFieldChange(index, 'selectedMaterials', updated);
  };

  const handleAddCustomMaterial = (index: number) => {
    const custom = customMaterialInput[index]?.trim();
    if (!custom) return;
    const item = lineItems[index];
    if (!item.selectedMaterials.includes(custom)) {
      handleItemFieldChange(index, 'selectedMaterials', [...item.selectedMaterials, custom]);
    }
    setCustomMaterialInput({ ...customMaterialInput, [index]: '' });
  };

  const toggleFinishing = (index: number, option: string) => {
    const item = lineItems[index];
    const current = item.finishingRequirements || [];
    const exists = current.includes(option);
    const updated = exists ? current.filter((o) => o !== option) : [...current, option];
    handleItemFieldChange(index, 'finishingRequirements', updated);
  };

  // Summary calculations
  const totalItemsCount = lineItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalAreaSqFtSum = lineItems.reduce((acc, item) => acc + (item.totalAreaSqFt || 0) * (item.quantity || 1), 0);
  const installRequiredCount = lineItems.filter((i) => i.installationRequired).length;
  const designRequiredCount = lineItems.filter((i) => i.designStatus !== 'CLIENT_PROVIDED').length;

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #EEEEEE', paddingBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} /> Client Requirement & Advertising Services Checklist
          </h3>
          <p style={{ fontSize: '12px', color: '#666666', margin: '2px 0 0 0' }}>
            Specify advertising service types, dimensions, print media, finishing, and on-site requirements
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleAddItem()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.9rem',
            background: '#000000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add Service Item
        </button>
      </div>

      {/* Quick Service Checklist Buttons Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#888888', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
          Quick Add from Service Catalog{loadingCatalog ? ' (Loading...)' : ''}:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {catalog.map((cat) => (
            <button
              key={cat.serviceName}
              type="button"
              disabled={disabled}
              onClick={() => handleAddItem(cat.serviceName)}
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '11px',
                fontWeight: 500,
                background: '#F9F9F9',
                color: '#333333',
                border: '1px solid #E0E0E0',
                borderRadius: '3px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#000000';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F9F9F9';
                e.currentTarget.style.color = '#333333';
              }}
            >
              <Plus size={11} /> {cat.serviceName}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {lineItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#FAFAFA', border: '1px dashed #D0D0D0', borderRadius: '4px' }}>
          <Layers size={32} style={{ color: '#AAAAAA', marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#333333', margin: 0 }}>
            No advertising service items added yet
          </p>
          <p style={{ fontSize: '12px', color: '#888888', margin: '4px 0 1rem 0' }}>
            Click 'Add Service Item' or select a service above to build the requirement checklist.
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleAddItem('Flex Printing')}
            style={{
              padding: '0.5rem 1rem',
              background: '#000000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add First Service (Flex Printing)
          </button>
        </div>
      ) : (
        /* Line Items Accordion List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {lineItems.map((item, index) => {
            const isExpanded = expandedIndex === index;
            const catalogItem = getServiceCatalogItem(item.serviceName);
            const availableMaterials = catalogItem ? catalogItem.materials : [];
            const availableFinishing = catalogItem && catalogItem.finishingOptions.length > 0
              ? catalogItem.finishingOptions
              : ['Eyelets', 'Rope', 'Edge Folding', 'Lamination', 'Mounting', 'Transportation', 'On-Site Installation'];

            return (
              <div
                key={index}
                style={{
                  border: isExpanded ? '1px solid #000000' : '1px solid #E0E0E0',
                  borderRadius: '5px',
                  background: '#FFFFFF',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Item Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: isExpanded ? '#F8F9FA' : '#FAFAFA',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isExpanded ? '1px solid #EEEEEE' : 'none',
                  }}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#000000', color: '#FFFFFF', fontSize: '11px', fontWeight: 700 }}>
                      {index + 1}
                    </span>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#000000' }}>
                        {item.serviceName}
                      </span>
                      <span style={{ fontSize: '12px', color: '#666666', marginLeft: '0.5rem' }}>
                        ({item.quantity} {item.quantityUnit})
                        {item.width && item.height ? ` • ${item.width} x ${item.height} ${item.dimensionUnit}` : ''}
                        {item.totalAreaSqFt ? ` • ${item.totalAreaSqFt} sq. ft.` : ''}
                      </span>
                      {item.installationRequired && (
                        <span style={{ marginLeft: '0.5rem', background: '#000000', color: '#FFFFFF', fontSize: '10px', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                          Installation
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={disabled}
                      title="Duplicate Item"
                      onClick={() => handleDuplicateItem(index)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666', padding: '4px' }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      title="Remove Item"
                      onClick={() => handleRemoveItem(index)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E53E3E', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666', padding: '4px' }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Item Details (Expanded) */}
                {isExpanded && (
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Row 1: Service Type & Measurement Flag */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                          Service Type <span style={{ color: '#E53E3E' }}>*</span>
                        </label>
                        <select
                          disabled={disabled}
                          value={item.serviceName}
                          onChange={(e) => handleItemFieldChange(index, 'serviceName', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            fontSize: '13px',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            background: '#FFFFFF',
                            fontWeight: 600,
                          }}
                        >
                          {catalog.map((c) => (
                            <option key={c.serviceName} value={c.serviceName}>
                              {c.serviceName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                          Site Measurement
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', cursor: 'pointer', fontSize: '12px', color: '#444444' }}>
                          <input
                            type="checkbox"
                            disabled={disabled}
                            checked={item.siteMeasurementRequired}
                            onChange={(e) => handleItemFieldChange(index, 'siteMeasurementRequired', e.target.checked)}
                          />
                          <span>Site inspection & measurements required prior to fabrication</span>
                        </label>
                      </div>
                    </div>

                    {/* Row 2: Dimensions & Real-time Area Calculation */}
                    <div style={{ background: '#F8F9FA', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px', fontWeight: 700, color: '#000000', marginBottom: '0.65rem' }}>
                        <Maximize2 size={14} /> Dimensions, Print Sides & Automated Area Calculation
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#555555', marginBottom: '0.25rem' }}>
                            Width
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            disabled={disabled}
                            placeholder="e.g. 10"
                            value={item.width ?? ''}
                            onChange={(e) => handleItemFieldChange(index, 'width', e.target.value ? parseFloat(e.target.value) : undefined)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.6rem',
                              fontSize: '13px',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#555555', marginBottom: '0.25rem' }}>
                            Height
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            disabled={disabled}
                            placeholder="e.g. 5"
                            value={item.height ?? ''}
                            onChange={(e) => handleItemFieldChange(index, 'height', e.target.value ? parseFloat(e.target.value) : undefined)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.6rem',
                              fontSize: '13px',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#555555', marginBottom: '0.25rem' }}>
                            Unit
                          </label>
                          <select
                            disabled={disabled}
                            value={item.dimensionUnit}
                            onChange={(e) => handleItemFieldChange(index, 'dimensionUnit', e.target.value as DimensionUnit)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.6rem',
                              fontSize: '13px',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              background: '#FFFFFF',
                            }}
                          >
                            <option value="FEET">Feet (ft)</option>
                            <option value="INCHES">Inches (in)</option>
                            <option value="METRES">Metres (m)</option>
                            <option value="MILLIMETRES">Millimetres (mm)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#555555', marginBottom: '0.25rem' }}>
                            Sides
                          </label>
                          <select
                            disabled={disabled}
                            value={item.printSides}
                            onChange={(e) => handleItemFieldChange(index, 'printSides', e.target.value as PrintSides)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.6rem',
                              fontSize: '13px',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              background: '#FFFFFF',
                            }}
                          >
                            <option value="SINGLE_SIDED">Single-Sided</option>
                            <option value="DOUBLE_SIDED">Double-Sided (2x Area)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#555555', marginBottom: '0.25rem' }}>
                            Quantity & Unit
                          </label>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <input
                              type="number"
                              min="1"
                              disabled={disabled}
                              value={item.quantity || 1}
                              onChange={(e) => handleItemFieldChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              style={{
                                width: '60px',
                                padding: '0.45rem 0.5rem',
                                fontSize: '13px',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                              }}
                            />
                            <select
                              disabled={disabled}
                              value={item.quantityUnit}
                              onChange={(e) => handleItemFieldChange(index, 'quantityUnit', e.target.value as QuantityUnit)}
                              style={{
                                flex: 1,
                                padding: '0.45rem 0.4rem',
                                fontSize: '12px',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                                background: '#FFFFFF',
                              }}
                            >
                              <option value="PIECE">Piece</option>
                              <option value="SET">Set</option>
                              <option value="RUNNING_FT">Running Ft.</option>
                              <option value="SQ_FT">Sq. Ft.</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Automated Area Calculation Badge */}
                      <div style={{ marginTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '12px', color: '#222222' }}>
                        <div style={{ background: '#FFFFFF', border: '1px solid #D9D9D9', padding: '0.3rem 0.6rem', borderRadius: '3px' }}>
                          Area Per Side: <strong>{item.areaPerSideSqFt || 0} sq. ft.</strong> ({item.areaPerSideSqM || 0} m²)
                        </div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #000000', padding: '0.3rem 0.6rem', borderRadius: '3px', fontWeight: 600 }}>
                          Total Calculated Area: <strong>{item.totalAreaSqFt || 0} sq. ft.</strong> ({item.totalAreaSqM || 0} m²)
                        </div>
                        {item.quantity > 1 && (
                          <div style={{ background: '#FFFFFF', border: '1px solid #D9D9D9', padding: '0.3rem 0.6rem', borderRadius: '3px' }}>
                            Grand Area (all {item.quantity} qty): <strong>{((item.totalAreaSqFt || 0) * item.quantity).toFixed(2)} sq. ft.</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Material Options (Dynamic according to chosen Service) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckSquare size={14} /> Material Selection for {item.serviceName}
                        </label>
                        <span style={{ fontSize: '11px', color: '#666666' }}>
                          Select one or multiple materials
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        {availableMaterials.map((mat) => {
                          const isSelected = item.selectedMaterials?.includes(mat);
                          const isTbc = mat.includes('to be confirmed');
                          return (
                            <button
                              key={mat}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleMaterial(index, mat)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '12px',
                                fontWeight: isSelected ? 700 : 500,
                                background: isSelected ? (isTbc ? '#333333' : '#000000') : '#F5F5F5',
                                color: isSelected ? '#FFFFFF' : '#333333',
                                border: isSelected ? '1px solid #000000' : '1px solid #D9D9D9',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {isSelected ? '✓ ' : '+ '} {mat}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom material add field */}
                      <div style={{ display: 'flex', gap: '0.4rem', maxWidth: '350px' }}>
                        <input
                          type="text"
                          disabled={disabled}
                          placeholder="Add custom / non-standard material..."
                          value={customMaterialInput[index] || ''}
                          onChange={(e) => setCustomMaterialInput({ ...customMaterialInput, [index]: e.target.value })}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0.6rem',
                            fontSize: '12px',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '3px',
                          }}
                        />
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleAddCustomMaterial(index)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '12px',
                            background: '#000000',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Row 4: Finishing & Processing Requirements */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#000000', marginBottom: '0.35rem' }}>
                        <Wrench size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Finishing & Fabrication Requirements
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {availableFinishing.map((fin) => {
                          const isSelected = item.finishingRequirements?.includes(fin);
                          return (
                            <button
                              key={fin}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleFinishing(index, fin)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '12px',
                                fontWeight: isSelected ? 700 : 500,
                                background: isSelected ? '#000000' : '#FFFFFF',
                                color: isSelected ? '#FFFFFF' : '#444444',
                                border: isSelected ? '1px solid #000000' : '1px solid #D9D9D9',
                                borderRadius: '3px',
                                cursor: 'pointer',
                              }}
                            >
                              {isSelected ? '✓ ' : '+ '} {fin}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row 5: Installation, Design Status & Remarks */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                          Printing Technology
                        </label>
                        <select
                          disabled={disabled}
                          value={item.printingType}
                          onChange={(e) => handleItemFieldChange(index, 'printingType', e.target.value as PrintingType)}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.6rem',
                            fontSize: '12px',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            background: '#FFFFFF',
                          }}
                        >
                          <option value="FULL_COLOUR">Full Colour (CMYK)</option>
                          <option value="BLACK_AND_WHITE">Black & White / Single Colour</option>
                          <option value="UV_PRINT">UV High Durability Print</option>
                          <option value="SOLVENT_PRINT">Heavy Solvent Outdoor Print</option>
                          <option value="ECO_SOLVENT_PRINT">Eco-Solvent Indoor/Retail Print</option>
                          <option value="LATEX_PRINT">HP Latex Eco-Friendly Print</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                          Design Requirement Status
                        </label>
                        <select
                          disabled={disabled}
                          value={item.designStatus}
                          onChange={(e) => handleItemFieldChange(index, 'designStatus', e.target.value as DesignRequirementStatus)}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.6rem',
                            fontSize: '12px',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            background: '#FFFFFF',
                          }}
                        >
                          <option value="CLIENT_PROVIDED">Client Providing Print-Ready Artwork (Path A)</option>
                          <option value="DESIGN_REQUIRED">New Graphic Design Required (Path B)</option>
                          <option value="MINOR_MODIFICATION">Minor Artwork Modification Required</option>
                          <option value="PENDING_APPROVAL">Pending Customer Design Proof Approval</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                          Installation Required?
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`install-${index}`}
                              disabled={disabled}
                              checked={item.installationRequired}
                              onChange={() => handleItemFieldChange(index, 'installationRequired', true)}
                            />
                            <span>Yes</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`install-${index}`}
                              disabled={disabled}
                              checked={!item.installationRequired}
                              onChange={() => handleItemFieldChange(index, 'installationRequired', false)}
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>

                      {item.installationRequired && (
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                            Installation Site / Location
                          </label>
                          <input
                            type="text"
                            disabled={disabled}
                            placeholder="e.g. Ground Floor Facade, Cyber City"
                            value={item.installationLocation || ''}
                            onChange={(e) => handleItemFieldChange(index, 'installationLocation', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.6rem',
                              fontSize: '12px',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      )}

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                          Specific Line Item Remarks & Instructions
                        </label>
                        <input
                          type="text"
                          disabled={disabled}
                          placeholder="e.g. Needs high gloss lamination with 2-inch border bleed"
                          value={item.remarks || ''}
                          onChange={(e) => handleItemFieldChange(index, 'remarks', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.6rem',
                            fontSize: '12px',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Aggregate Metrics Bar */}
      {lineItems.length > 0 && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1.15rem',
            background: '#F9F9F9',
            border: '1px solid #000000',
            borderRadius: '4px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#666666' }}>Total Services: </span>
              <strong>{lineItems.length}</strong>
            </div>
            <div>
              <span style={{ color: '#666666' }}>Total Units: </span>
              <strong>{totalItemsCount}</strong>
            </div>
            <div>
              <span style={{ color: '#666666' }}>Total Square Feet: </span>
              <strong style={{ color: '#000000', fontSize: '14px' }}>{totalAreaSqFtSum.toFixed(2)} sq. ft.</strong>
            </div>
            <div>
              <span style={{ color: '#666666' }}>Installation Required: </span>
              <strong>{installRequiredCount > 0 ? `${installRequiredCount} item(s)` : 'None'}</strong>
            </div>
            <div>
              <span style={{ color: '#666666' }}>Design Assistance: </span>
              <strong>{designRequiredCount > 0 ? 'Yes (Path B)' : 'Client Ready (Path A)'}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

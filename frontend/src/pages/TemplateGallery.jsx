import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateAPI } from '../services/api';
import { 
  getVoucherTypeName, 
  getVoucherTypeColor,
  getVoucherTypeIcon,
  formatCurrency,
  formatDate
} from '../utils/helpers';
import './TemplateGallery.css';

function TemplateGallery({ userRole = 'user' }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates', { search: searchTerm, category: categoryFilter !== 'all' ? categoryFilter : undefined, isActive: true }],
    queryFn: () => templateAPI.getAll({ 
      search: searchTerm || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      isActive: true 
    }),
  });

  const { data: popularData } = useQuery({
    queryKey: ['templates', 'popular'],
    queryFn: () => templateAPI.getPopular(),
    enabled: userRole === 'admin',
  });

  const useTemplateMutation = useMutation({
    mutationFn: (templateId) => templateAPI.getById(templateId),
    onSuccess: (data) => {
      // This would typically create a voucher from the template
      console.log('Using template:', data.template);
      alert('Template selected! Redirecting to voucher creation...');
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: (templateId) => templateAPI.duplicate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      alert('Template duplicated successfully!');
    },
  });

  if (isLoading) {
    return (
      <div className="template-gallery">
        <div className="loading">Loading templates...</div>
      </div>
    );
  }

  const templates = templatesData?.templates || [];
  const popularTemplates = popularData?.templates || [];

  const categories = ['all', 'education', 'healthcare', 'transport', 'agriculture'];

  return (
    <div className="template-gallery">
      <div className="gallery-header">
        <h1>📋 Voucher Templates</h1>
        <p>Browse and use pre-configured voucher templates</p>
      </div>

      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {userRole === 'admin' && popularTemplates.length > 0 && (
        <div className="popular-section">
          <h2>🔥 Most Popular Templates</h2>
          <div className="popular-grid">
            {popularTemplates.slice(0, 3).map(template => (
              <div key={template.templateId} className="popular-card">
                <span className="template-icon">{getVoucherTypeIcon(template.voucherType)}</span>
                <div>
                  <h4>{template.name}</h4>
                  <p>{template.usageCount} uses</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="templates-grid">
        {templates.map((template) => (
          <div 
            key={template.templateId} 
            className="template-card"
            style={{ borderTopColor: getVoucherTypeColor(template.voucherType) }}
          >
            <div className="template-header">
              <span className="template-icon">{getVoucherTypeIcon(template.voucherType)}</span>
              <div className="template-title">
                <h3>{template.name}</h3>
                <span className="template-category">{template.category}</span>
              </div>
            </div>

            {template.description && (
              <p className="template-description">{template.description}</p>
            )}

            <div className="template-details">
              <div className="detail-row">
                <span className="label">Type:</span>
                <span className="value">{getVoucherTypeName(template.voucherType)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Default Value:</span>
                <span className="value">{formatCurrency(template.defaultValue)}</span>
              </div>
              {template.defaultExpiryDays && (
                <div className="detail-row">
                  <span className="label">Valid For:</span>
                  <span className="value">{template.defaultExpiryDays} days</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">Partial Redemption:</span>
                <span className={`badge ${template.allowPartialRedemption ? 'badge-yes' : 'badge-no'}`}>
                  {template.allowPartialRedemption ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
            </div>

            {template.transferRestrictions && (
              <div className="restrictions-info">
                <h4>Transfer Restrictions:</h4>
                <ul>
                  {template.transferRestrictions.maxTransfers && (
                    <li>Max {template.transferRestrictions.maxTransfers} transfers</li>
                  )}
                  {template.transferRestrictions.requiresApproval && (
                    <li>Requires approval</li>
                  )}
                  {template.transferRestrictions.allowedRecipients?.length > 0 && (
                    <li>Whitelist: {template.transferRestrictions.allowedRecipients.length} recipients</li>
                  )}
                </ul>
              </div>
            )}

            <div className="template-meta">
              <span>Used {template.usageCount} times</span>
              <span>Created {formatDate(new Date(template.createdAt))}</span>
            </div>

            <div className="template-actions">
              <button 
                className="btn-primary"
                onClick={() => useTemplateMutation.mutate(template.templateId)}
                disabled={useTemplateMutation.isLoading}
              >
                Use Template
              </button>
              {userRole === 'admin' && (
                <>
                  <button 
                    className="btn-secondary"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => duplicateTemplateMutation.mutate(template.templateId)}
                  >
                    Duplicate
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="no-templates">
          <p>No templates found. {userRole === 'admin' && 'Create your first template to get started!'}</p>
        </div>
      )}
    </div>
  );
}

export default TemplateGallery;

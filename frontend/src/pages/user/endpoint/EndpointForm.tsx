// src/pages/user/endpoint/EndpointForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Plus, Trash2, Globe, Clock, Zap, Shield } from 'lucide-react';
import { createEndpoint, getEndpointById, updateEndpoint } from '../../../api/userAction/userAction';
import type { CreateEndpointDTO, UpdateEndpointDTO } from '../../../types/interface/apiInterface';

interface HeaderField {
  key: string;
  value: string;
}

interface ValidationError {
  msg: string;
  path: string;
}

interface ApiError {
  response?: {
    data?: {
      errors?: ValidationError[];
      message?: string;
    };
  };
  message?: string;
}

function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && 'response' in err;
}

// ---------------------------------------------------------------------------
// LoadingSpinner
// ---------------------------------------------------------------------------
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-700 border-t-green-500`} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------
const Alert: React.FC<{
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
  errors?: ValidationError[];
  onClose?: () => void;
}> = ({ type, message, errors, onClose }) => {
  const styles = {
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  };

  return (
    <div className={`mb-4 p-4 rounded-lg border ${styles[type]}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-sm">{message}</p>
          {errors && errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-xs space-y-1 opacity-80">
              {errors.map((error, index) => (
                <li key={index}>{error.msg} ({error.path})</li>
              ))}
            </ul>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-current opacity-50 hover:opacity-100 ml-4 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-5 flex items-center gap-2">
      <span className="text-green-400">{icon}</span>
      {title}
    </h2>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Shared input classes
// ---------------------------------------------------------------------------
const inputCls =
  'w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors';

const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider';
const hintCls = 'mt-1 text-xs text-gray-600';

// ---------------------------------------------------------------------------
// EndpointForm
// ---------------------------------------------------------------------------
const EndpointForm: React.FC = () => {
  const { endpointId } = useParams<{ endpointId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateEndpointDTO>({
    name: '',
    url: '',
    method: 'GET',
    headers: {},
    body: '',
    expectedStatus: undefined,
    interval: undefined,
    timeout: undefined,
    thresholds: {
      maxResponseTime: undefined,
      failureThreshold: undefined,
    },
  });

  const [headers, setHeaders] = useState<HeaderField[]>([{ key: '', value: '' }]);

  const fetchEndpoint = useCallback(async () => {
    if (!endpointId) return;
    try {
      setLoading(true);
      const data = await getEndpointById(endpointId);
      const headersArray: HeaderField[] = data.headers
        ? Object.entries(data.headers).map(([key, value]) => ({ key, value: String(value) }))
        : [];
      setHeaders(headersArray.length ? headersArray : [{ key: '', value: '' }]);
      setFormData({
        name: data.name,
        url: data.url,
        method: data.method,
        headers: data.headers,
        body: data.body,
        expectedStatus: data.expectedStatus,
        interval: data.interval,
        timeout: data.timeout,
        thresholds: data.thresholds,
      });
    } catch {
      setError('Failed to load endpoint');
    } finally {
      setLoading(false);
    }
  }, [endpointId]);

  useEffect(() => {
    if (endpointId) fetchEndpoint();
  }, [endpointId, fetchEndpoint]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    // For number inputs, convert to number, but allow empty string
    let processedValue: string | number | undefined = value;
    
    if (type === 'number') {
      processedValue = value === '' ? undefined : Number(value);
    } else if (type === 'select-one' && name === 'interval') {
      // For interval select, convert to number
      processedValue = value === '' ? undefined : Number(value);
    } else {
      processedValue = value;
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(typeof prev[parent as keyof typeof prev] === 'object' &&
          prev[parent as keyof typeof prev] !== null
            ? (prev[parent as keyof typeof prev] as object)
            : {}),
          [child]: processedValue,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    }
  };

  const syncHeaders = (updated: HeaderField[]) => {
    const obj: Record<string, string> = {};
    updated.forEach((h) => { if (h.key && h.value) obj[h.key] = h.value; });
    setFormData((prev) => ({ ...prev, headers: obj }));
  };

  const handleHeaderChange = (index: number, field: keyof HeaderField, value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
    syncHeaders(updated);
  };

  const addHeader = () => setHeaders((prev) => [...prev, { key: '', value: '' }]);

  const removeHeader = (index: number) => {
    const updated = headers.filter((_, i) => i !== index);
    setHeaders(updated);
    syncHeaders(updated);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.name || formData.name.length < 3) {
      errors.push('Name must be at least 3 characters');
    }
    
    if (!formData.url) {
      errors.push('URL is required');
    } else {
      try { 
        new URL(formData.url); 
      } catch { 
        errors.push('Enter a valid URL with http:// or https://'); 
      }
    }
    
    if (formData.expectedStatus === undefined || formData.expectedStatus === null) {
      errors.push('Expected status code is required');
    } else if (formData.expectedStatus < 100 || formData.expectedStatus > 599) {
      errors.push('Expected status must be between 100 and 599');
    }
    
    if (formData.interval === undefined || formData.interval === null) {
      errors.push('Check interval is required');
    }
    
    if (formData.timeout === undefined || formData.timeout === null) {
      errors.push('Timeout is required');
    } else if (formData.timeout < 1000 || formData.timeout > 30000) {
      errors.push('Timeout must be between 1000ms and 30000ms');
    }
    
    if (formData.thresholds?.maxResponseTime === undefined || formData.thresholds?.maxResponseTime === null) {
      errors.push('Max response time is required');
    } else if (formData.thresholds.maxResponseTime < 100 || formData.thresholds.maxResponseTime > 30000) {
      errors.push('Max response time must be between 100ms and 30000ms');
    }
    
    if (formData.thresholds?.failureThreshold === undefined || formData.thresholds?.failureThreshold === null) {
      errors.push('Failure threshold is required');
    } else if (formData.thresholds.failureThreshold < 1 || formData.thresholds.failureThreshold > 10) {
      errors.push('Failure threshold must be between 1 and 10');
    }
    
    if (errors.length > 0) { 
      setError(errors.join('. ')); 
      return false; 
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);
    
    if (!validateForm()) return;
    
    setSaving(true);

    try {
      // Ensure all numeric values are numbers
      const submitData: CreateEndpointDTO = {
        name: formData.name,
        url: formData.url,
        method: formData.method,
        headers: formData.headers,
        body: formData.body || undefined,
        expectedStatus: Number(formData.expectedStatus),
        interval: Number(formData.interval) as 60 | 300 | 900,
        timeout: Number(formData.timeout),
        thresholds: {
          maxResponseTime: Number(formData.thresholds?.maxResponseTime),
          failureThreshold: Number(formData.thresholds?.failureThreshold),
        },
      };

      if (endpointId) {
        await updateEndpoint(endpointId, submitData as UpdateEndpointDTO);
        setSuccess('Endpoint updated successfully!');
      } else {
        await createEndpoint(submitData);
        setSuccess('Endpoint created successfully!');
      }

      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.response?.data?.errors) {
          setValidationErrors(err.response.data.errors);
          setError(err.response.data.message || 'Validation failed');
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to save endpoint. Please check your input.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="mb-7">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {endpointId ? 'Edit Monitor' : 'Add New Monitor'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {endpointId
              ? 'Update your API endpoint configuration'
              : 'Configure a new API endpoint to monitor'}
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            errors={validationErrors}
            onClose={() => { setError(null); setValidationErrors([]); }}
          />
        )}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess(null)} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Basic Info */}
          <Section icon={<Globe className="w-4 h-4" />} title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Monitor Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={inputCls}
                  placeholder="e.g., Production API"
                  required
                />
                <p className={hintCls}>3–100 characters</p>
              </div>

              <div>
                <label className={labelCls}>HTTP Method *</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleInputChange}
                  className={inputCls}
                  required
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>URL *</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className={inputCls}
                  placeholder="https://api.example.com/health"
                  required
                />
              </div>
            </div>
          </Section>

          {/* Headers */}
          <Section icon={<Shield className="w-4 h-4" />} title="Request Headers (Optional)">
            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeHeader(index)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addHeader}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/10 rounded-lg transition-colors border border-green-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Header
              </button>
            </div>
          </Section>

          {/* Request Body */}
          {(formData.method === 'POST' || formData.method === 'PUT') && (
            <Section icon={<Shield className="w-4 h-4" />} title="Request Body (Optional)">
              <textarea
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                rows={5}
                className={`${inputCls} font-mono resize-none`}
                placeholder='{"key": "value"}'
              />
            </Section>
          )}

          {/* Monitoring Config */}
          <Section icon={<Clock className="w-4 h-4" />} title="Monitoring Configuration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Expected Status Code *</label>
                <input
                  type="number"
                  name="expectedStatus"
                  value={formData.expectedStatus === undefined ? '' : formData.expectedStatus}
                  onChange={handleInputChange}
                  min="100"
                  max="599"
                  className={inputCls}
                  required
                  placeholder="200"
                />
              </div>

              <div>
                <label className={labelCls}>Check Interval *</label>
                <select
                  name="interval"
                  value={formData.interval === undefined ? '' : formData.interval}
                  onChange={handleInputChange}
                  className={inputCls}
                  required
                >
                  <option value="" disabled>Select interval</option>
                  <option value="60">Every 1 minute</option>
                  <option value="300">Every 5 minutes</option>
                  <option value="900">Every 15 minutes</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Timeout (ms) *</label>
                <input
                  type="number"
                  name="timeout"
                  value={formData.timeout === undefined ? '' : formData.timeout}
                  onChange={handleInputChange}
                  min="1000"
                  max="30000"
                  step="1000"
                  className={inputCls}
                  required
                  placeholder="10000"
                />
              </div>
            </div>
          </Section>

          {/* Thresholds */}
          <Section icon={<Zap className="w-4 h-4" />} title="Alert Thresholds">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Max Response Time (ms) *</label>
                <input
                  type="number"
                  name="thresholds.maxResponseTime"
                  value={formData.thresholds?.maxResponseTime === undefined ? '' : formData.thresholds?.maxResponseTime}
                  onChange={handleInputChange}
                  min="100"
                  max="30000"
                  step="100"
                  className={inputCls}
                  required
                  placeholder="5000"
                />
                <p className={hintCls}>Alert if response exceeds this value</p>
              </div>

              <div>
                <label className={labelCls}>Failure Threshold *</label>
                <input
                  type="number"
                  name="thresholds.failureThreshold"
                  value={formData.thresholds?.failureThreshold === undefined ? '' : formData.thresholds?.failureThreshold}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className={inputCls}
                  required
                  placeholder="3"
                />
                <p className={hintCls}>Consecutive failures before alert</p>
              </div>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {endpointId ? 'Update Monitor' : 'Create Monitor'}
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EndpointForm;
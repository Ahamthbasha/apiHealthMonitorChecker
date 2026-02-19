// src/pages/user/endpoint/EndpointForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  X,
  Plus,
  Trash2,
  Globe,
  Clock,
  Zap,
  Shield,
} from 'lucide-react';
import { createEndpoint, getEndpointById, updateEndpoint } from '../../../api/userAction/userAction';
import type { CreateEndpointDTO, UpdateEndpointDTO } from '../../../types/interface/apiInterface';

// Simple Loading Spinner Component
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}></div>
    </div>
  );
};

// Alert Component
const Alert: React.FC<{ 
  type: 'error' | 'success' | 'info' | 'warning'; 
  message: string; 
  errors?: Array<{ msg: string; path: string }>;
  onClose?: () => void;
}> = ({ type, message, errors, onClose }) => {
  const bgColors = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div className={`mb-4 p-4 rounded-lg border ${bgColors[type]}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          {errors && errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-sm">
              {errors.map((error, index) => (
                <li key={index} className="text-red-600">
                  {error.msg} ({error.path})
                </li>
              ))}
            </ul>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface HeaderField {
  key: string;
  value: string;
}

interface ValidationError {
  msg: string;
  path: string;
}

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
    expectedStatus: 200,
    interval: 300,
    timeout: 10000,
    thresholds: {
      maxResponseTime: 5000,
      failureThreshold: 3,
    },
  });

  const [headers, setHeaders] = useState<HeaderField[]>([{ key: '', value: '' }]);

  const fetchEndpoint = useCallback(async () => {
    if (!endpointId) return;
    
    try {
      setLoading(true);
      const data = await getEndpointById(endpointId);
      
      // Convert headers from Map to array
      const headersArray: HeaderField[] = [];
      if (data.headers) {
        Object.entries(data.headers).forEach(([key, value]) => {
          headersArray.push({ key, value: String(value) });
        });
      }
      
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
    } catch (error) {
      setError('Failed to load endpoint');
      console.error('Fetch endpoint error:', error);
    } finally {
      setLoading(false);
    }
  }, [endpointId]);

  useEffect(() => {
    if (endpointId) {
      fetchEndpoint();
    }
  }, [endpointId, fetchEndpoint]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => {
        const parentValue = prev[parent as keyof typeof prev];
        const numericValue = type === 'number' ? (value === '' ? undefined : parseInt(value)) : value;
        
        return {
          ...prev,
          [parent]: {
            ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
            [child]: numericValue,
          },
        };
      });
    } else {
      const numericValue = type === 'number' ? (value === '' ? undefined : parseInt(value)) : value;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    }
  };

  const handleHeaderChange = (index: number, field: keyof HeaderField, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);

    // Update formData.headers
    const headersObject: Record<string, string> = {};
    newHeaders.forEach((h) => {
      if (h.key && h.value) {
        headersObject[h.key] = h.value;
      }
    });
    setFormData((prev) => ({ ...prev, headers: headersObject }));
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders);

    // Update formData.headers
    const headersObject: Record<string, string> = {};
    newHeaders.forEach((h) => {
      if (h.key && h.value) {
        headersObject[h.key] = h.value;
      }
    });
    setFormData((prev) => ({ ...prev, headers: headersObject }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.name || formData.name.length < 3) {
      errors.push('Name must be at least 3 characters long');
    }
    if (!formData.url) {
      errors.push('URL is required');
    } else {
      try {
        new URL(formData.url);
      } catch {
        errors.push('Please enter a valid URL including http:// or https://');
      }
    }

    // Validate numeric fields
    if (formData.expectedStatus !== undefined) {
      if (formData.expectedStatus < 100 || formData.expectedStatus > 599) {
        errors.push('Expected status must be between 100 and 599');
      }
    }

    if (formData.timeout !== undefined) {
      if (formData.timeout < 1000 || formData.timeout > 30000) {
        errors.push('Timeout must be between 1000ms and 30000ms');
      }
    }

    if (formData.thresholds?.maxResponseTime !== undefined) {
      if (formData.thresholds.maxResponseTime < 100 || formData.thresholds.maxResponseTime > 30000) {
        errors.push('Max response time must be between 100ms and 30000ms');
      }
    }

    if (formData.thresholds?.failureThreshold !== undefined) {
      if (formData.thresholds.failureThreshold < 1 || formData.thresholds.failureThreshold > 10) {
        errors.push('Failure threshold must be between 1 and 10');
      }
    }

    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setValidationErrors([]);
    
    if (!validateForm()) return;

    setSaving(true);

    try {
      // Prepare data with proper numeric values
      const submitData: CreateEndpointDTO = {
        name: formData.name,
        url: formData.url,
        method: formData.method,
        headers: formData.headers,
        body: formData.body || undefined,
        expectedStatus: formData.expectedStatus || 200,
        interval: formData.interval || 300,
        timeout: formData.timeout || 10000,
        thresholds: {
          maxResponseTime: formData.thresholds?.maxResponseTime || 5000,
          failureThreshold: formData.thresholds?.failureThreshold || 3,
        },
      };

      if (endpointId) {
        const updateData: UpdateEndpointDTO = submitData;
        await updateEndpoint(endpointId, updateData);
        setSuccess('Endpoint updated successfully!');
      } else {
        await createEndpoint(submitData);
        setSuccess('Endpoint created successfully!');
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Submit error:', err);
      
      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
        setError(err.response.data.message || 'Validation failed');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to save endpoint. Please check your input.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {endpointId ? 'Edit Endpoint' : 'Create New Endpoint'}
          </h1>
          <p className="text-gray-600 mt-1">
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
            onClose={() => {
              setError(null);
              setValidationErrors([]);
            }} 
          />
        )}
        
        {success && (
          <Alert 
            type="success" 
            message={success} 
            onClose={() => setSuccess(null)} 
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Production API"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">3-100 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method *</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">URL *</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://api.example.com/health"
                  required
                />
              </div>
            </div>
          </div>

          {/* Headers */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Headers
            </h2>
            <div className="space-y-3">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeader(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addHeader}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Header
              </button>
            </div>
          </div>

          {/* Request Body */}
          {(formData.method === 'POST' || formData.method === 'PUT') && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Body</h2>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder='{"key": "value"}'
              />
            </div>
          )}

          {/* Monitoring Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Monitoring Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Status Code
                </label>
                <input
                  type="number"
                  name="expectedStatus"
                  value={formData.expectedStatus}
                  onChange={handleInputChange}
                  min="100"
                  max="599"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Default: 200</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Check Interval</label>
                <select
                  name="interval"
                  value={formData.interval}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="60">Every minute</option>
                  <option value="300">Every 5 minutes</option>
                  <option value="900">Every 15 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeout (ms)</label>
                <input
                  type="number"
                  name="timeout"
                  value={formData.timeout}
                  onChange={handleInputChange}
                  min="1000"
                  max="30000"
                  step="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Default: 10000ms (10s)</p>
              </div>
            </div>
          </div>

          {/* Thresholds */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Alert Thresholds
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Response Time (ms)
                </label>
                <input
                  type="number"
                  name="thresholds.maxResponseTime"
                  value={formData.thresholds?.maxResponseTime}
                  onChange={handleInputChange}
                  min="100"
                  max="30000"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Alert if response time exceeds this value (Default: 5000ms)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Failure Threshold
                </label>
                <input
                  type="number"
                  name="thresholds.failureThreshold"
                  value={formData.thresholds?.failureThreshold}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of consecutive failures before alert (Default: 3)
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {endpointId ? 'Update Endpoint' : 'Create Endpoint'}
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
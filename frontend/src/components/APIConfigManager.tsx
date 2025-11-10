import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface APIConfig {
    id: number;
    provider_name: string;
    mode: string;
    api_key?: string;
    client_id?: string;
    client_secret?: string;
    api_url: string;
    rate_limit: number;
    timeout: number;
    cache_ttl: number;
    is_enabled: boolean;
    is_primary: boolean;
    last_tested?: string;
    test_status?: string;
}

interface TabProps {
    mode: string;
    onSelect: (mode: string) => void;
    active: boolean;
}

const APIConfigTab: React.FC<TabProps> = ({ mode, onSelect, active }) => {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (active) {
            fetchStatistics(mode);
        }
    }, [active, mode]);

    const fetchStatistics = async (selectedMode: string) => {
        try {
            const response = await axios.get('/backend/api/admin_api_config.php?action=stats');
            if (response.data.success && response.data.data[selectedMode]) {
                setStats(response.data.data[selectedMode]);
            }
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const modeLabel = {
        flight: '✈️ Flights',
        bus: '🚌 Buses',
        train: '🚂 Trains'
    }[mode] || mode;

    return (
        <button
            onClick={() => onSelect(mode)}
            className={`px-4 py-2 font-medium transition-colors ${
                active
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'border-b-2 border-transparent text-gray-600 hover:text-gray-800'
            }`}
        >
            {modeLabel}
            {stats && (
                <span className="ml-2 text-sm">
                    ({stats.enabled}/{stats.total} active)
                </span>
            )}
        </button>
    );
};

interface APIFormProps {
    config?: APIConfig;
    mode: string;
    onSave: (data: any) => void;
    onCancel: () => void;
    loading: boolean;
}

const APIConfigForm: React.FC<APIFormProps> = ({ config, mode, onSave, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        provider_name: config?.provider_name || '',
        mode: mode,
        api_url: config?.api_url || '',
        api_key: '',
        client_id: config?.client_id || '',
        client_secret: '',
        rate_limit: config?.rate_limit || 100,
        timeout: config?.timeout || 30,
        cache_ttl: config?.cache_ttl || 3600,
        is_enabled: config?.is_enabled || false,
        is_primary: config?.is_primary || false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as any;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as any).checked : value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provider Name *
                    </label>
                    <input
                        type="text"
                        name="provider_name"
                        value={formData.provider_name}
                        onChange={handleChange}
                        disabled={!!config}
                        placeholder="e.g., skyscanner"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        API URL *
                    </label>
                    <input
                        type="url"
                        name="api_url"
                        value={formData.api_url}
                        onChange={handleChange}
                        placeholder="https://api.example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key
                    </label>
                    <input
                        type="password"
                        name="api_key"
                        value={formData.api_key}
                        onChange={handleChange}
                        placeholder="Enter API key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client ID
                    </label>
                    <input
                        type="text"
                        name="client_id"
                        value={formData.client_id}
                        onChange={handleChange}
                        placeholder="Enter client ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret
                </label>
                <input
                    type="password"
                    name="client_secret"
                    value={formData.client_secret}
                    onChange={handleChange}
                    placeholder="Enter client secret"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate Limit
                    </label>
                    <input
                        type="number"
                        name="rate_limit"
                        value={formData.rate_limit}
                        onChange={handleChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">requests/min</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeout
                    </label>
                    <input
                        type="number"
                        name="timeout"
                        value={formData.timeout}
                        onChange={handleChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">seconds</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cache TTL
                    </label>
                    <input
                        type="number"
                        name="cache_ttl"
                        value={formData.cache_ttl}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">seconds</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        name="is_enabled"
                        checked={formData.is_enabled}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable this API</span>
                </label>

                <label className="flex items-center">
                    <input
                        type="checkbox"
                        name="is_primary"
                        checked={formData.is_primary}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                </label>
            </div>

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                    {loading ? 'Saving...' : 'Save Configuration'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

interface APIListItemProps {
    config: APIConfig;
    onEdit: (config: APIConfig) => void;
    onDelete: (provider: string) => void;
    onToggle: (provider: string, enabled: boolean) => void;
    onTest: (provider: string) => void;
    loading: boolean;
}

const APIConfigListItem: React.FC<APIListItemProps> = ({
    config,
    onEdit,
    onDelete,
    onToggle,
    onTest,
    loading
}) => {
    const statusColor = {
        success: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800'
    }[config.test_status || 'pending'] || 'bg-gray-100 text-gray-800';

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900">{config.provider_name}</h3>
                    <p className="text-sm text-gray-600">{config.api_url}</p>
                </div>
                <div className="flex gap-2">
                    {config.is_primary && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            Primary
                        </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColor}`}>
                        {config.test_status || 'Not tested'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm mb-3 text-gray-600">
                <div>
                    <span className="font-medium">Rate:</span> {config.rate_limit}/min
                </div>
                <div>
                    <span className="font-medium">Timeout:</span> {config.timeout}s
                </div>
                <div>
                    <span className="font-medium">Cache:</span> {config.cache_ttl}s
                </div>
                {config.last_tested && (
                    <div>
                        <span className="font-medium">Tested:</span>{' '}
                        {new Date(config.last_tested).toLocaleDateString()}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onToggle(config.provider_name, !config.is_enabled)}
                    disabled={loading}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        config.is_enabled
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    } disabled:opacity-50`}
                >
                    {config.is_enabled ? '✓ Enabled' : 'Disabled'}
                </button>
                <button
                    onClick={() => onTest(config.provider_name)}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
                >
                    Test
                </button>
                <button
                    onClick={() => onEdit(config)}
                    className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded text-sm font-medium hover:bg-gray-100"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(config.provider_name)}
                    className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded text-sm font-medium hover:bg-red-100"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export const APIConfigManager: React.FC = () => {
    const [activeMode, setActiveMode] = useState<string>('flight');
    const [configs, setConfigs] = useState<APIConfig[]>([]);
    const [editingConfig, setEditingConfig] = useState<APIConfig | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

    useEffect(() => {
        fetchConfigurations();
    }, []);

    const fetchConfigurations = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/backend/api/admin_api_config.php?action=all');
            if (response.data.success) {
                setConfigs(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching configurations:', error);
            setMessage({ type: 'error', text: 'Failed to load configurations' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: any) => {
        try {
            setLoading(true);
            const response = await axios.post('/backend/api/admin_api_config.php?action=save', data);
            
            if (response.data.success) {
                setMessage({ type: 'success', text: 'Configuration saved successfully' });
                setShowForm(false);
                setEditingConfig(null);
                fetchConfigurations();
            } else {
                setMessage({ type: 'error', text: response.data.error || 'Failed to save' });
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            setMessage({ type: 'error', text: 'Failed to save configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (provider: string, enabled: boolean) => {
        try {
            setLoading(true);
            const response = await axios.put('/backend/api/admin_api_config.php?action=toggle', {
                provider_name: provider,
                enabled: enabled
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: 'API toggled successfully' });
                fetchConfigurations();
            }
        } catch (error) {
            console.error('Error toggling API:', error);
            setMessage({ type: 'error', text: 'Failed to toggle API' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (provider: string) => {
        if (!window.confirm('Are you sure you want to delete this configuration?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await axios.delete(
                `/backend/api/admin_api_config.php?action=delete&provider=${provider}`
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Configuration deleted' });
                fetchConfigurations();
            }
        } catch (error) {
            console.error('Error deleting configuration:', error);
            setMessage({ type: 'error', text: 'Failed to delete configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async (provider: string) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/backend/api/admin_api_config.php?action=test&provider=${provider}`
            );

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: `Connection test: ${response.data.message}`
                });
            } else {
                setMessage({ type: 'error', text: response.data.error });
            }
            fetchConfigurations();
        } catch (error) {
            console.error('Error testing connection:', error);
            setMessage({ type: 'error', text: 'Failed to test connection' });
        } finally {
            setLoading(false);
        }
    };

    const filteredConfigs = configs.filter(
        (c) => c.mode.toLowerCase() === activeMode.toLowerCase()
    );

    return (
        <div className="space-y-6">
            {message && (
                <div
                    className={`p-4 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div className="flex gap-6">
                        <APIConfigTab
                            mode="flight"
                            onSelect={setActiveMode}
                            active={activeMode === 'flight'}
                        />
                        <APIConfigTab
                            mode="bus"
                            onSelect={setActiveMode}
                            active={activeMode === 'bus'}
                        />
                        <APIConfigTab
                            mode="train"
                            onSelect={setActiveMode}
                            active={activeMode === 'train'}
                        />
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => {
                                setEditingConfig(null);
                                setShowForm(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                        >
                            + Add Provider
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {showForm ? (
                        <APIConfigForm
                            config={editingConfig || undefined}
                            mode={activeMode}
                            onSave={handleSave}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingConfig(null);
                            }}
                            loading={loading}
                        />
                    ) : (
                        <div className="space-y-3">
                            {filteredConfigs.length > 0 ? (
                                filteredConfigs.map((config) => (
                                    <APIConfigListItem
                                        key={config.id}
                                        config={config}
                                        onEdit={(cfg) => {
                                            setEditingConfig(cfg);
                                            setShowForm(true);
                                        }}
                                        onDelete={handleDelete}
                                        onToggle={handleToggle}
                                        onTest={handleTest}
                                        loading={loading}
                                    />
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">
                                    No API configurations yet. Click "Add Provider" to create one.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default APIConfigManager;

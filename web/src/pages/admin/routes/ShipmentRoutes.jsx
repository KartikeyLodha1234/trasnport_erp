import React, { useState, useEffect } from 'react';

export default function Routes() {
  const [shipments, setShipments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    destination: '',
    pickup_location: '',
    delivery_location: ''
  });

  const API_BASE = 'http://localhost:8001/api';

  // Fetch shipments
  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE}/shipments`, { headers });
      const result = await response.json();
      if (result.success) {
        setShipments(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Shipment route created successfully!');
        setIsModalOpen(false);
        fetchShipments();
        setFormData({ client: '', destination: '', pickup_location: '', delivery_location: '' });
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('❌ Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-900">🛣️ Routes</h2>
            <p className="text-gray-600 mt-2">Manage all shipment routes and deliveries efficiently.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <span className="mr-2 text-lg">+</span> New Shipment
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="text-gray-600 text-sm font-medium">Total Routes</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{shipments.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="text-gray-600 text-sm font-medium">Active Routes</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{shipments.filter(s => s.status === 'in-transit').length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="text-gray-600 text-sm font-medium">Pending</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{shipments.filter(s => s.status === 'pending').length}</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h5 className="text-xl font-bold text-white">📋 All Shipment Routes</h5>
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {shipments.length} Route{shipments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Client</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Pickup</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Destination</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shipments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="text-lg font-semibold mb-2">📦 No routes yet</div>
                      <p>Create your first shipment route to get started!</p>
                    </td>
                  </tr>
                ) : (
                  shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">#{shipment.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{shipment.client || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{shipment.pickup_location || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{shipment.destination || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          shipment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {shipment.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors font-medium" title="View">
                            👁️
                          </button>
                          <button className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors font-medium" title="Edit">
                            ✏️
                          </button>
                          <button className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors font-medium" title="Delete">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="flex items-center justify-center min-h-screen px-4 py-8 sm:py-16">
            <div
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                  <h5 className="text-2xl font-bold text-gray-900">➕ New Shipment Route</h5>
                  <p className="text-sm text-gray-600 mt-1">Enter route details to create a new shipment</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6 max-h-96 overflow-y-auto">
                <form onSubmit={handleCreateShipment} className="space-y-6">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🏢 Client Name *
                      </label>
                      <input
                        type="text"
                        name="client"
                        value={formData.client}
                        onChange={handleChange}
                        placeholder="Enter client name"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📍 Destination *
                      </label>
                      <input
                        type="text"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        placeholder="Enter destination city"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📍 Pickup Location
                      </label>
                      <input
                        type="text"
                        name="pickup_location"
                        value={formData.pickup_location}
                        onChange={handleChange}
                        placeholder="Starting point"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🛣️ Delivery Location
                      </label>
                      <input
                        type="text"
                        name="delivery_location"
                        value={formData.delivery_location}
                        onChange={handleChange}
                        placeholder="Final delivery point"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col-reverse sm:flex-row gap-3 sm:gap-3 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateShipment}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Creating...' : '✓ Create Route'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

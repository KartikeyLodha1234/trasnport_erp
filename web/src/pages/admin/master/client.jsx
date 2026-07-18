import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Download,
  Mail,
  Phone,
  Truck,
  FileText,
  DollarSign,
} from 'lucide-react';

const API_BASE = 'http://localhost:8001/api'; // Adjust to your FastAPI URL

const statusColors = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  inactive: { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
};

const statusLabels = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
};

// --- Main Component ---
const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      const response = await axios.get(`${API_BASE}/clients/`, { params });
      // Normalize data for frontend
      const normalized = response.data.map((client) => ({
        ...client,
        _id: client.id,
        company: client.company_name || client.company,
        contactPerson: client.contact_person || client.contactPerson || '',
        vehicleCount: client.vehicle_count || client.vehicleCount || 0,
        totalSpent: client.total_spent || client.totalSpent || 0,
        contracts: client.contracts || 0,
        joined: client.created_at ? client.created_at.split('T')[0] : '',
        status: (client.status || 'active').toLowerCase(),
      }));
      setClients(normalized);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchTerm, filterStatus]);

  // Stats
  const stats = [
    { title: 'Total Clients', value: clients.length, icon: Users, color: '#3B82F6' },
    {
      title: 'Active Clients',
      value: clients.filter((c) => c.status === 'active').length,
      icon: CheckCircle,
      color: '#10B981',
    },
    {
      title: 'Pending',
      value: clients.filter((c) => c.status === 'pending').length,
      icon: Clock,
      color: '#F59E0B',
    },
    {
      title: 'Inactive',
      value: clients.filter((c) => c.status === 'inactive').length,
      icon: AlertCircle,
      color: '#EF4444',
    },
  ];

  // Handlers
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/clients/${id}`);
      setClients(clients.filter((c) => c._id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
    }
  };

  const handleAddClient = async (newClient) => {
    try {
      const payload = {
        company_name: newClient.company,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address || '',
        status: newClient.status,
      };
      const response = await axios.post(`${API_BASE}/clients/`, payload);
      const created = response.data;
      const normalized = {
        ...created,
        _id: created.id,
        company: created.company_name || created.company,
        contactPerson: created.contact_person || newClient.contactPerson || '',
        vehicleCount: created.vehicle_count || 0,
        totalSpent: created.total_spent || 0,
        contracts: created.contracts || 0,
        joined: created.created_at ? created.created_at.split('T')[0] : newClient.joined,
        status: (created.status || 'active').toLowerCase(),
      };
      setClients([...clients, normalized]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans antialiased">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Client Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your clients and their contracts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus size={18} /> Add New Client
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon size={22} style={{ color: stat.color }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {stat.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, phone or contact..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors">
              <Filter size={16} /> Filters
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left py-3.5 px-4 md:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left py-3.5 px-4 md:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Contact
                </th>
                <th className="text-left py-3.5 px-4 md:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Vehicles
                </th>
                <th className="text-left py-3.5 px-4 md:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-3.5 px-4 md:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-gray-400">
                    <p className="text-sm font-medium">Loading clients...</p>
                  </td>
                </tr>
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <ClientRow
                    key={client._id}
                    client={client}
                    onView={() => setSelectedClient(client)}
                    onDelete={() => setShowDeleteConfirm(client._id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 text-gray-300" />
                      <p className="text-sm font-medium">No clients found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
          <span>Showing {clients.length} clients</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">Prev</button>
            <button className="px-3 py-1 rounded-lg bg-indigo-600 text-white">1</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" /> Recent Activity
        </h3>
        <ActivityFeed />
      </div>

      {/* Modals */}
      {selectedClient && (
        <ClientDetailModal client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}
      {showAddModal && (
        <AddClientModal onClose={() => setShowAddModal(false)} onAdd={handleAddClient} />
      )}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

// --- Client Row Component ---
const ClientRow = ({ client, onView, onDelete }) => {
  const status = statusColors[client.status] || statusColors.inactive;
  const label = statusLabels[client.status] || client.status;

  return (
    <tr className="hover:bg-gray-50/80 transition-colors group">
      <td className="py-3.5 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
            {(client.company || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-800">{client.company}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Mail size={12} /> {client.email}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 md:px-6 hidden md:table-cell">
        <div className="text-sm text-gray-700">{client.contactPerson}</div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Phone size={12} /> {client.phone}
        </div>
      </td>
      <td className="py-3.5 px-4 md:px-6 hidden lg:table-cell">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
          <Truck size={12} /> {client.vehicleCount}
        </span>
      </td>
      <td className="py-3.5 px-4 md:px-6">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {label}
        </span>
      </td>
      <td className="py-3.5 px-4 md:px-6 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={onView}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
            title="View"
          >
            <Eye size={17} />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
            title="Edit"
          >
            <Edit size={17} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={17} />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="More"
          >
            <MoreVertical size={17} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- Activity Feed ---
const ActivityFeed = () => {
  const activities = [
    { time: '15 min ago', text: 'ABC Logistics added 3 new vehicles', icon: Truck, color: 'text-blue-500' },
    { time: '1 hour ago', text: 'City Express renewed contract for 2026', icon: CheckCircle, color: 'text-emerald-500' },
    { time: '3 hours ago', text: 'QuickShip invoice #345 is due', icon: DollarSign, color: 'text-amber-500' },
    { time: 'Yesterday', text: 'Global Freight Inc. created new shipment order', icon: FileText, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <activity.icon size={14} className={activity.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">{activity.text}</p>
            <span className="text-xs text-gray-400">{activity.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Client Detail Modal ---
const ClientDetailModal = ({ client, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
              {(client.company || 'C').charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{client.company}</h2>
              <p className="text-xs text-gray-400">{client.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Contact Person</p>
              <p className="font-medium text-gray-800">{client.contactPerson || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Phone</p>
              <p className="font-medium text-gray-800">{client.phone || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Vehicles</p>
              <p className="font-medium text-gray-800">{client.vehicleCount || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Status</p>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                statusColors[client.status]?.bg || 'bg-gray-100'
              } ${statusColors[client.status]?.text || 'text-gray-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusColors[client.status]?.dot || 'bg-gray-400'}`} />
                {statusLabels[client.status] || client.status}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Joined</p>
              <p className="font-medium text-gray-800">{client.joined || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Total Spent</p>
              <p className="font-medium text-gray-800">${(client.totalSpent || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-xs text-gray-500">Contracts</p>
            <p className="text-lg font-bold text-indigo-700">{client.contracts || 0} active contracts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Add Client Modal ---
const AddClientModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    company: '',
    email: '',
    contactPerson: '',
    phone: '',
    vehicleCount: 0,
    status: 'active',
    address: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...form,
      vehicleCount: parseInt(form.vehicleCount) || 0,
      joined: new Date().toISOString().split('T')[0],
      totalSpent: 0,
      contracts: 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Add New Client</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-medium text-white transition-colors"
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Delete Confirm Modal ---
const DeleteConfirmModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-rose-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Delete Client?</h3>
        <p className="text-sm text-gray-500 mt-1">
          This action cannot be undone. All associated data will be removed.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-sm font-medium text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
// ClientsPage.jsx
import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';

const ClientsPage = () => {
  const [clients, setClients] = useState([
    // Sample data - replace with API call
    {
      _id: 1,
      company: 'ABC Logistics',
      email: 'info@abclogistics.com',
      contactPerson: 'John Smith',
      vehicleCount: 12,
      status: 'active'
    },
    {
      _id: 2,
      company: 'City Express',
      email: 'contact@cityexpress.com',
      contactPerson: 'Sarah Johnson',
      vehicleCount: 8,
      status: 'pending'
    },
    {
      _id: 3,
      company: 'QuickShip Solutions',
      email: 'support@quickship.com',
      contactPerson: 'Mike Wilson',
      vehicleCount: 5,
      status: 'inactive'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  // Stats Cards Data
  const stats = [
    {
      title: 'Total Clients',
      value: '247',
      icon: Users,
      color: '#3B82F6'
    },
    {
      title: 'Active Contracts',
      value: '189',
      icon: CheckCircle,
      color: '#10B981'
    },
    {
      title: 'Pending Invoices',
      value: '34',
      icon: Clock,
      color: '#F59E0B'
    },
    {
      title: 'Issues',
      value: '12',
      icon: AlertCircle,
      color: '#EF4444'
    }
  ];

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">Manage your clients and their contracts</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Add New Client
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search clients by name, email, or contact..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <select 
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2">
              <Filter size={18} /> Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Client Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Contact</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Vehicles</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <ClientRow key={client._id} client={client} />
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    No clients found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <ActivityFeed />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
    </div>
  );
};

// Client Row Component
const ClientRow = ({ client }) => {
  const statusColors = {
    active: { bg: '#10B981', text: 'white' },
    pending: { bg: '#F59E0B', text: 'white' },
    inactive: { bg: '#EF4444', text: 'white' }
  };

  const statusLabels = {
    active: 'Active',
    pending: 'Pending',
    inactive: 'Inactive'
  };

  const color = statusColors[client.status] || statusColors.inactive;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {client.company.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{client.company}</div>
            <div className="text-sm text-gray-500">{client.email}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-gray-700">{client.contactPerson}</td>
      <td className="py-4 px-6">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-semibold text-sm">
          {client.vehicleCount}
        </span>
      </td>
      <td className="py-4 px-6">
        <span 
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: `${color.bg}20`,
            color: color.bg
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: color.bg }} />
          {statusLabels[client.status] || client.status}
        </span>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700" title="View">
            <Eye size={18} />
          </button>
          <button className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600 hover:text-green-700" title="Edit">
            <Edit size={18} />
          </button>
          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700" title="Delete">
            <Trash2 size={18} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-700" title="More">
            <MoreVertical size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Activity Feed Component
const ActivityFeed = () => {
  const activities = [
    { time: '15 min ago', text: 'ABC Logistics added 3 new vehicles' },
    { time: '1 hour ago', text: 'City Express renewed contract' },
    { time: '3 hours ago', text: 'QuickShip invoice #345 due' },
  ];

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-gray-800">{activity.text}</p>
            <span className="text-sm text-gray-500">{activity.time}</span>
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <p className="text-gray-500 text-center py-8">No recent activity</p>
      )}
    </div>
  );
};

export default ClientsPage;
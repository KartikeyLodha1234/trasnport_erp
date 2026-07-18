import { useState, useEffect } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

const API_BASE = "http://localhost:8001/api";

export default function Parties() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    type: "both",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    gstin: "",
    status: "active"
  });

  // Fetch parties from API
  const fetchParties = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/parties/`);
      const data = response.data.data || response.data || [];
      setParties(data);
    } catch (error) {
      console.error("Error fetching parties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  // Handle Form Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Create New Party
  const handleCreateParty = async () => {
    if (!formData.name) {
      alert("Please enter party name");
      return;
    }

    try {
      await axios.post(`${API_BASE}/parties/`, formData);
      fetchParties();
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error creating party:", error);
      alert("Failed to create party: " + (error.response?.data?.detail || error.message));
    }
  };

  // Edit Party
  const handleEditParty = async () => {
    if (!formData.name) {
      alert("Please enter party name");
      return;
    }

    try {
      await axios.put(`${API_BASE}/parties/${selectedParty.id}`, formData);
      fetchParties();
      resetForm();
      setEditOpen(false);
      setSelectedParty(null);
    } catch (error) {
      console.error("Error updating party:", error);
      alert("Failed to update party");
    }
  };

  // Delete Party
  const handleDeleteParty = async (id) => {
    if (window.confirm("Are you sure you want to delete this party?")) {
      try {
        await axios.delete(`${API_BASE}/parties/${id}`);
        fetchParties();
      } catch (error) {
        console.error("Error deleting party:", error);
        alert("Failed to delete party");
      }
    }
  };

  // View Party
  const handleViewParty = (party) => {
    setSelectedParty(party);
    setViewOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (party) => {
    setSelectedParty(party);
    setFormData({
      name: party.name || "",
      type: party.type || "both",
      email: party.email || "",
      phone: party.phone || "",
      address: party.address || "",
      city: party.city || "",
      state: party.state || "",
      gstin: party.gstin || "",
      status: party.status || "active"
    });
    setEditOpen(true);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      name: "",
      type: "both",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      gstin: "",
      status: "active"
    });
  };

  // Filter Parties
  const filteredParties = parties.filter(party => {
    const matchesSearch =
      (party.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (party.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (party.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (party.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (party.gstin || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || party.type === filterType;

    return matchesSearch && matchesType;
  });

  // Stats
  const stats = {
    total: parties.length,
    consignors: parties.filter(p => p.type === "consignor" || p.type === "both").length,
    consignees: parties.filter(p => p.type === "consignee" || p.type === "both").length,
    active: parties.filter(p => p.status === "active").length
  };

  const getTypeBadge = (type) => {
    const types = {
      'consignor': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Consignor' },
      'consignee': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Consignee' },
      'both': { bg: 'bg-green-100', text: 'text-green-700', label: 'Both' },
    };
    return types[type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: type };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Parties</h1>
          <p className="text-gray-500">Manage consignors, consignees, and business partners.</p>
        </div>
        <button
          onClick={() => { resetForm(); setOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} /> New Party
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Parties</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-600"><Users size={24} /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Consignors</p>
              <p className="text-2xl font-bold text-blue-600">{stats.consignors}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-600"><Building2 size={24} /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Consignees</p>
              <p className="text-2xl font-bold text-purple-600">{stats.consignees}</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 text-purple-600"><Users size={24} /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3 text-green-600"><CheckCircle size={24} /></div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, phone, city, or GSTIN..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="consignor">Consignor</option>
            <option value="consignee">Consignee</option>
            <option value="both">Both</option>
          </select>
          <button className="rounded-lg bg-gray-200 px-4 py-2.5 hover:bg-gray-300">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Parties Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">📋 All Parties</h2>
          <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
            {filteredParties.length} Party{filteredParties.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-medium">ID</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Contact</th>
                <th className="px-5 py-3 text-left text-sm font-medium">City</th>
                <th className="px-5 py-3 text-left text-sm font-medium">GSTIN</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">Loading parties...</td>
                </tr>
              ) : filteredParties.length > 0 ? (
                filteredParties.map((item) => {
                  const typeBadge = getTypeBadge(item.type);
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">#{item.id}</td>
                      <td className="px-5 py-4 font-medium text-gray-800">{item.name}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm">
                          {item.email && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Mail size={12} /> {item.email}
                            </div>
                          )}
                          {item.phone && (
                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                              <Phone size={12} /> {item.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} className="text-blue-500" />
                          {item.city || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-gray-600">{item.gstin || 'N/A'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            item.status === "active" ? "bg-green-500" : "bg-red-500"
                          }`} />
                          {item.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewParty(item)}
                            className="rounded-lg bg-sky-500 p-2 text-white transition hover:bg-sky-600"
                            title="View"
                          ><Eye size={18} /></button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded-lg bg-yellow-500 p-2 text-white transition hover:bg-yellow-600"
                            title="Edit"
                          ><Pencil size={18} /></button>
                          <button
                            onClick={() => handleDeleteParty(item.id)}
                            className="rounded-lg bg-red-500 p-2 text-white transition hover:bg-red-600"
                            title="Delete"
                          ><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={40} className="text-gray-400" />
                      <p>No parties found</p>
                      <button onClick={() => { resetForm(); setOpen(true); }} className="text-blue-600 hover:underline">
                        Create a new party
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Party Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">➕ New Party</h2>
              <button onClick={() => { setOpen(false); resetForm(); }} className="rounded-lg p-1 hover:bg-gray-100">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Party Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                    placeholder="Company / Person name" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500">
                    <option value="consignor">Consignor (Sender)</option>
                    <option value="consignee">Consignee (Receiver)</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                    placeholder="email@example.com" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                    placeholder="+91 98765 43210" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange}
                    placeholder="Mumbai" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange}
                    placeholder="Maharashtra" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">GSTIN</label>
                  <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange}
                    placeholder="27AABCG1234Q1Z5" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500 font-mono" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"
                  placeholder="Full address..." className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={() => { setOpen(false); resetForm(); }} className="rounded-lg border px-5 py-2 hover:bg-gray-100">Cancel</button>
              <button onClick={handleCreateParty} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Create Party</button>
            </div>
          </div>
        </div>
      )}

      {/* View Party Modal */}
      {viewOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">👁️ Party Details</h2>
              <button onClick={() => setViewOpen(false)} className="rounded-lg p-1 hover:bg-gray-100"><X size={22} /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div><label className="text-sm text-gray-500">Party ID</label><p className="text-lg font-semibold">#{selectedParty.id}</p></div>
                <div><label className="text-sm text-gray-500">Name</label><p className="text-lg font-semibold">{selectedParty.name}</p></div>
                <div><label className="text-sm text-gray-500">Type</label><p className="text-lg font-semibold capitalize">{selectedParty.type}</p></div>
                <div><label className="text-sm text-gray-500">Status</label>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                    selectedParty.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>{selectedParty.status === "active" ? "Active" : "Inactive"}</span>
                </div>
                <div><label className="text-sm text-gray-500">Email</label><p>{selectedParty.email || 'N/A'}</p></div>
                <div><label className="text-sm text-gray-500">Phone</label><p>{selectedParty.phone || 'N/A'}</p></div>
                <div><label className="text-sm text-gray-500">City</label><p>{selectedParty.city || 'N/A'}</p></div>
                <div><label className="text-sm text-gray-500">State</label><p>{selectedParty.state || 'N/A'}</p></div>
                <div><label className="text-sm text-gray-500">GSTIN</label><p className="font-mono">{selectedParty.gstin || 'N/A'}</p></div>
                <div><label className="text-sm text-gray-500">Address</label><p>{selectedParty.address || 'N/A'}</p></div>
              </div>
            </div>
            <div className="flex justify-end border-t px-6 py-4">
              <button onClick={() => setViewOpen(false)} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Party Modal */}
      {editOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">✏️ Edit Party</h2>
              <button onClick={() => { setEditOpen(false); resetForm(); setSelectedParty(null); }} className="rounded-lg p-1 hover:bg-gray-100"><X size={22} /></button>
            </div>
            <div className="space-y-5 p-6">
              <div><label className="text-sm text-gray-500">Party ID</label><p className="text-lg font-semibold">#{selectedParty.id}</p></div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Party Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500">
                    <option value="consignor">Consignor</option>
                    <option value="consignee">Consignee</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">GSTIN</label>
                  <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500 font-mono" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={() => { setEditOpen(false); resetForm(); setSelectedParty(null); }} className="rounded-lg border px-5 py-2 hover:bg-gray-100">Cancel</button>
              <button onClick={handleEditParty} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Update Party</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
  Building2,
  MapPin
} from "lucide-react";

const API_BASE = "http://localhost:8001/api";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: ""
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/branches/`);
      const data = response.data.data || response.data || [];
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateBranch = async () => {
    if (!formData.name) {
      alert("Please enter branch name");
      return;
    }
    try {
      await axios.post(`${API_BASE}/branches/`, formData);
      fetchBranches();
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error creating branch:", error);
      alert("Failed to create branch: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditBranch = async () => {
    if (!formData.name) {
      alert("Please enter branch name");
      return;
    }
    try {
      await axios.put(`${API_BASE}/branches/${selectedBranch.id}`, formData);
      fetchBranches();
      resetForm();
      setEditOpen(false);
      setSelectedBranch(null);
    } catch (error) {
      console.error("Error updating branch:", error);
      alert("Failed to update branch");
    }
  };

  const handleDeleteBranch = async (id) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      try {
        await axios.delete(`${API_BASE}/branches/${id}`);
        fetchBranches();
      } catch (error) {
        console.error("Error deleting branch:", error);
        alert("Failed to delete branch");
      }
    }
  };

  const handleViewBranch = (branch) => {
    setSelectedBranch(branch);
    setViewOpen(true);
  };

  const openEditModal = (branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || ""
    });
    setEditOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", city: "", state: "" });
  };

  const filteredBranches = branches.filter(branch => {
    return (
      (branch.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branch.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branch.state || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const stats = {
    total: branches.length
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Branches</h1>
          <p className="text-gray-500">Manage company branches and office locations.</p>
        </div>
        <button
          onClick={() => { resetForm(); setOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} /> New Branch
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Branches</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-600"><Building2 size={24} /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.total}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3 text-green-600"><CheckCircle size={24} /></div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, city, or state..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="rounded-lg bg-gray-200 px-4 py-2.5 hover:bg-gray-300">
          <Filter size={20} />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">📋 All Branches</h2>
          <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
            {filteredBranches.length} Branch{filteredBranches.length !== 1 ? 'es' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-medium">ID</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-5 py-3 text-left text-sm font-medium">City</th>
                <th className="px-5 py-3 text-left text-sm font-medium">State</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Address</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">Loading branches...</td>
                </tr>
              ) : filteredBranches.length > 0 ? (
                filteredBranches.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">#{item.id}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{item.name}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} className="text-blue-500" />
                        {item.city || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4">{item.state || 'N/A'}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{item.address || 'N/A'}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleViewBranch(item)} className="rounded-lg bg-sky-500 p-2 text-white transition hover:bg-sky-600" title="View"><Eye size={18} /></button>
                        <button onClick={() => openEditModal(item)} className="rounded-lg bg-yellow-500 p-2 text-white transition hover:bg-yellow-600" title="Edit"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteBranch(item.id)} className="rounded-lg bg-red-500 p-2 text-white transition hover:bg-red-600" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={40} className="text-gray-400" />
                      <p>No branches found</p>
                      <button onClick={() => { resetForm(); setOpen(true); }} className="text-blue-600 hover:underline">Create a new branch</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">➕ New Branch</h2>
              <button onClick={() => { setOpen(false); resetForm(); }} className="rounded-lg p-1 hover:bg-gray-100"><X size={22} /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Branch Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Head Office / Mumbai Branch" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Mumbai" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="Maharashtra" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" placeholder="Full address..." className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={() => { setOpen(false); resetForm(); }} className="rounded-lg border px-5 py-2 hover:bg-gray-100">Cancel</button>
              <button onClick={handleCreateBranch} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Create Branch</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewOpen && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">👁️ Branch Details</h2>
              <button onClick={() => setViewOpen(false)} className="rounded-lg p-1 hover:bg-gray-100"><X size={22} /></button>
            </div>
            <div className="space-y-4 p-6">
              <div><label className="text-sm text-gray-500">ID</label><p className="text-lg font-semibold">#{selectedBranch.id}</p></div>
              <div><label className="text-sm text-gray-500">Name</label><p className="text-lg font-semibold">{selectedBranch.name}</p></div>
              <div><label className="text-sm text-gray-500">City</label><p>{selectedBranch.city || 'N/A'}</p></div>
              <div><label className="text-sm text-gray-500">State</label><p>{selectedBranch.state || 'N/A'}</p></div>
              <div><label className="text-sm text-gray-500">Address</label><p>{selectedBranch.address || 'N/A'}</p></div>
            </div>
            <div className="flex justify-end border-t px-6 py-4">
              <button onClick={() => setViewOpen(false)} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">✏️ Edit Branch</h2>
              <button onClick={() => { setEditOpen(false); resetForm(); setSelectedBranch(null); }} className="rounded-lg p-1 hover:bg-gray-100"><X size={22} /></button>
            </div>
            <div className="space-y-4 p-6">
              <div><label className="text-sm text-gray-500">ID</label><p className="text-lg font-semibold">#{selectedBranch.id}</p></div>
              <div>
                <label className="mb-2 block text-sm font-medium">Branch Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={() => { setEditOpen(false); resetForm(); setSelectedBranch(null); }} className="rounded-lg border px-5 py-2 hover:bg-gray-100">Cancel</button>
              <button onClick={handleEditBranch} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Update Branch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
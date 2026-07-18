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
  MapPin,
  Truck
} from "lucide-react";

const API_BASE = "http://localhost:8001/api";

export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    pickup: "",
    destination: "",
    via: "",
    stoppage: "",
    status: "active"
  });

  // Fetch routes from API
  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/routes/`);
      const data = response.data.data || response.data;
      const normalized = data.map((route) => ({
        ...route,
        id: route.id,
        pickup: route.pickup_location || "",
        destination: route.destination || "",
        via: route.via || "N/A",
        stoppage: route.stoppage || "N/A",
        status: route.status || "active",
        createdAt: route.created_at ? route.created_at.split("T")[0] : ""
      }));
      setRoutes(normalized);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Handle Form Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create New Route
  const handleCreateRoute = async () => {
    if (!formData.pickup || !formData.destination) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/routes/`, {
        pickup_location: formData.pickup,
        destination: formData.destination,
        via: formData.via,
        stoppage: formData.stoppage,
        status: formData.status
      });
      // Refetch to get the actual created record with ID
      fetchRoutes();
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error creating route:", error);
      alert("Failed to create route: " + (error.response?.data?.detail || error.message));
    }
  };

  // Edit Route
  const handleEditRoute = async () => {
    if (!formData.pickup || !formData.destination) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await axios.put(`${API_BASE}/routes/${selectedRoute.id}`, {
        pickup_location: formData.pickup,
        destination: formData.destination,
        via: formData.via,
        stoppage: formData.stoppage,
        status: formData.status
      });
      const updatedRoutes = routes.map(route =>
        route.id === selectedRoute.id ? {
          ...route,
          pickup: formData.pickup,
          destination: formData.destination,
          via: formData.via || "N/A",
          stoppage: formData.stoppage || "N/A",
          status: formData.status
        } : route
      );
      setRoutes(updatedRoutes);
      resetForm();
      setEditOpen(false);
      setSelectedRoute(null);
    } catch (error) {
      console.error("Error updating route:", error);
      alert("Failed to update route");
    }
  };

  // Delete Route
  const handleDeleteRoute = async (id) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await axios.delete(`${API_BASE}/routes/${id}`);
        setRoutes(routes.filter(route => route.id !== id));
      } catch (error) {
        console.error("Error deleting route:", error);
        alert("Failed to delete route");
      }
    }
  };

  // View Route
  const handleViewRoute = (route) => {
    setSelectedRoute(route);
    setViewOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (route) => {
    setSelectedRoute(route);
    setFormData({
      pickup: route.pickup,
      destination: route.destination,
      via: route.via,
      stoppage: route.stoppage,
      status: route.status
    });
    setEditOpen(true);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      pickup: "",
      destination: "",
      via: "",
      stoppage: "",
      status: "active"
    });
  };

  // Filter Routes
  const filteredRoutes = routes.filter(route => {
    const matchesSearch =
      String(route.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route.via || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || route.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: routes.length,
    active: routes.filter(r => r.status === "active").length,
    inactive: routes.filter(r => r.status === "inactive").length
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Routes</h1>
          <p className="text-gray-500">Manage all routes and their details.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          New Route
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Routes</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <MapPin size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Routes</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3 text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inactive Routes</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <Truck size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search routes by ID or location..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="rounded-lg bg-gray-200 px-4 py-2.5 hover:bg-gray-300">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Routes Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">📋 All Routes</h2>
          <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
            {filteredRoutes.length} Route{filteredRoutes.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-medium">ID</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Pickup</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Destination</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Via</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    <p>Loading routes...</p>
                  </td>
                </tr>
              ) : filteredRoutes.length > 0 ? (
                filteredRoutes.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">#{item.id}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} className="text-blue-500" />
                        {item.pickup}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} className="text-red-500" />
                        {item.destination}
                      </span>
                    </td>
                    <td className="px-5 py-4">{item.via}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        item.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          item.status === "active" ? "bg-green-500" : "bg-red-500"
                        }`} />
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewRoute(item)}
                          className="rounded-lg bg-sky-500 p-2 text-white transition hover:bg-sky-600"
                          title="View Route"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="rounded-lg bg-yellow-500 p-2 text-white transition hover:bg-yellow-600"
                          title="Edit Route"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(item.id)}
                          className="rounded-lg bg-red-500 p-2 text-white transition hover:bg-red-600"
                          title="Delete Route"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={40} className="text-gray-400" />
                      <p>No routes found</p>
                      <button
                        onClick={() => {
                          resetForm();
                          setOpen(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Create a new route
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Route Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">➕ New Route</h2>
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Pickup Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pickup"
                    value={formData.pickup}
                    onChange={handleInputChange}
                    placeholder="Enter pickup location"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="Enter destination"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Via</label>
                  <input
                    type="text"
                    name="via"
                    value={formData.via}
                    onChange={handleInputChange}
                    placeholder="Enter via locations"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Stoppage</label>
                  <input
                    type="text"
                    name="stoppage"
                    value={formData.stoppage}
                    onChange={handleInputChange}
                    placeholder="Enter stoppage points"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="rounded-lg border px-5 py-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoute}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Create Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Route Modal */}
      {viewOpen && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">👁️ Route Details</h2>
              <button
                onClick={() => setViewOpen(false)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Route ID</label>
                <p className="text-lg font-semibold text-gray-900">#{selectedRoute.id}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Pickup Location</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedRoute.pickup}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Destination</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedRoute.destination}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Via</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedRoute.via}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Stoppage</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedRoute.stoppage}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-lg font-semibold">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                    selectedRoute.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      selectedRoute.status === "active" ? "bg-green-500" : "bg-red-500"
                    }`} />
                    {selectedRoute.status.charAt(0).toUpperCase() + selectedRoute.status.slice(1)}
                  </span>
                </p>
              </div>

              {selectedRoute.createdAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900">{selectedRoute.createdAt}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t px-6 py-4">
              <button
                onClick={() => setViewOpen(false)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {editOpen && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">✏️ Edit Route</h2>
              <button
                onClick={() => {
                  setEditOpen(false);
                  resetForm();
                  setSelectedRoute(null);
                }}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-500">Route ID</label>
                <p className="text-lg font-semibold text-gray-900">#{selectedRoute.id}</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Pickup Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pickup"
                    value={formData.pickup}
                    onChange={handleInputChange}
                    placeholder="Enter pickup location"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="Enter destination"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Via</label>
                  <input
                    type="text"
                    name="via"
                    value={formData.via}
                    onChange={handleInputChange}
                    placeholder="Enter via locations"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Stoppage</label>
                  <input
                    type="text"
                    name="stoppage"
                    value={formData.stoppage}
                    onChange={handleInputChange}
                    placeholder="Enter stoppage points"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => {
                  setEditOpen(false);
                  resetForm();
                  setSelectedRoute(null);
                }}
                className="rounded-lg border px-5 py-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEditRoute}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Update Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
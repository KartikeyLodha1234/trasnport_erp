import { useState } from "react";
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
  Building2,
  Globe
} from "lucide-react";

export default function Cities() {
  const [cities, setCities] = useState([
    {
      id: "#C1001",
      name: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400001",
      status: "active",
      createdAt: "2024-01-15"
    },
    {
      id: "#C1002",
      name: "Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110001",
      status: "active",
      createdAt: "2024-01-14"
    },
    {
      id: "#C1003",
      name: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560001",
      status: "active",
      createdAt: "2024-01-13"
    },
    {
      id: "#C1004",
      name: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      pincode: "600001",
      status: "inactive",
      createdAt: "2024-01-12"
    },
    {
      id: "#C1005",
      name: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500001",
      status: "active",
      createdAt: "2024-01-11"
    }
  ]);

  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    state: "",
    country: "",
    pincode: "",
    status: "active"
  });

  // Generate ID
  const generateId = () => {
    const count = cities.length + 1;
    return `#C${String(count).padStart(4, '0')}`;
  };

  // Handle Form Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create New City
  const handleCreateCity = () => {
    // Validation
    if (!formData.name || !formData.state || !formData.country) {
      alert("Please fill in all required fields");
      return;
    }

    const newCity = {
      id: generateId(),
      name: formData.name,
      state: formData.state,
      country: formData.country || "India",
      pincode: formData.pincode || "N/A",
      status: "active",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCities([...cities, newCity]);
    resetForm();
    setOpen(false);
  };

  // Edit City
  const handleEditCity = () => {
    if (!formData.name || !formData.state || !formData.country) {
      alert("Please fill in all required fields");
      return;
    }

    const updatedCities = cities.map(city => 
      city.id === selectedCity.id ? {
        ...city,
        name: formData.name,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode || "N/A",
        status: formData.status
      } : city
    );

    setCities(updatedCities);
    resetForm();
    setEditOpen(false);
    setSelectedCity(null);
  };

  // Delete City
  const handleDeleteCity = (id) => {
    if (window.confirm("Are you sure you want to delete this city?")) {
      setCities(cities.filter(city => city.id !== id));
    }
  };

  // View City
  const handleViewCity = (city) => {
    setSelectedCity(city);
    setViewOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (city) => {
    setSelectedCity(city);
    setFormData({
      id: city.id,
      name: city.name,
      state: city.state,
      country: city.country,
      pincode: city.pincode,
      status: city.status
    });
    setEditOpen(true);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      state: "",
      country: "",
      pincode: "",
      status: "active"
    });
  };

  // Filter Cities
  const filteredCities = cities.filter(city => {
    const matchesSearch = 
      city.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.pincode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || city.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: cities.length,
    active: cities.filter(c => c.status === "active").length,
    inactive: cities.filter(c => c.status === "inactive").length
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cities</h1>
          <p className="text-gray-500">Manage all cities and their details.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          New City
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Cities</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <Building2 size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Cities</p>
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
              <p className="text-sm text-gray-500">Inactive Cities</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <Globe size={24} />
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
            placeholder="Search cities by name, state, or pincode..."
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

      {/* Cities Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">📋 All Cities</h2>
          <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
            {filteredCities.length} City{filteredCities.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-medium">ID</th>
                <th className="px-5 py-3 text-left text-sm font-medium">City Name</th>
                <th className="px-5 py-3 text-left text-sm font-medium">State</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Country</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Pincode</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCities.length > 0 ? (
                filteredCities.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{item.id}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} className="text-blue-500" />
                        {item.name}
                      </span>
                    </td>
                    <td className="px-5 py-4">{item.state}</td>
                    <td className="px-5 py-4">{item.country}</td>
                    <td className="px-5 py-4 font-mono text-sm">{item.pincode}</td>
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
                          onClick={() => handleViewCity(item)}
                          className="rounded-lg bg-sky-500 p-2 text-white transition hover:bg-sky-600"
                          title="View City"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="rounded-lg bg-yellow-500 p-2 text-white transition hover:bg-yellow-600"
                          title="Edit City"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCity(item.id)}
                          className="rounded-lg bg-red-500 p-2 text-white transition hover:bg-red-600"
                          title="Delete City"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={40} className="text-gray-400" />
                      <p>No cities found</p>
                      <button
                        onClick={() => {
                          resetForm();
                          setOpen(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Create a new city
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create City Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">➕ New City</h2>
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
                    City Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter city name"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state name"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Enter country name"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter pincode"
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
                onClick={handleCreateCity}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Create City
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View City Modal */}
      {viewOpen && selectedCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">👁️ City Details</h2>
              <button 
                onClick={() => setViewOpen(false)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">City ID</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedCity.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">City Name</label>
                  <p className="text-lg font-semibold text-gray-900">
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={18} className="text-blue-500" />
                      {selectedCity.name}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">State</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedCity.state}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedCity.country}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Pincode</label>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{selectedCity.pincode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg font-semibold">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                      selectedCity.status === "active" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${
                        selectedCity.status === "active" ? "bg-green-500" : "bg-red-500"
                      }`} />
                      {selectedCity.status.charAt(0).toUpperCase() + selectedCity.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>

              {selectedCity.createdAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900">{selectedCity.createdAt}</p>
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

      {/* Edit City Modal */}
      {editOpen && selectedCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">✏️ Edit City</h2>
              <button 
                onClick={() => {
                  setEditOpen(false);
                  resetForm();
                  setSelectedCity(null);
                }}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-500">City ID</label>
                <p className="text-lg font-semibold text-gray-900">{selectedCity.id}</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    City Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter city name"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state name"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Enter country name"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter pincode"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Status
                </label>
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
                  setSelectedCity(null);
                }}
                className="rounded-lg border px-5 py-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCity}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Update City
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
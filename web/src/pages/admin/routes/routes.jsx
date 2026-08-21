import { useState, useEffect, useCallback, useMemo, memo } from "react";
import axios from "axios";
import {
  Eye, Pencil, Trash2, Plus, X, Search,
  AlertCircle, MapPin
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

// ====================== API Helpers ======================
async function fetchRoutesApi() {
  const response = await axios.get(`${API_BASE}/routes/`);
  const data = response.data.data || response.data;
  return data.map((route) => ({
    ...route,
    id: route.id,
    pickup: route.pickup_location || "",
    destination: route.destination || "",
    via: route.via || "",
    stoppage: route.stoppage || "",
    status: route.status || "active",
    distance_km: route.distance_km ?? 0,
    rate_per_kg: route.rate_per_kg ?? 0,
    price: route.price ?? 0,
    estimated_days: route.estimated_days ?? 1,
    createdAt: route.created_at ? String(route.created_at).split("T")[0] : "",
  }));
}

async function fetchCitiesApi() {
  const response = await axios.get(`${API_BASE}/cities/`);
  const data = response.data.data || response.data;
  return Array.isArray(data) ? data.filter((city) => city.status === "active") : [];
}

async function createRouteApi(formData) {
  const payload = {
    pickup_location: formData.pickup,
    destination: formData.destination,
    via: formData.via || "",
    stoppage: formData.stoppage || "",
    status: formData.status || "active",
    distance_km: parseFloat(formData.distance_km) || 0,
    rate_per_kg: parseFloat(formData.rate_per_kg) || 0,
    price: parseFloat(formData.price) || 0,
    estimated_days: parseInt(formData.estimated_days) || 1,
  };
  console.log("📤 Creating route with payload:", payload);
  const response = await axios.post(`${API_BASE}/routes/`, payload);
  return response.data;
}

async function updateRouteApi(routeId, formData) {
  const payload = {
    pickup_location: formData.pickup,  // ✅ frontend pickup → backend pickup_location
    destination: formData.destination,
    via: formData.via || "",
    stoppage: formData.stoppage || "",
    status: formData.status || "active",
    price: parseFloat(formData.price) || 0,
    distance_km: parseFloat(formData.distance_km) || 0,
    rate_per_kg: parseFloat(formData.rate_per_kg) || 0,
    estimated_days: parseInt(formData.estimated_days) || 1,
  };
  console.log("📤 Updating route with payload:", payload);
  const response = await axios.put(`${API_BASE}/routes/${routeId}/`, payload);
  return response.data;
}

async function deleteRouteApi(routeId) {
  await axios.delete(`${API_BASE}/routes/${routeId}/`);
}

// ====================== INITIAL FORM STATE ======================
const INITIAL_FORM = {
  pickup: "",
  destination: "",
  via: "",
  stoppage: "",
  status: "active",
  distance_km: "",
  rate_per_kg: "",
  price: "",
  estimated_days: "",
};

// ====================== VALIDATION ======================
function validateRoute(form) {
  const errors = [];
  if (!form.pickup) errors.push("Pickup is required.");
  if (!form.destination) errors.push("Destination is required.");
  if (form.pickup && form.destination && form.pickup === form.destination) {
    errors.push("Pickup and Destination cannot be the same.");
  }
  if (form.distance_km !== "" && parseFloat(form.distance_km) < 0) {
    errors.push("Distance cannot be negative.");
  }
  if (form.rate_per_kg !== "" && parseFloat(form.rate_per_kg) < 0) {
    errors.push("Rate cannot be negative.");
  }
  if (form.price !== "" && parseFloat(form.price) < 0) {
    errors.push("Price cannot be negative.");
  }
  if (form.estimated_days !== "" && parseInt(form.estimated_days) < 1) {
    errors.push("Estimated Days must be at least 1.");
  }
  return errors;
}

// ====================== NOTIFICATION BANNER ======================
const AlertBanner = memo(({ type, message, onClose }) => {
  if (!message) return null;
  const colors = {
    error: "bg-red-50 border-red-300 text-red-800",
    success: "bg-green-50 border-green-300 text-green-800",
  };
  return (
    <div className={`mb-4 flex items-center justify-between rounded border px-4 py-3 ${colors[type] || colors.error}`}>
      <span className="text-sm">{type === "error" ? "❌" : "✅"} {message}</span>
      <button onClick={onClose} className="ml-4 text-lg leading-none opacity-50 hover:opacity-100">&times;</button>
    </div>
  );
});

// ====================== STATS CARDS ======================
const StatsCards = memo(({ total, active, inactive }) => (
  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-sm text-gray-500">Total Routes</p>
      <p className="text-2xl font-bold text-gray-800">{total}</p>
    </div>
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-sm text-gray-500">Active Routes</p>
      <p className="text-2xl font-bold text-green-600">{active}</p>
    </div>
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-sm text-gray-500">Inactive Routes</p>
      <p className="text-2xl font-bold text-red-600">{inactive}</p>
    </div>
  </div>
));

// ====================== ROUTE FORM ======================
const RouteForm = memo(({ formData, onChange, cities, showStatus = false, disabled = false }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Pickup Location <span className="text-red-500">*</span>
          </label>
          <select
            name="pickup"
            value={formData.pickup || ""}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Select Pickup City --</option>
            {cities.map((city) => (
              <option key={city.id} value={city.name}>{city.name}, {city.state}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Destination <span className="text-red-500">*</span>
          </label>
          <select
            name="destination"
            value={formData.destination || ""}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Select Destination City --</option>
            {cities.map((city) => (
              <option key={city.id} value={city.name}>{city.name}, {city.state}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Via </label>
          <input
            type="text"
            name="via"
            value={formData.via || ""}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="e.g. Ajmer, Udaipur"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Stoppage </label>
          <input
            type="text"
            name="stoppage"
            value={formData.stoppage || ""}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="e.g. Ahmedabad"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Distance (km)</label>
          <input
            type="number"
            name="distance_km"
            value={formData.distance_km || ""}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="e.g. 1400"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Rate per kg (₹)</label>
          <input
            type="number"
            name="rate_per_kg"
            value={formData.rate_per_kg || ""}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="e.g. 45"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Price (₹)</label>
          <input
            type="number"
            name="price"
            value={formData.price || ""}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="e.g. 5000"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Estimated Days</label>
          <input
            type="number"
            name="estimated_days"
            value={formData.estimated_days || ""}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="e.g. 3"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {showStatus && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status || "active"}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}
    </div>
  );
});

// ====================== ROUTE TABLE ======================
const RouteTable = memo(({ routes, loading, onView, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="p-8 text-center text-gray-500">Loading routes...</div>
      </div>
    );
  }
  if (routes.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="p-8 text-center text-gray-500">
          <AlertCircle size={40} className="mx-auto mb-2 text-gray-400" />
          No routes found
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">📋 All Routes</h2>
        <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
          {routes.length} Route{routes.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="px-5 py-3 text-left font-medium">ID</th>
              <th className="px-5 py-3 text-left font-medium">Pickup</th>
              <th className="px-5 py-3 text-left font-medium">Destination</th>
              <th className="px-5 py-3 text-left font-medium">Via</th>
              <th className="px-5 py-3 text-left font-medium">Distance</th>
              <th className="px-5 py-3 text-left font-medium">Rate/kg</th>
              <th className="px-5 py-3 text-left font-medium">Price</th>
              <th className="px-5 py-3 text-left font-medium">Est. Days</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {routes.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">#{item.id}</td>
                <td className="whitespace-nowrap px-5 py-4">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} className="text-blue-500" /> {item.pickup}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} className="text-red-500" /> {item.destination}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-4">{item.via || "—"}</td>
                <td className="whitespace-nowrap px-5 py-4">{item.distance_km} km</td>
                <td className="whitespace-nowrap px-5 py-4">₹{item.rate_per_kg}/kg</td>
                <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                  ₹{Number(item.price || 0).toLocaleString("en-IN")}
                </td>
                <td className="whitespace-nowrap px-5 py-4">{item.estimated_days} days</td>
                <td className="whitespace-nowrap px-5 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    item.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {item.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => onView(item)} className="rounded-lg bg-sky-500 p-2 text-white hover:bg-sky-600" title="View">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => onEdit(item)} className="rounded-lg bg-yellow-500 p-2 text-white hover:bg-yellow-600" title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ====================== VIEW MODAL ======================
const ViewModal = memo(({ route, onClose }) => {
  if (!route) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">👁️ Route #{route.id}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-sm text-gray-500">Pickup</p><p className="font-semibold text-gray-900">{route.pickup}</p></div>
            <div><p className="text-sm text-gray-500">Destination</p><p className="font-semibold text-gray-900">{route.destination}</p></div>
            <div><p className="text-sm text-gray-500">Via</p><p className="font-semibold text-gray-900">{route.via || "—"}</p></div>
            <div><p className="text-sm text-gray-500">Stoppage</p><p className="font-semibold text-gray-900">{route.stoppage || "—"}</p></div>
            <div><p className="text-sm text-gray-500">Distance</p><p className="font-semibold text-gray-900">{route.distance_km} km</p></div>
            <div><p className="text-sm text-gray-500">Rate per kg</p><p className="font-semibold text-gray-900">₹{route.rate_per_kg}</p></div>
            <div><p className="text-sm text-gray-500">Price</p><p className="font-semibold text-gray-900">₹{Number(route.price || 0).toLocaleString("en-IN")}</p></div>
            <div><p className="text-sm text-gray-500">Estimated Days</p><p className="font-semibold text-gray-900">{route.estimated_days} days</p></div>
            <div><p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                route.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>{route.status === "active" ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>
  );
});

// ====================== MAIN ROUTES COMPONENT ======================
export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching routes from:", `${API_BASE}/routes/`);
      const response = await axios.get(`${API_BASE}/routes/`);
      console.log("📡 Response status:", response.status);
      console.log("📡 Response data:", response.data);
      
      const data = response.data.data || response.data;
      console.log("📡 Parsed data:", data);
      
      const formatted = data.map((route) => ({
        ...route,
        id: route.id,
        pickup: route.pickup_location || "",
        destination: route.destination || "",
        via: route.via || "",
        stoppage: route.stoppage || "",
        status: route.status || "active",
        distance_km: route.distance_km ?? 0,
        rate_per_kg: route.rate_per_kg ?? 0,
        price: route.price ?? 0,
        estimated_days: route.estimated_days ?? 1,
        createdAt: route.created_at ? String(route.created_at).split("T")[0] : "",
      }));
      
      console.log("✅ Formatted routes:", formatted);
      setRoutes(formatted);
    } catch (err) {
      console.error("❌ Error loading routes:", err);
      setAlert({ type: "error", message: "Failed to load routes." });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCities = useCallback(async () => {
    try {
      const data = await fetchCitiesApi();
      setCities(data);
    } catch (err) {
      setAlert({ type: "error", message: "Failed to load cities." });
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
    loadCities();
  }, [loadRoutes, loadCities]);

  // ====================== Handlers ======================
  const handleFormChange = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setAlert({ type: "", message: "" });
  }, []);

  const clearForm = useCallback(() => {
    setForm(INITIAL_FORM);
  }, []);

  const openCreate = useCallback(() => {
    clearForm();
    setShowCreate(true);
  }, [clearForm]);

  const closeCreate = useCallback(() => {
    setShowCreate(false);
    clearForm();
  }, [clearForm]);

  // ✅ FIXED: Edit handler - properly maps route data to form
  const openEdit = useCallback((route) => {
    console.log("✏️ Opening edit for route:", route);
    
    setSelectedRoute(route);
    setForm({
      pickup: route.pickup || "",
      destination: route.destination || "",
      via: route.via || "",
      stoppage: route.stoppage || "",
      status: route.status || "active",
      distance_km: route.distance_km ?? "",
      rate_per_kg: route.rate_per_kg ?? "",
      price: route.price ?? "",
      estimated_days: route.estimated_days ?? "",
    });
    
    console.log("📝 Form state after mapping:", {
      pickup: route.pickup,
      destination: route.destination,
      via: route.via,
      stoppage: route.stoppage,
      status: route.status,
      distance_km: route.distance_km,
      rate_per_kg: route.rate_per_kg,
      price: route.price,
      estimated_days: route.estimated_days
    });
    
    setShowEdit(true);
  }, []);

  const closeEdit = useCallback(() => {
    setShowEdit(false);
    setSelectedRoute(null);
    clearForm();
  }, [clearForm]);

  const openView = useCallback((route) => {
    setSelectedRoute(route);
    setShowView(true);
  }, []);

  const closeView = useCallback(() => {
    setShowView(false);
    setSelectedRoute(null);
  }, []);

  const handleCreate = useCallback(async () => {
    const errors = validateRoute(form);
    if (errors.length > 0) {
      setAlert({ type: "error", message: errors.join(" ") });
      return;
    }
    try {
      await createRouteApi(form);
      setAlert({ type: "success", message: "Route created successfully!" });
      closeCreate();
      loadRoutes();
    } catch (err) {
      console.error("❌ Create error:", err);
      setAlert({ type: "error", message: err.response?.data?.detail || "Failed to create route." });
    }
  }, [form, closeCreate, loadRoutes]);

  // ✅ FIXED: Update handler
  const handleEdit = useCallback(async () => {
    if (!selectedRoute) {
      console.error("❌ No route selected for editing");
      return;
    }
    
    console.log("🔄 Attempting to update route:", selectedRoute.id);
    console.log("📋 Current form data:", form);
    
    const errors = validateRoute(form);
    if (errors.length > 0) {
      setAlert({ type: "error", message: errors.join(" ") });
      return;
    }
    
    try {
      await updateRouteApi(selectedRoute.id, form);
      setAlert({ type: "success", message: "Route updated successfully!" });
      closeEdit();
      loadRoutes();
    } catch (err) {
      console.error("❌ Update error:", err);
      console.error("❌ Error response:", err.response?.data);
      setAlert({ type: "error", message: err.response?.data?.detail || "Failed to update route." });
    }
  }, [form, selectedRoute, closeEdit, loadRoutes]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Delete this route?")) return;
    try {
      await deleteRouteApi(id);
      setAlert({ type: "success", message: "Route deleted." });
      loadRoutes();
    } catch (err) {
      console.error("❌ Delete error:", err);
      setAlert({ type: "error", message: "Failed to delete route." });
    }
  }, [loadRoutes]);

  // ====================== Derived Data ======================
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        String(route.id).toLowerCase().includes(s) ||
        route.pickup.toLowerCase().includes(s) ||
        route.destination.toLowerCase().includes(s);
      const matchesStatus = filterStatus === "all" || route.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [routes, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = routes.length;
    const active = routes.filter((r) => r.status === "active").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [routes]);

  // ====================== Render ======================
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <AlertBanner
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: "", message: "" })}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Routes</h1>
          <p className="text-gray-500">Manage all routes and their details.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} /> New Route
        </button>
      </div>

      <StatsCards total={stats.total} active={stats.active} inactive={stats.inactive} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by ID, Pickup, or Destination..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <RouteTable
        routes={filteredRoutes}
        loading={loading}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">➕ New Route</h2>
              <button onClick={closeCreate} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              <RouteForm formData={form} onChange={handleFormChange} cities={cities} />
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={closeCreate} className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Create Route</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">✏️ Edit Route #{selectedRoute.id}</h2>
              <button onClick={closeEdit} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              <RouteForm formData={form} onChange={handleFormChange} cities={cities} showStatus />
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={closeEdit} className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Update Route</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && selectedRoute && <ViewModal route={selectedRoute} onClose={closeView} />}
    </div>
  );
}
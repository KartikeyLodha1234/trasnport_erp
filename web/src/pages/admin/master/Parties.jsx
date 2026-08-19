import { useState, useEffect, useCallback, useMemo, memo } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  Search,
  AlertCircle,
  CheckCircle,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Hash,
  Globe,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

// ====================== REUSABLE UI COMPONENTS ======================

const SectionHeader = ({ children }) => (
  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
    {children}
  </h3>
);

const InputField = memo(({ label, required, icon: Icon, children, className = "" }) => (
  <div className={className}>
    <label className="mb-2 block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      )}
      {children}
    </div>
  </div>
));

const SelectField = memo(({ label, required, icon: Icon, children, className = "" }) => (
  <div className={className}>
    <label className="mb-2 block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      )}
      {children}
    </div>
  </div>
));

const TextareaField = memo(({ label, required, className = "", ...props }) => (
  <div className={className}>
    <label className="mb-2 block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <textarea
      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
      rows="3"
      {...props}
    />
  </div>
));

const inputClasses =
  "w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-500";
const selectClasses =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-500";

// ====================== PARTY FORM ======================

const PartyForm = memo(
  ({
    formData,
    onChange,
    cities,
    onCityChange,
    useCustomCity,
    setUseCustomCity,
    showId = false,
    partyId = null,
  }) => {
    const isStateReadOnly = !useCustomCity && formData.city !== "";

    return (
      <div className="space-y-8">
        {showId && partyId && (
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-500">Party ID</span>
            <p className="text-lg font-semibold text-gray-800">#{partyId}</p>
          </div>
        )}

        {/* Basic Information */}
        <SectionHeader>Basic Information</SectionHeader>
        <div className="grid gap-5 md:grid-cols-2">
          <InputField label="Party Name" required>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              placeholder="Company / Person name"
              className={inputClasses}
            />
          </InputField>

          <SelectField label="Type">
            <select
              name="type"
              value={formData.type}
              onChange={onChange}
              className={selectClasses}
            >
              <option value="consignor">Consignor (Sender)</option>
              <option value="consignee">Consignee (Receiver)</option>
              <option value="both">Both</option>
            </select>
          </SelectField>
        </div>

        {/* Contact Information */}
        <SectionHeader>Contact Information</SectionHeader>
        <div className="grid gap-5 md:grid-cols-2">
          <InputField label="Email" icon={Mail}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="email@example.com"
              className={`${inputClasses} pl-10`}
            />
          </InputField>

          <InputField label="Phone" icon={Phone}>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              placeholder="+91 98765 43210"
              className={`${inputClasses} pl-10`}
            />
          </InputField>
        </div>

        {/* Location */}
        <SectionHeader>Location</SectionHeader>
        <div className="grid gap-5 md:grid-cols-2">
          {/* City Field */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              City <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {!useCustomCity ? (
                <>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <select
                      name="city"
                      value={formData.city}
                      onChange={onCityChange}
                      className={`${selectClasses} pl-10`}
                    >
                      <option value="">-- Select City --</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseCustomCity(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                  >
                    <Pencil size={14} />
                    Enter manually
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={onChange}
                    placeholder="Enter city name"
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomCity(false);
                      onChange({ target: { name: "city", value: "" } });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                  >
                    <MapPin size={14} />
                    Select from list
                  </button>
                </>
              )}
            </div>
          </div>

          {/* State Field */}
          <InputField label="State">
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={isStateReadOnly ? undefined : onChange}
              readOnly={isStateReadOnly}
              placeholder="e.g. Maharashtra"
              className={`${inputClasses} ${
                isStateReadOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
              }`}
            />
          </InputField>
        </div>

        {/* Tax & Compliance */}
        <SectionHeader>Tax & Compliance</SectionHeader>
        <div className="grid gap-5 md:grid-cols-2">
          <InputField label="GSTIN" icon={Hash}>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={onChange}
              placeholder="27AABCG1234Q1Z5"
              className={`${inputClasses} pl-10 font-mono`}
            />
          </InputField>

          <SelectField label="Status" icon={Globe}>
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className={`${selectClasses} pl-10`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </SelectField>
        </div>

        {/* Address */}
        <SectionHeader>Address</SectionHeader>
        <TextareaField
          name="address"
          value={formData.address}
          onChange={onChange}
          placeholder="Full address..."
        />
      </div>
    );
  }
);

// ====================== MAIN COMPONENT ======================

export default function Parties() {
  const [parties, setParties] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [useCustomCity, setUseCustomCity] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "both",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    gstin: "",
    status: "active",
  });

  // ====================== API Calls ======================

  const fetchParties = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/parties/`);
      const data = response.data.data || response.data || [];
      setParties(data);
    } catch (error) {
      console.error("Error fetching parties:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCities = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/cities/`);
      const data = response.data.data || response.data || [];
      const activeCities = Array.isArray(data)
        ? data.filter((city) => city.status === "active")
        : [];
      setCities(activeCities);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  }, []);

  useEffect(() => {
    fetchParties();
    fetchCities();
  }, [fetchParties, fetchCities]);

  // ====================== Handlers ======================

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCityChange = useCallback(
    (e) => {
      const selectedCityName = e.target.value;
      setFormData((prev) => ({ ...prev, city: selectedCityName }));
      const cityData = cities.find((c) => c.name === selectedCityName);
      if (cityData && cityData.state) {
        setFormData((prev) => ({ ...prev, state: cityData.state }));
      }
    },
    [cities]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      type: "both",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      gstin: "",
      status: "active",
    });
    setUseCustomCity(false);
  }, []);

  const handleCreateParty = useCallback(async () => {
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
      alert(
        "Failed to create party: " +
          (error.response?.data?.detail || error.message)
      );
    }
  }, [formData, fetchParties, resetForm]);

  const handleEditParty = useCallback(async () => {
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
  }, [formData, selectedParty, fetchParties, resetForm]);

  const handleDeleteParty = useCallback(
    async (id) => {
      if (window.confirm("Are you sure you want to delete this party?")) {
        try {
          await axios.delete(`${API_BASE}/parties/${id}`);
          fetchParties();
        } catch (error) {
          console.error("Error deleting party:", error);
          alert("Failed to delete party");
        }
      }
    },
    [fetchParties]
  );

  const openEditModal = useCallback((party) => {
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
      status: party.status || "active",
    });
    setUseCustomCity(false);
    setEditOpen(true);
  }, []);

  // ====================== Derived Data ======================

  const filteredParties = useMemo(() => {
    return parties.filter((party) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        (party.name || "").toLowerCase().includes(s) ||
        (party.email || "").toLowerCase().includes(s) ||
        (party.phone || "").toLowerCase().includes(s) ||
        (party.city || "").toLowerCase().includes(s) ||
        (party.gstin || "").toLowerCase().includes(s);
      const matchesType = filterType === "all" || party.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [parties, searchTerm, filterType]);

  const stats = useMemo(
    () => ({
      total: parties.length,
      consignors: parties.filter(
        (p) => p.type === "consignor" || p.type === "both"
      ).length,
      consignees: parties.filter(
        (p) => p.type === "consignee" || p.type === "both"
      ).length,
      active: parties.filter((p) => p.status === "active").length,
    }),
    [parties]
  );

  const getTypeBadge = (type) => {
    const types = {
      consignor: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Consignor",
      },
      consignee: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Consignee",
      },
      both: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Both",
      },
    };
    return (
      types[type] || { bg: "bg-gray-100", text: "text-gray-700", label: type }
    );
  };

  // ====================== Render ======================

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Parties</h1>
          <p className="text-gray-500 mt-1">
            Manage consignors, consignees, and business partners.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 active:scale-95"
        >
          <Plus size={18} /> New Party
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Consignors
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.consignors}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Users size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Consignees
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.consignees}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Active
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name, email, phone, city, or GSTIN..."
            className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="consignor">Consignor</option>
          <option value="consignee">Consignee</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Parties Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">All Parties</h2>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {filteredParties.length} Party
            {filteredParties.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-5 py-3 text-left font-medium">ID</th>
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-left font-medium">Contact</th>
                <th className="px-5 py-3 text-left font-medium">City</th>
                <th className="px-5 py-3 text-left font-medium">GSTIN</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    Loading parties...
                  </td>
                </tr>
              ) : filteredParties.length > 0 ? (
                filteredParties.map((item) => {
                  const typeBadge = getTypeBadge(item.type);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-mono font-semibold text-blue-600">
                        #{item.id}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-800">
                        {item.name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadge.bg} ${typeBadge.text}`}
                        >
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          {item.email && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Mail size={12} />{" "}
                              <span className="text-xs">{item.email}</span>
                            </div>
                          )}
                          {item.phone && (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Phone size={12} />{" "}
                              <span className="text-xs">{item.phone}</span>
                            </div>
                          )}
                          {!item.email && !item.phone && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <MapPin size={13} className="text-blue-500" />
                          <span className="text-xs">
                            {item.city || "—"}
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs text-gray-600">
                          {item.gstin || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status === "active"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          {item.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedParty(item);
                              setViewOpen(true);
                            }}
                            className="rounded-xl bg-sky-500 p-2 text-white transition hover:bg-sky-600 active:scale-95"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded-xl bg-yellow-500 p-2 text-white transition hover:bg-yellow-600 active:scale-95"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteParty(item.id)}
                            className="rounded-xl bg-red-500 p-2 text-white transition hover:bg-red-600 active:scale-95"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle size={40} className="text-gray-300" />
                      <p className="text-sm">No parties found</p>
                      <button
                        onClick={() => {
                          resetForm();
                          setOpen(true);
                        }}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
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
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-800">
                ➕ New Party
              </h2>
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <PartyForm
                formData={formData}
                onChange={handleInputChange}
                cities={cities}
                onCityChange={handleCityChange}
                useCustomCity={useCustomCity}
                setUseCustomCity={setUseCustomCity}
              />
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateParty}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition active:scale-95"
              >
                Create Party
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Party Modal */}
      {viewOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-800">
                Party Details
              </h2>
              <button
                onClick={() => setViewOpen(false)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
                <span className="text-sm font-medium text-blue-600">
                  #{selectedParty.id}
                </span>
                <span className="text-lg font-bold text-gray-800">
                  {selectedParty.name}
                </span>
                <span
                  className={`ml-auto inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    selectedParty.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedParty.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Type
                  </label>
                  <p className="font-semibold text-gray-800 capitalize">
                    {selectedParty.type}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Email
                  </label>
                  <p className="text-gray-700">
                    {selectedParty.email || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </label>
                  <p className="text-gray-700">
                    {selectedParty.phone || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    City
                  </label>
                  <p className="text-gray-700">
                    {selectedParty.city || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    State
                  </label>
                  <p className="text-gray-700">
                    {selectedParty.state || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    GSTIN
                  </label>
                  <p className="font-mono text-gray-700">
                    {selectedParty.gstin || "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Address
                  </label>
                  <p className="text-gray-700">
                    {selectedParty.address || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setViewOpen(false)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Party Modal */}
      {editOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-800">
                ✏️ Edit Party
              </h2>
              <button
                onClick={() => {
                  setEditOpen(false);
                  resetForm();
                  setSelectedParty(null);
                }}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <PartyForm
                formData={formData}
                onChange={handleInputChange}
                cities={cities}
                onCityChange={handleCityChange}
                useCustomCity={useCustomCity}
                setUseCustomCity={setUseCustomCity}
                showId={true}
                partyId={selectedParty.id}
              />
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => {
                  setEditOpen(false);
                  resetForm();
                  setSelectedParty(null);
                }}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditParty}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition active:scale-95"
              >
                Update Party
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
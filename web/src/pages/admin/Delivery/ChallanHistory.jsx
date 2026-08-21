import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  Search,
  FileText,
  Truck,
  Calendar,
  History,
  X,
  Printer,
  User as UserIcon,
  Package,
  Plus,
  DollarSign,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function ChallanHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedChallan, setSelectedChallan] = useState(null);
  const [challanShipments, setChallanShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [challanHash, setChallanHash] = useState("Pending Hashing...");

  // =========================
  // EXPENSE STATES
  // =========================
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [expenseData, setExpenseData] = useState({
    challanId: "",
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    vendor: "",
    receiptNumber: "",
  });

  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [expenseSuccess, setExpenseSuccess] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // =========================
  // EDIT / DELETE STATES
  // =========================
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchHistory();
    fetchExpenses();
  }, []);

  // =========================
  // FETCH CHALLANS
  // =========================
  const fetchHistory = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/challans/`);

      if (!response.ok) {
        throw new Error("Failed to fetch challans");
      }

      const data = await response.json();

      console.log("Challans API:", data);

      // Ensure each challan has an ID
      const challans = (data.data || data.challans || data || []).map(challan => ({
        ...challan,
        id: challan.challan_id || challan.id || challan.challan_no
      }));

      setHistory(challans);
    } catch (error) {
      console.error("Error fetching history:", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH EXPENSES
  // =========================
  const fetchExpenses = async () => {
    try {
      setLoadingExpenses(true);

      const response = await fetch(`${API_BASE}/expenses/`);

      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }

      const data = await response.json();

      console.log("Expenses API:", data);

      const expenseList =
        data.data ||
        data.expenses ||
        data ||
        [];

      if (!Array.isArray(expenseList)) {
        setExpenses([]);
        return;
      }

      // Backend snake_case -> frontend friendly fields
      const normalizedExpenses = expenseList.map((expense) => ({
        ...expense,
        challanId: expense.challan_id,
        date: expense.expense_date,
        paymentMethod: expense.payment_method,
        receiptNumber: expense.receipt_number,
      }));

      setExpenses(normalizedExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // =========================
  // PREVIEW CHALLAN
  // =========================
  const handlePreview = async (challan) => {
    setSelectedChallan(challan);
    setLoadingShipments(true);
    setChallanShipments([]);
    setChallanHash("Generating Deterministic Hash...");

    try {
      const response = await fetch(`${API_BASE}/shipments/`);

      if (response.ok) {
        const data = await response.json();

        const allShipments = data.data || data.shipments || data || [];

        const attachedLRs = allShipments.filter(
          (s) =>
            String(s.challan_number || "")
              .trim()
              .toLowerCase() ===
            String(challan.challan_no || "")
              .trim()
              .toLowerCase()
        );

        setChallanShipments(attachedLRs);

        const totalFreight = attachedLRs.reduce(
          (sum, s) => sum + (parseFloat(s.freight_charge) || 0),
          0
        );

        const payloadString = `${challan.challan_no}-${challan.driver_name}-${totalFreight}`;

        const msgBuffer = new TextEncoder().encode(payloadString);

        const hashBuffer = await crypto.subtle.digest(
          "SHA-256",
          msgBuffer
        );

        const hashArray = Array.from(new Uint8Array(hashBuffer));

        const hashHex =
          "0x" +
          hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        setTimeout(() => {
          setChallanHash(hashHex);
        }, 800);
      }
    } catch (error) {
      console.error("Failed to load attached LRs:", error);
    } finally {
      setLoadingShipments(false);
    }
  };

  // =========================
  // ADD EXPENSE
  // =========================
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseSubmitting(true);
    setExpenseError("");
    setExpenseSuccess("");

    if (!expenseData.challanId || !expenseData.category || !expenseData.amount) {
      setExpenseError("Please fill in all required fields (Challan ID, Category, and Amount)");
      setExpenseSubmitting(false);
      return;
    }

    try {
      // Find the selected challan
      const selectedChallan = history.find(
        c => String(c.challan_id || c.id) === String(expenseData.challanId) ||
             String(c.challan_no) === String(expenseData.challanId)
      );

      // Use the numeric ID from the challan
      const challanIdToSend = selectedChallan 
        ? (selectedChallan.challan_id || selectedChallan.id) 
        : expenseData.challanId;

      const payload = {
        challanId: String(challanIdToSend),
        category: expenseData.category,
        amount: parseFloat(expenseData.amount),
        date: expenseData.date,
        paymentMethod: expenseData.paymentMethod,
        vendor: expenseData.vendor,
        description: expenseData.description,
        receiptNumber: expenseData.receiptNumber,
      };

      console.log("Adding expense payload:", payload);

      const response = await fetch(`${API_BASE}/expenses/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log("Add expense response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || "Failed to add expense");
      }

      setExpenseSuccess("Expense added successfully!");
      
      setTimeout(() => {
        setShowExpenseForm(false);
        setExpenseData({
          challanId: "",
          category: "",
          amount: "",
          description: "",
          date: new Date().toISOString().split('T')[0],
          paymentMethod: "cash",
          vendor: "",
          receiptNumber: "",
        });
        setExpenseSuccess("");
        setExpenseError("");
        fetchHistory();
        fetchExpenses();
      }, 1500);

    } catch (error) {
      console.error("Error adding expense:", error);
      setExpenseError(error.message || "Failed to add expense. Please try again.");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  // =========================
  // UPDATE EXPENSE
  // =========================
  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    setExpenseSubmitting(true);
    setExpenseError("");
    setExpenseSuccess("");

    if (!expenseData.challanId || !expenseData.category || !expenseData.amount) {
      setExpenseError("Please fill in all required fields (Challan ID, Category, and Amount)");
      setExpenseSubmitting(false);
      return;
    }

    const expenseId = editingExpense?.expense_id || editingExpense?.id;
    
    if (!expenseId) {
      setExpenseError("Expense ID not found");
      setExpenseSubmitting(false);
      return;
    }

    try {
      // Find the selected challan
      const selectedChallan = history.find(
        c => String(c.challan_id || c.id) === String(expenseData.challanId) ||
             String(c.challan_no) === String(expenseData.challanId)
      );

      // Use the numeric ID from the challan
      const challanIdToSend = selectedChallan 
        ? (selectedChallan.challan_id || selectedChallan.id) 
        : expenseData.challanId;

      const payload = {
        challanId: String(challanIdToSend),
        category: expenseData.category,
        amount: parseFloat(expenseData.amount),
        date: expenseData.date,
        paymentMethod: expenseData.paymentMethod,
        vendor: expenseData.vendor,
        description: expenseData.description,
        receiptNumber: expenseData.receiptNumber,
      };

      console.log("Updating expense payload:", payload);

      const response = await fetch(`${API_BASE}/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log("Update expense response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || "Failed to update expense");
      }

      setExpenseSuccess("Expense updated successfully!");
      
      setTimeout(() => {
        setShowExpenseForm(false);
        setEditingExpense(null);
        setExpenseData({
          challanId: "",
          category: "",
          amount: "",
          description: "",
          date: new Date().toISOString().split('T')[0],
          paymentMethod: "cash",
          vendor: "",
          receiptNumber: "",
        });
        setExpenseSuccess("");
        setExpenseError("");
        fetchHistory();
        fetchExpenses();
      }, 1500);

    } catch (error) {
      console.error("Error updating expense:", error);
      setExpenseError(error.message || "Failed to update expense. Please try again.");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  // =========================
  // OPEN ADD FORM
  // =========================
  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseData({
      challanId: "",
      category: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      vendor: "",
      receiptNumber: "",
    });
    setExpenseError("");
    setExpenseSuccess("");
    setShowExpenseForm(true);
  };

  // =========================
  // OPEN EDIT FORM
  // =========================
  const openEditExpense = (expense) => {
    setEditingExpense(expense);

    // Find the associated challan
    const associatedChallan = history.find(
      c => String(c.challan_id || c.id) === String(expense.challan_id || expense.challanId) ||
           String(c.challan_no) === String(expense.challan_no)
    );

    // Use the challan's numeric ID if found, otherwise use the expense's challan ID
    const challanId = associatedChallan 
      ? (associatedChallan.challan_id || associatedChallan.id) 
      : (expense.challan_id || expense.challanId || "");

    setExpenseData({
      challanId: String(challanId),
      category: expense.category || "",
      amount: expense.amount || "",
      description: expense.description || "",
      date: expense.expense_date || expense.date || new Date().toISOString().split("T")[0],
      paymentMethod: expense.payment_method || expense.paymentMethod || "cash",
      vendor: expense.vendor || "",
      receiptNumber: expense.receipt_number || expense.receiptNumber || "",
    });

    setExpenseError("");
    setExpenseSuccess("");
    setShowExpenseForm(true);
  };

  // =========================
  // CLOSE EXPENSE FORM
  // =========================
  const closeExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
    setExpenseData({
      challanId: "",
      category: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      vendor: "",
      receiptNumber: "",
    });
    setExpenseError("");
    setExpenseSuccess("");
  };

  // =========================
  // DELETE EXPENSE
  // =========================
  const handleDeleteExpense = async (expense) => {
    const expenseId = expense.expense_id || expense.id;

    if (!expenseId) {
      alert("Expense ID not found");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingExpenseId(expenseId);

      const response = await fetch(
        `${API_BASE}/expenses/${expenseId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Failed to delete expense"
        );
      }

      await fetchExpenses();
      setExpenseSuccess("Expense deleted successfully!");
      setTimeout(() => setExpenseSuccess(""), 3000);
    } catch (error) {
      console.error("Delete expense error:", error);
      alert(
        error.message ||
          "Failed to delete expense"
      );
    } finally {
      setDeletingExpenseId(null);
    }
  };

  // =========================
  // PRINT CHALLAN
  // =========================
  const printOfficialChallan = () => {
    if (!selectedChallan) return;

    const printWindow = window.open("", "_blank");

    const challanNo = selectedChallan.challan_no;

    const rows = challanShipments
      .map(
        (s, i) =>
          `<tr style="background:${
            i % 2 === 0 ? "#fff" : "#f8fafc"
          }">
            <td style="font-family:monospace;font-weight:700">
              ${s.lr_number || "N/A"}
            </td>

            <td>
              ${s.pickup_location || "N/A"}
            </td>

            <td>
              ${s.delivery_location || s.destination || "N/A"}
            </td>

            <td>
              ${s.client || "N/A"}
            </td>

            <td>
              ${s.consignee_name || "N/A"}
            </td>

            <td>
              ${s.goods_desc || "N/A"}
            </td>

            <td>
              ${s.weight || 0} ${s.weight_type || "kg"}
            </td>

            <td style="font-weight:600">
              ₹${Number(
                s.freight_charge || 0
              ).toLocaleString("en-IN")}
            </td>
          </tr>`
      )
      .join("");

    const totalFreight = challanShipments.reduce(
      (sum, s) =>
        sum +
        (parseFloat(s.freight_charge) || 0),
      0
    );

    const totalWeight = challanShipments.reduce(
      (sum, s) =>
        sum +
        ((s.weight_type || "kg")
          .toLowerCase() === "ton"
          ? parseFloat(s.weight) * 1000
          : parseFloat(s.weight) || 0),
      0
    );

    const formattedDate = new Date(
      selectedChallan.created_at
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

      <head>

      <title>
        Challan ${challanNo}
      </title>

      <style>

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family:
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          Inter,
          Roboto,
          sans-serif;

        padding: 20px;

        color: #0f172a;
      }

      .header {
        background: #0b1220;
        color: white;
        padding: 20px 28px;

        display: flex;
        justify-content: space-between;

        border-radius: 14px 14px 0 0;
      }

      .header h2 {
        font-size: 21px;
      }

      .tag {
        background: rgba(99,102,241,0.2);
        color: #a5b4fc;

        padding: 5px 14px;

        border-radius: 6px;

        font-weight: 700;
        font-size: 12px;
      }

      .banner {
        display: flex;
        justify-content: space-between;

        padding: 14px 28px;

        background: #f8fafc;

        border-bottom:
          1px solid #e2e8f0;
      }

      .label {
        font-size: 10.5px;
        font-weight: 700;

        color: #94a3b8;

        margin-bottom: 3px;
      }

      .value {
        font-size: 22px;
        font-weight: 800;

        font-family: monospace;
      }

      .info-grid {
        display: grid;

        grid-template-columns:
          1fr 1fr;

        gap: 16px;

        padding: 22px 28px;

        margin-bottom: 18px;
      }

      .info-card {
        border:
          1px solid #e2e8f0;

        border-radius: 10px;

        padding: 14px 16px;
      }

      .card-label {
        font-size: 10px;

        font-weight: 700;

        color: #6366f1;

        margin-bottom: 7px;
      }

      .card-name {
        font-weight: 700;
        font-size: 15px;
      }

      .card-detail {
        font-size: 12.5px;
        color: #64748b;

        margin-top: 3px;
      }

      .table-container {
        border:
          1px solid #e2e8f0;

        border-radius: 10px;

        overflow: hidden;

        margin:
          0 28px 18px 28px;
      }

      table {
        width: 100%;
        border-collapse: collapse;

        font-size: 12.5px;
      }

      thead {
        background: #0b1220;
        color: white;
      }

      th {
        padding: 9px 12px;

        text-align: left;

        font-size: 11px;
      }

      td {
        padding: 9px 12px;

        border-bottom:
          1px solid #f1f5f9;
      }

      tfoot {
        background: #f0fdf4;
        font-weight: 700;
      }

      tfoot td {
        color: #166534;
        font-size: 14px;
      }

      .signatures {
        display: grid;

        grid-template-columns:
          1fr 1fr 1fr;

        gap: 16px;

        padding:
          0 28px;

        margin-bottom: 18px;
      }

      .sig-box {
        border:
          1px solid #e2e8f0;

        border-radius: 10px;

        padding: 18px 16px;

        text-align: center;
      }

      .sig-line {
        height: 36px;

        border-bottom:
          1px dashed #cbd5e1;

        margin-bottom: 8px;
      }

      .sig-label {
        font-size: 11px;
        color: #94a3b8;
      }

      .footer-note {
        background: #f8fafc;

        border:
          1px solid #e2e8f0;

        border-radius: 10px;

        padding: 11px 15px;

        font-size: 11px;

        color: #64748b;

        margin:
          0 28px 20px 28px;
      }

      @media print {

        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

      }

      </style>

      </head>

      <body>

      <div class="header">

        <div>

          <h2>
            FleetChain Logistics
          </h2>

          <div style="
            font-size:11px;
            color:rgba(255,255,255,0.6);
            margin-top:3px
          ">
            Transport Management System
          </div>

        </div>

        <div style="text-align:right">

          <div class="tag">
            Lorry Challan
          </div>

          <div style="
            font-size:11px;
            color:rgba(255,255,255,0.6);
            margin-top:3px
          ">
            Master Record
          </div>

        </div>

      </div>

      <div class="banner">

        <div>

          <div class="label">
            Challan Number
          </div>

          <div class="value">
            ${challanNo}
          </div>

        </div>

        <div style="text-align:right">

          <div class="label">
            Date Generated
          </div>

          <div
            class="value"
            style="
              font-size:15px;
              font-family:sans-serif
            "
          >
            ${formattedDate}
          </div>

        </div>

      </div>

      <div class="info-grid">

        <div class="info-card">

          <div class="card-label">
            Assigned Driver
          </div>

          <div class="card-name">
            ${
              selectedChallan.driver_name ||
              "N/A"
            }
          </div>

          <div class="card-detail">
            📞 N/A
          </div>

          <div style="
            font-size:11.5px;
            color:#94a3b8;
            margin-top:2px
          ">
            License: N/A
          </div>

        </div>

        <div class="info-card">

          <div class="card-label">
            Assigned Vehicle
          </div>

          <div class="card-name">
            ${
              selectedChallan.vehicle_code ||
              "N/A"
            }
          </div>

          <div class="card-detail">
            🚛 N/A
          </div>

          <div style="
            font-size:11.5px;
            color:#94a3b8;
            margin-top:2px
          ">
            Plate:
            ${
              selectedChallan.license_plate ||
              "N/A"
            }
          </div>

        </div>

      </div>

      <div class="table-container">

        <table>

          <thead>

            <tr>

              <th>LR Number</th>
              <th>From</th>
              <th>To</th>
              <th>Consignor</th>
              <th>Consignee</th>
              <th>Goods</th>
              <th>Weight</th>
              <th>Freight</th>

            </tr>

          </thead>

          <tbody>

            ${rows}

          </tbody>

          <tfoot>

            <tr>

              <td
                colspan="6"
                style="color:#0f172a"
              >
                Total
                (${challanShipments.length}
                consignments)
              </td>

              <td style="color:#0f172a">
                ${totalWeight.toLocaleString(
                  "en-IN"
                )}
                kg
              </td>

              <td>
                ₹${totalFreight.toLocaleString(
                  "en-IN"
                )}
              </td>

            </tr>

          </tfoot>

        </table>

      </div>

      <div class="signatures">

        <div class="sig-box">

          <div class="sig-line"></div>

          <div class="sig-label">
            Consignor Signature
          </div>

        </div>

        <div class="sig-box">

          <div class="sig-line"></div>

          <div class="sig-label">
            Driver Signature
          </div>

        </div>

        <div class="sig-box">

          <div class="sig-line"></div>

          <div class="sig-label">
            Receiver Signature
          </div>

        </div>

      </div>

      <div class="footer-note">

        Blockchain Secured Hash:
        ${challanHash}

      </div>

      </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.print();
  };

  // =========================
  // CATEGORY HELPERS
  // =========================
  const getCategoryIcon = (category) => {
    const icons = {
      fuel: "⛽",
      maintenance: "🔧",
      repair: "🔨",
      toll: "🛣️",
      driver_allowance: "👨‍✈️",
      loading_unloading: "📦",
      parking: "🅿️",
      other: "📋",
    };

    return icons[category] || "📋";
  };

  const getCategoryLabel = (category) => {
    const labels = {
      fuel: "Fuel",
      maintenance: "Maintenance",
      repair: "Repair",
      toll: "Toll",
      driver_allowance: "Driver Allowance",
      loading_unloading: "Loading/Unloading",
      parking: "Parking",
      other: "Other",
    };

    return labels[category] || category;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: "Cash",
      bank_transfer: "Bank Transfer",
      cheque: "Cheque",
      upi: "UPI",
      credit_card: "Credit Card",
    };

    return labels[method] || method;
  };

  // =========================
  // SEARCH
  // =========================
  const filteredHistory = useMemo(() => {
    const q = searchTerm.toLowerCase();

    return history.filter((item) => {
      const safeId = String(
        item.challan_no || ""
      ).toLowerCase();

      const safeDriver = String(
        item.driver_name || ""
      ).toLowerCase();

      const safePlate = String(
        item.license_plate || ""
      ).toLowerCase();

      return (
        safeId.includes(q) ||
        safeDriver.includes(q) ||
        safePlate.includes(q)
      );
    });
  }, [history, searchTerm]);

  // =========================
  // DATE FORMAT
  // =========================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    return new Date(
      dateString
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";

    return new Date(
      dateString
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatInr = (num) =>
    `₹${Number(
      num || 0
    ).toLocaleString("en-IN")}`;

  // =========================
  // GET EXPENSES FOR CHALLAN
  // =========================
  // ✅ FIX: previously this compared expenseChallanId / challanId using
  // String(...) equality. If one side was e.g. "5" (string) and the other
  // 5 (number) that's fine with String(), but if either side had leading
  // zeros, whitespace, or was accidentally a mongo/uuid-like value vs a
  // plain int, the strict string match silently failed for every row and
  // every expense fell into the "no expenses" branch (all "—" in the UI).
  // Switched the ID comparison to Number(...) equality (which normalizes
  // "5", 5, " 5 " all to the same value) and kept the challan_no fallback
  // but trimmed + lowercased both sides for safety. Also added a one-time
  // debug log so any remaining mismatch is immediately visible in the
  // console instead of silently rendering "—".
  const getChallanExpenses = (challan) => {
    const challanId = challan.challan_id || challan.id;
    const challanNo = challan.challan_no;

    const matched = expenses.filter((expense) => {
      const expenseChallanId = expense.challan_id ?? expense.challanId;
      const expenseChallanNo = expense.challan_no;

      const idMatch =
        expenseChallanId != null &&
        challanId != null &&
        !Number.isNaN(Number(expenseChallanId)) &&
        !Number.isNaN(Number(challanId)) &&
        Number(expenseChallanId) === Number(challanId);

      const noMatch =
        expenseChallanNo &&
        challanNo &&
        String(expenseChallanNo).trim().toLowerCase() ===
          String(challanNo).trim().toLowerCase();

      return idMatch || noMatch;
    });

    // 🔍 TEMP DEBUG — remove once matching is confirmed working.
    // Fires only when there ARE expenses loaded but none matched this
    // particular challan, so it won't spam the console for challans that
    // genuinely have no expenses yet.
    if (expenses.length > 0 && matched.length === 0) {
      console.log("No expense match for challan:", {
        challanId,
        challanNo,
        sampleExpense: expenses[0],
      });
    }

    return matched;
  };

  // =========================
  // RENDER
  // =========================
  return (
    <Container>

      {/* =========================
          HEADER
      ========================= */}

      <PageHeader>

        <div>

          <h1>
            Master Challan Registry
          </h1>

          <p className="subtitle">
            Immutable ledger of all generated
            transport manifests.
          </p>

        </div>

        <AddButton
          onClick={openAddExpense}
        >
          <Plus size={17} />
          Add Expense
        </AddButton>

      </PageHeader>

      {/* =========================
          SEARCH
      ========================= */}

      <Toolbar>

        <div className="search-wrapper">

          <Search
            size={18}
            className="search-icon"
          />

          <input
            type="text"
            placeholder="Search by ID, Driver, or Plate..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />

        </div>

      </Toolbar>

      {/* =========================
          TABLE
      ========================= */}

      <TableCard>

        <TableWrapper>

          <Table>

            <thead>

              <tr>

                <th>
                  Creation Date
                </th>

                <th>
                  Challan ID
                </th>

                <th>
                  Driver Profile
                </th>

                <th>
                  Vehicle Asset
                </th>

                <th>
                  Category
                </th>

                <th>
                  Amount (₹)
                </th>

                <th>
                  Expense Date
                </th>

                <th>
                  Payment Method
                </th>

                <th>
                  Vendor
                </th>

                <th>
                  Receipt #
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ||
              loadingExpenses ? (

                <tr>

                  <td
                    colSpan="12"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "40px",
                    }}
                  >
                    Loading records...
                  </td>

                </tr>

              ) : filteredHistory.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="12"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "60px",
                      color:
                        "#64748B",
                    }}
                  >

                    <History
                      size={48}
                      style={{
                        margin:
                          "0 auto 16px auto",
                        opacity: 0.5,
                      }}
                    />

                    <p>
                      No historical
                      records found.
                    </p>

                  </td>

                </tr>

              ) : (

                filteredHistory.map(
                  (row) => {

                    const rowExpenses =
                      getChallanExpenses(
                        row
                      );

                    // =====================
                    // EXPENSE ROWS
                    // =====================

                    if (
                      rowExpenses.length >
                      0
                    ) {

                      return rowExpenses.map(
                        (
                          expense,
                          idx
                        ) => {

                          const expenseId = expense.expense_id || expense.id;

                          return (
                            <tr
                              key={`${row.id || row.challan_no}-${expenseId || idx}`}
                              className="clickable-row"
                              onClick={() =>
                                handlePreview(
                                  row
                                )
                              }
                            >

                              <td>

                                <div className="flex-center text-gray">

                                  <Calendar
                                    size={14}
                                    className="mr-2"
                                  />

                                  {formatDate(
                                    row.created_at
                                  )}

                                </div>

                              </td>

                              <td>

                                <div className="font-mono font-medium">

                                  {
                                    row.challan_no
                                  }

                                </div>

                              </td>

                              <td>

                                <div className="font-medium">

                                  {
                                    row.driver_name ||
                                    "Unassigned"
                                  }

                                </div>

                              </td>

                              <td>

                                <div className="flex-center">

                                  <Truck
                                    size={14}
                                    className="mr-2 text-gray"
                                  />

                                  <span className="font-mono">

                                    {
                                      row.license_plate ||
                                      "N/A"
                                    }

                                  </span>

                                </div>

                              </td>

                              <td>

                                <CategoryBadge>

                                  {
                                    getCategoryIcon(
                                      expense.category
                                    )
                                  }

                                  {
                                    getCategoryLabel(
                                      expense.category
                                    )
                                  }

                                </CategoryBadge>

                              </td>

                              <td>

                                <div className="font-mono font-semibold text-green-600">

                                  {
                                    formatInr(
                                      expense.amount
                                    )
                                  }

                                </div>

                              </td>

                              <td>

                                <div className="flex-center text-gray">

                                  <Calendar
                                    size={14}
                                    className="mr-2"
                                  />

                                  {
                                    formatDateShort(
                                      expense.date
                                    )
                                  }

                                </div>

                              </td>

                              <td>

                                <PaymentBadge>

                                  {
                                    getPaymentMethodLabel(
                                      expense.paymentMethod
                                    )
                                  }

                                </PaymentBadge>

                              </td>

                              <td>

                                <div className="text-sm">

                                  {
                                    expense.vendor ||
                                    "N/A"
                                  }

                                </div>

                              </td>

                              <td>

                                <div className="font-mono text-xs">

                                  {
                                    expense.receiptNumber ||
                                    "N/A"
                                  }

                                </div>

                              </td>

                              <td>

                                <StatusBadge
                                  $status={
                                    row.status
                                  }
                                >

                                  {
                                    row.status ||
                                    "Draft"
                                  }

                                </StatusBadge>

                              </td>

                              <td
                                onClick={(e) =>
                                  e.stopPropagation()
                                }
                              >

                                <ActionButtons>

                                  <ActionButton
                                    title="View Details"
                                    onClick={() =>
                                      handlePreview(
                                        row
                                      )
                                    }
                                  >
                                    <Eye
                                      size={16}
                                    />
                                  </ActionButton>

                                  <ActionButton
                                    title="Edit Expense"
                                    onClick={() =>
                                      openEditExpense(
                                        expense
                                      )
                                    }
                                  >
                                    <Edit
                                      size={16}
                                    />
                                  </ActionButton>

                                  <ActionButton
                                    title="Delete Expense"
                                    $danger
                                    disabled={
                                      deletingExpenseId ===
                                      expenseId
                                    }
                                    onClick={() =>
                                      handleDeleteExpense(
                                        expense
                                      )
                                    }
                                  >
                                    <Trash2
                                      size={16}
                                    />
                                  </ActionButton>

                                </ActionButtons>

                              </td>

                            </tr>
                          );
                        }
                      );
                    }

                    // =====================
                    // CHALLAN WITHOUT EXPENSE
                    // =====================

                    return (

                      <tr
                        key={
                          row.id ||
                          row.challan_no
                        }
                        onClick={() =>
                          handlePreview(
                            row
                          )
                        }
                        className="clickable-row"
                      >

                        <td>

                          <div className="flex-center text-gray">

                            <Calendar
                              size={14}
                              className="mr-2"
                            />

                            {formatDate(
                              row.created_at
                            )}

                          </div>

                        </td>

                        <td>

                          <div className="font-mono font-medium">

                            {
                              row.challan_no
                            }

                          </div>

                        </td>

                        <td>

                          <div className="font-medium">

                            {
                              row.driver_name ||
                              "Unassigned"
                            }

                          </div>

                        </td>

                        <td>

                          <div className="flex-center">

                            <Truck
                              size={14}
                              className="mr-2 text-gray"
                            />

                            <span className="font-mono">

                              {
                                row.license_plate ||
                                "N/A"
                              }

                            </span>

                          </div>

                        </td>

                        <td>
                          <span className="empty-value">
                            —
                          </span>
                        </td>

                        <td>
                          <span className="empty-value">
                            —
                          </span>
                        </td>

                        <td>
                          <span className="empty-value">
                            —
                          </span>
                        </td>

                        <td>
                          <span className="empty-value">
                            —
                          </span>
                        </td>

                        <td>
                          <span className="empty-value">
                            —
                          </span>
                        </td>

                        <td>
                          <span className="empty-value">
                            —
                          </span>
                        </td>

                        <td>

                          <StatusBadge
                            $status={
                              row.status
                            }
                          >

                            {
                              row.status ||
                              "Draft"
                            }

                          </StatusBadge>

                        </td>

                        <td
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >

                          <ActionButtons>

                            <ActionButton
                              title="View Details"
                              onClick={() =>
                                handlePreview(
                                  row
                                )
                              }
                            >

                              <Eye
                                size={16}
                              />

                            </ActionButton>

                          </ActionButtons>

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </Table>

        </TableWrapper>

      </TableCard>

      {/* =====================================================
          EXPENSE MODAL
      ===================================================== */}

      {showExpenseForm && (

        <ModalOverlay
          onClick={closeExpenseForm}
        >

          <Modal
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              maxWidth: "700px",
            }}
          >

            <ModalHeader>

              <div className="flex-center">

                <DollarSign
                  size={20}
                  className="mr-2 text-indigo-600"
                />

                <h3>

                  {editingExpense
                    ? "Edit Expense"
                    : "Add New Expense"}

                </h3>

              </div>

              <IconButton
                onClick={
                  closeExpenseForm
                }
              >

                <X size={20} />

              </IconButton>

            </ModalHeader>

            <ModalBody
              style={{
                padding:
                  "24px 32px",
              }}
            >

              {expenseError && (

                <AlertBox
                  $type="error"
                >

                  <AlertCircle
                    size={18}
                  />

                  <span>
                    {expenseError}
                  </span>

                </AlertBox>

              )}

              {expenseSuccess && (

                <AlertBox
                  $type="success"
                >

                  <span>✓</span>

                  <span>
                    {expenseSuccess}
                  </span>

                </AlertBox>

              )}

              <ExpenseForm
                onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
              >

                <FormGrid>

                  {/* CHALLAN */}

                  <FormGroup>

                    <Label required>
                      Challan ID
                    </Label>

                    <Select
                      value={String(expenseData.challanId)}
                      onChange={(e) =>
                        setExpenseData({
                          ...expenseData,
                          challanId:
                            e.target.value,
                        })
                      }
                      required
                    >

                      <option value="">
                        Select Challan
                      </option>

                      {history.map(
                        (challan) => {

                          const challanId =
                            challan.challan_id ||
                            challan.id;

                          return (

                            <option
                              key={
                                challanId ||
                                challan.challan_no
                              }
                              value={String(challanId || challan.challan_no)}
                            >

                              {
                                challan.challan_no
                              }

                              {" - "}

                              {
                                challan.driver_name ||
                                "Unassigned"
                              }

                            </option>

                          );

                        }
                      )}

                    </Select>

                  </FormGroup>

                  {/* CATEGORY */}

                  <FormGroup>

                    <Label required>
                      Category
                    </Label>

                    <Select
                      value={
                        expenseData.category
                      }
                      onChange={(e) =>
                        setExpenseData({
                          ...expenseData,
                          category:
                            e.target.value,
                        })
                      }
                      required
                    >

                      <option value="">
                        Select Category
                      </option>

                      <option value="fuel">
                        ⛽ Fuel
                      </option>

                      <option value="maintenance">
                        🔧 Maintenance
                      </option>

                      <option value="repair">
                        🔨 Repair
                      </option>

                      <option value="toll">
                        🛣️ Toll
                      </option>

                      <option value="driver_allowance">
                        👨‍✈️ Driver Allowance
                      </option>

                      <option value="loading_unloading">
                        📦 Loading/Unloading
                      </option>

                      <option value="parking">
                        🅿️ Parking
                      </option>

                      <option value="other">
                        📋 Other
                      </option>

                    </Select>

                  </FormGroup>

                  {/* AMOUNT */}

                  <FormGroup>

                    <Label required>
                      Amount (₹)
                    </Label>

                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={
                        expenseData.amount
                      }
                      onChange={(e) =>
                        setExpenseData({
                          ...expenseData,
                          amount:
                            e.target.value,
                        })
                      }
                      required
                    />

                  </FormGroup>

                  {/* DATE */}

                  <FormGroup>

                    <Label>
                      Expense Date
                    </Label>

                    <Input
                      type="date"
                      value={
                        expenseData.date
                      }
                      onChange={(e) =>
                        setExpenseData({
                          ...expenseData,
                          date:
                            e.target.value,
                        })
                      }
                    />

                  </FormGroup>

                  {/* PAYMENT */}

                  <FormGroup>

                    <Label>
                      Payment Method
                    </Label>

                    <Select
                      value={
                        expenseData.paymentMethod
                      }
                      onChange={(e) =>
                        setExpenseData({
                          ...expenseData,
                          paymentMethod:
                            e.target.value,
                        })
                      }
                    >

                      <option value="cash">
                        Cash
                      </option>

                      <option value="bank_transfer">
                        Bank Transfer
                      </option>

                      <option value="cheque">
                        Cheque
                      </option>

                      <option value="upi">
                        UPI
                      </option>

                      <option value="credit_card">
                        Credit Card
                      </option>

                    </Select>

                  </FormGroup>

                  {/* VENDOR */}

                  <FormGroup>

                    <Label>
                      Vendor
                    </Label>

                    <Input
                      type="text"
                      placeholder="Vendor name"
                      value={
                        expenseData.vendor
                      }
                      onChange={(e) =>
                        setExpenseData({
                          ...expenseData,
                          vendor:
                            e.target.value,
                        })
                      }
                    />

                  </FormGroup>

                  {/* DESCRIPTION */}

                  <FormGroup
                    style={{
                      gridColumn:
                        "span 2",
                    }}
                  >

                    <Label>
                      Description
                    </Label>

                    <TextArea
                      placeholder="Enter expense description..."
                      value={
                        expenseData.description
                      }
                      onChange={(e) =>
                        setExpenseData({
                          ...expenseData,
                          description:
                            e.target.value,
                        })
                      }
                      rows="3"
                    />

                  </FormGroup>

                  {/* RECEIPT */}

                  <FormGroup>

                    <Label>
                      Receipt Number
                    </Label>

                    <Input
                      type="text"
                      placeholder="Receipt/Invoice #"
                      value={
                        expenseData.receiptNumber
                      }
                      onChange={(e) =>
                        setExpenseData({
                          ...expenseData,
                          receiptNumber:
                            e.target.value,
                        })
                      }
                    />

                  </FormGroup>

                </FormGrid>

                <FormActions>

                  <Button
                    $variant="ghost"
                    type="button"
                    onClick={
                      closeExpenseForm
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    $variant="primary"
                    type="submit"
                    disabled={
                      expenseSubmitting
                    }
                  >

                    {expenseSubmitting
                      ? editingExpense
                        ? "Updating..."
                        : "Adding..."
                      : editingExpense
                      ? "Update Expense"
                      : "Add Expense"}

                  </Button>

                </FormActions>

              </ExpenseForm>

            </ModalBody>

          </Modal>

        </ModalOverlay>

      )}

      {/* =====================================================
          CHALLAN PREVIEW MODAL
      ===================================================== */}

      {selectedChallan && (

        <ModalOverlay
          onClick={() =>
            setSelectedChallan(null)
          }
        >

          <Modal
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <ModalHeader>

              <div className="flex-center">

                <FileText
                  size={20}
                  className="mr-2 text-indigo-600"
                />

                <h3>
                  Manifest Preview
                </h3>

              </div>

              <IconButton
                onClick={() =>
                  setSelectedChallan(
                    null
                  )
                }
              >

                <X size={20} />

              </IconButton>

            </ModalHeader>

            <ModalBody>

              <div className="preview-header">

                <span className="label">
                  Challan Number
                </span>

                <h2 className="font-mono">
                  {
                    selectedChallan.challan_no
                  }
                </h2>

                <StatusBadge
                  $status={
                    selectedChallan.status
                  }
                  style={{
                    marginTop:
                      "12px",
                  }}
                >

                  {
                    selectedChallan.status ||
                    "Draft"
                  }

                </StatusBadge>

              </div>

              <InfoGrid>

                <InfoBlock>

                  <label>
                    Assigned Driver
                  </label>

                  <p className="flex-center">

                    <UserIcon
                      size={14}
                      className="mr-2 text-gray"
                    />

                    {
                      selectedChallan.driver_name ||
                      "N/A"
                    }

                  </p>

                </InfoBlock>

                <InfoBlock>

                  <label>
                    Dispatch Vehicle
                  </label>

                  <p className="flex-center font-mono">

                    <Truck
                      size={14}
                      className="mr-2 text-gray"
                    />

                    {
                      selectedChallan.license_plate ||
                      "N/A"
                    }

                  </p>

                </InfoBlock>

                <InfoBlock>

                  <label>
                    Timestamp
                  </label>

                  <p className="flex-center">

                    <Calendar
                      size={14}
                      className="mr-2 text-gray"
                    />

                    {formatDate(
                      selectedChallan.created_at
                    )}

                  </p>

                </InfoBlock>

                <InfoBlock>

                  <label>
                    Blockchain Sync
                  </label>

                  <p
                    className="font-mono text-indigo-600"
                    style={{
                      fontSize:
                        "11px",
                      wordBreak:
                        "break-all",
                    }}
                  >

                    {challanHash}

                  </p>

                </InfoBlock>

              </InfoGrid>

              <div
                style={{
                  marginTop:
                    "32px",
                }}
              >

                <h4
                  style={{
                    fontSize:
                      "14px",
                    fontWeight: 600,
                    color:
                      "#1e293b",
                    marginBottom:
                      "12px",
                    display:
                      "flex",
                    alignItems:
                      "center",
                  }}
                >

                  <Package
                    size={16}
                    className="mr-2 text-gray"
                  />

                  Attached
                  Consignments
                  (LRs)

                </h4>

                <ShipmentListWrapper>

                  {loadingShipments ? (

                    <div
                      style={{
                        padding:
                          "20px",
                        textAlign:
                          "center",
                        color:
                          "#64748b",
                      }}
                    >
                      Locating attached
                      manifests...
                    </div>

                  ) : challanShipments.length ===
                    0 ? (

                    <div
                      style={{
                        padding:
                          "20px",
                        textAlign:
                          "center",
                        color:
                          "#64748b",
                        background:
                          "#f8fafc",
                      }}
                    >
                      No LRs are currently
                      attached to this
                      dispatch ticket.
                    </div>

                  ) : (

                    <ShipmentTable>

                      <thead>

                        <tr>

                          <th>
                            LR Number
                          </th>

                          <th>
                            Destination
                          </th>

                          <th>
                            Weight
                          </th>

                          <th>
                            Freight
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {challanShipments.map(
                          (lr) => (

                            <tr
                              key={lr.id}
                            >

                              <td className="font-mono font-medium text-indigo-600">

                                {
                                  lr.lr_number
                                }

                              </td>

                              <td>

                                {
                                  lr.delivery_location ||
                                  lr.destination ||
                                  "N/A"
                                }

                              </td>

                              <td>

                                {
                                  lr.weight
                                }{" "}
                                {
                                  lr.weight_type
                                }

                              </td>

                              <td className="font-medium">

                                {
                                  formatInr(
                                    lr.freight_charge
                                  )
                                }

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </ShipmentTable>

                  )}

                </ShipmentListWrapper>

              </div>

            </ModalBody>

            <ModalFooter>

              <Button
                $variant="ghost"
                onClick={() =>
                  setSelectedChallan(
                    null
                  )
                }
              >
                Close Viewer
              </Button>

              <Button
                $variant="primary"
                onClick={
                  printOfficialChallan
                }
                disabled={
                  challanShipments.length ===
                  0
                }
              >

                <Printer
                  size={16}
                  className="mr-2"
                />

                Reprint Master PDF

              </Button>

            </ModalFooter>

          </Modal>

        </ModalOverlay>

      )}

    </Container>
  );
}

// ============================================================
// STYLES
// ============================================================

const Container = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 32px;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  color: #0f172a;
`;

const PageHeader = styled.header`
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;

  h1 {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 18px;
  background: #02010c;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #111827;
    transform: translateY(-1px);
  }
`;

const Toolbar = styled.div`
  margin-bottom: 24px;

  .search-wrapper {
    position: relative;
    max-width: 400px;

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    input {
      width: 100%;
      padding: 12px 16px 12px 42px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      background: white;

      &:focus {
        border-color: #6366f1;
        box-shadow:
          0 0 0 3px
          rgba(99, 102, 241, 0.1);
      }
    }
  }
`;

const TableCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px
    rgba(0, 0, 0, 0.02);
  overflow: hidden;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;

  thead {
    background: #f8fafc;

    th {
      padding: 14px 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom:
        2px solid #e2e8f0;
      white-space: nowrap;
    }
  }

  tbody {
    tr.clickable-row {
      border-bottom:
        1px solid #f1f5f9;
      cursor: pointer;
      transition:
        background 0.15s ease;

      &:hover {
        background: #f8fafc;
      }
    }

    td {
      padding: 14px 16px;
      font-size: 13px;
      vertical-align: middle;

      .flex-center {
        display: flex;
        align-items: center;
      }

      .mr-2 {
        margin-right: 8px;
      }

      .text-gray {
        color: #64748b;
      }

      .text-gray-400 {
        color: #94a3b8;
      }

      .text-green-600 {
        color: #059669;
      }

      .font-mono {
        font-family:
          ui-monospace,
          monospace;
      }

      .font-medium {
        font-weight: 500;
      }

      .font-semibold {
        font-weight: 600;
      }

      .text-sm {
        font-size: 12px;
      }

      .text-xs {
        font-size: 11px;
      }

      .empty-value {
        color: #94a3b8;
      }
    }
  }
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #eef2ff;
  color: #4338ca;
`;

const PaymentBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #f1f5f9;
  color: #475569;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;

  background: ${(p) =>
    p.$status === "settled"
      ? "#ECFDF5"
      : "#EEF2FF"};

  color: ${(p) =>
    p.$status === "settled"
      ? "#059669"
      : "#4338CA"};
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 5px;

  border: none;

  background: transparent;

  border-radius: 5px;

  color: #94a3b8;

  cursor: pointer;

  &:hover {
    color: ${(props) =>
      props.$danger
        ? "#ef4444"
        : "#4f46e5"};

    background: ${(props) =>
      props.$danger
        ? "#fee2e2"
        : "#eef2ff"};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;

  background:
    rgba(15, 23, 42, 0.4);

  backdrop-filter: blur(4px);

  display: flex;

  justify-content: center;
  align-items: center;

  z-index: 2000;

  padding: 20px;
`;

const Modal = styled.div`
  background: white;

  border-radius: 20px;

  width: 100%;

  max-width: 600px;

  max-height: 90vh;

  display: flex;

  flex-direction: column;

  box-shadow:
    0 25px 50px -12px
    rgba(0, 0, 0, 0.25);

  overflow: hidden;

  border:
    1px solid #e2e8f0;
`;

const ModalHeader = styled.div`
  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 24px 32px;

  border-bottom:
    1px solid #f1f5f9;

  background: #fafaf9;

  flex-shrink: 0;

  .flex-center {
    display: flex;
    align-items: center;
  }

  h3 {
    margin: 0;

    font-size: 18px;

    font-weight: 700;

    color: #0f172a;
  }

  .text-indigo-600 {
    color: #4f46e5;
  }

  .mr-2 {
    margin-right: 8px;
  }
`;

const IconButton = styled.button`
  display: inline-flex;

  padding: 8px;

  border-radius: 8px;

  border:
    1px solid #e2e8f0;

  background: white;

  color: #64748b;

  cursor: pointer;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`;

const ModalBody = styled.div`
  padding: 32px;

  overflow-y: auto;

  flex-grow: 1;

  .preview-header {
    text-align: center;

    margin-bottom: 32px;

    padding-bottom: 24px;

    border-bottom:
      1px dashed #e2e8f0;

    .label {
      font-size: 12px;

      font-weight: 700;

      text-transform: uppercase;

      color: #64748b;
    }

    h2 {
      margin: 8px 0 0 0;

      font-size: 28px;

      color: #0f172a;
    }
  }

  .font-mono {
    font-family:
      ui-monospace,
      monospace;
  }

  .text-indigo-600 {
    color: #4f46e5;
  }
`;

const InfoGrid = styled.div`
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 24px;
`;

const InfoBlock = styled.div`
  display: flex;

  flex-direction: column;

  gap: 8px;

  label {
    font-size: 12px;

    font-weight: 600;

    color: #64748b;

    text-transform: uppercase;
  }

  p {
    margin: 0;

    font-size: 15px;

    font-weight: 500;

    color: #0f172a;
  }

  .text-gray {
    color: #94a3b8;
  }

  .flex-center {
    display: flex;
    align-items: center;
  }

  .mr-2 {
    margin-right: 8px;
  }
`;

const ShipmentListWrapper = styled.div`
  border:
    1px solid #e2e8f0;

  border-radius: 10px;

  overflow: hidden;
`;

const ShipmentTable = styled.table`
  width: 100%;

  border-collapse: collapse;

  text-align: left;

  font-size: 13px;

  thead {
    background: #f8fafc;

    th {
      padding: 10px 14px;

      font-size: 11px;

      font-weight: 600;

      text-transform: uppercase;

      color: #64748b;

      border-bottom:
        1px solid #e2e8f0;
    }
  }

  tbody {
    tr {
      border-bottom:
        1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 12px 14px;

      color: #334155;
    }
  }

  .font-mono {
    font-family:
      ui-monospace,
      monospace;
  }

  .font-medium {
    font-weight: 500;
  }

  .text-indigo-600 {
    color: #4f46e5;
  }
`;

const ModalFooter = styled.div`
  display: flex;

  justify-content: flex-end;

  gap: 12px;

  padding: 24px 32px;

  background: #f8fafc;

  border-top:
    1px solid #f1f5f9;

  flex-shrink: 0;
`;

const Button = styled.button`
  display: inline-flex;

  align-items: center;

  justify-content: center;

  padding: 10px 18px;

  font-size: 13px;

  font-weight: 600;

  border-radius: 8px;

  cursor: pointer;

  transition: all 0.2s ease;

  .mr-2 {
    margin-right: 8px;
  }

  ${(props) =>
    props.$variant === "primary" &&
    `
      background: #0f172a;
      color: white;
      border: 1px solid #0f172a;

      &:hover {
        background: #1e293b;
        transform: translateY(-1px);
      }
    `}

  ${(props) =>
    props.$variant === "ghost" &&
    `
      background: transparent;
      color: #64748b;
      border: 1px solid transparent;

      &:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
    `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ============================================================
// EXPENSE FORM
// ============================================================

const ExpenseForm = styled.form`
  display: flex;

  flex-direction: column;

  gap: 20px;
`;

const FormGrid = styled.div`
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;

  flex-direction: column;

  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;

  font-weight: 600;

  color: #334155;

  ${(props) =>
    props.required &&
    `
      &::after {
        content: " *";
        color: #ef4444;
      }
    `}
`;

const Input = styled.input`
  padding: 10px 14px;

  border:
    1px solid #e2e8f0;

  border-radius: 8px;

  font-size: 14px;

  outline: none;

  background: white;

  &:focus {
    border-color: #6366f1;

    box-shadow:
      0 0 0 3px
      rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const Select = styled.select`
  padding: 10px 14px;

  border:
    1px solid #e2e8f0;

  border-radius: 8px;

  font-size: 14px;

  outline: none;

  background: white;

  cursor: pointer;

  &:focus {
    border-color: #6366f1;

    box-shadow:
      0 0 0 3px
      rgba(99, 102, 241, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 10px 14px;

  border:
    1px solid #e2e8f0;

  border-radius: 8px;

  font-size: 14px;

  outline: none;

  background: white;

  resize: vertical;

  font-family: inherit;

  &:focus {
    border-color: #6366f1;

    box-shadow:
      0 0 0 3px
      rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const FormActions = styled.div`
  display: flex;

  justify-content: flex-end;

  gap: 12px;

  padding-top: 8px;

  border-top:
    1px solid #e2e8f0;
`;

const AlertBox = styled.div`
  display: flex;

  align-items: center;

  gap: 10px;

  padding: 12px 16px;

  border-radius: 8px;

  margin-bottom: 16px;

  font-size: 14px;

  ${(props) =>
    props.$type === "error" &&
    `
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
    `}

  ${(props) =>
    props.$type === "success" &&
    `
      background: #d1fae5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    `}
`;
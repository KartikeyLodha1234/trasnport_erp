import { useState } from "react";

export default function AdminWallet() {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");

  const handlePayNow = () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    // Razorpay integration yahan baad me hogi
    alert(`Proceed to payment: ₹${amount}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg p-8">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-slate-800">
          Admin Wallet
        </h1>

        <p className="text-slate-500 mt-2">
          Manage your wallet balance.
        </p>

        {/* Balance Card */}
        <div className="mt-8 rounded-xl bg-blue-600 text-white p-6">
          <p className="text-sm">Current Balance</p>

          <h2 className="text-4xl font-bold mt-2">
            ₹0.00
          </h2>
        </div>

        {/* Add Money Button */}
        <button
          onClick={() => setShowModal(true)}
          className="mt-8 w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition"
        >
          Add Money
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white rounded-2xl w-full max-w-md p-6">

            <h2 className="text-2xl font-bold">
              Add Money
            </h2>

            <p className="text-slate-500 mt-1">
              Enter the amount you want to add.
            </p>

            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-6 w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-6 flex gap-3">

              <button
                onClick={() => {
                  setShowModal(false);
                  setAmount("");
                }}
                className="flex-1 rounded-lg border py-3 font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handlePayNow}
                className="flex-1 rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700"
              >
                Pay Now
              </button>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}   
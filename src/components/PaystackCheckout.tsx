import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, Lock, ShieldCheck, X, CheckCircle, Loader2 } from "lucide-react";

interface PaystackCheckoutProps {
  amountNaira: number;
  email: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function PaystackCheckout({ amountNaira, email, onSuccess, onClose }: PaystackCheckoutProps) {
  const [step, setStep] = useState<"form" | "pin" | "otp" | "processing" | "success">("form");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formattedCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formattedExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv) {
      setErrorMessage("Please fill all card details.");
      return;
    }
    setErrorMessage("");
    setLoading(true);

    // Simulate Paystack initializing card payment
    setTimeout(() => {
      setLoading(false);
      setStep("pin");
    }, 1200);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setErrorMessage("Please enter a valid 4-digit PIN.");
      return;
    }
    setErrorMessage("");
    setLoading(true);

    // Simulate Pin validation
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 1200);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 5) {
      setErrorMessage("Please enter the 5-digit OTP sent to your phone/email.");
      return;
    }
    setErrorMessage("");
    setLoading(true);

    // Simulate transaction clearing
    setTimeout(() => {
      setLoading(false);
      setStep("processing");

      setTimeout(() => {
        setStep("success");
        setTimeout(() => {
          onSuccess("sim-pay-" + Math.random().toString(36).substring(2, 12).toUpperCase());
        }, 1500);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        id="paystack-modal"
      >
        {/* Header */}
        <div className="bg-[#3bb75e] text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-100" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-100 font-semibold">Secured by Paystack</div>
              <div className="text-sm font-medium">Upgrade to Premium Plan</div>
            </div>
          </div>
          {step !== "processing" && step !== "success" && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-emerald-600/50 text-emerald-100 transition cursor-pointer"
              id="paystack-close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Info Strip */}
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex justify-between items-center">
          <div className="text-xs text-slate-600 font-medium">{email}</div>
          <div className="text-sm font-bold text-slate-800">
            ₦{amountNaira.toLocaleString()}
          </div>
        </div>

        {/* Content Box */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handlePay}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">Enter Your Card Details</h3>
                  <p className="text-[11px] text-slate-400">Accepting Visa, Mastercard, and Verve cards</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">CARD NUMBER</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formattedCardNumber(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">EXPIRY DATE</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => setExpiry(formattedExpiry(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 text-center focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">CVV</label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength={3}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 text-center focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-500 font-medium text-center">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#3bb75e] hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg text-sm shadow-md hover:shadow-lg transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Pay ₦{amountNaira.toLocaleString()}</span>
                  )}
                </button>
              </motion.form>
            )}

            {step === "pin" && (
              <motion.form
                key="pin"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handlePinSubmit}
                className="space-y-4"
              >
                <div className="text-center">
                  <Lock className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-slate-700">Enter Your Card PIN</h3>
                  <p className="text-[11px] text-slate-400">Please enter your 4-digit card security PIN</p>
                </div>

                <div className="flex justify-center py-2">
                  <input
                    type="password"
                    placeholder="••••"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="w-24 text-center tracking-widest text-xl px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-500 font-medium text-center">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#3bb75e] hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg text-sm transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Authorize Payment</span>}
                </button>
              </motion.form>
            )}

            {step === "otp" && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleOtpSubmit}
                className="space-y-4"
              >
                <div className="text-center">
                  <div className="inline-flex bg-emerald-50 p-2.5 rounded-full text-[#3bb75e] font-bold text-xs mb-2">
                    OTP SENT
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700">Enter Verification Code</h3>
                  <p className="text-[11px] text-slate-400">A 5-digit verification code was sent to your mobile phone</p>
                </div>

                <div className="flex justify-center py-2">
                  <input
                    type="text"
                    placeholder="12345"
                    maxLength={5}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-32 text-center tracking-widest text-lg px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-500 font-medium text-center">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#3bb75e] hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg text-sm transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Submit OTP</span>}
                </button>
              </motion.form>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="flex justify-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-[#3bb75e] animate-spin" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Processing Transaction...</h3>
                  <p className="text-[11px] text-slate-400">Please do not refresh or close this modal</p>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-[#3bb75e]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Payment Successful!</h3>
                  <p className="text-xs text-slate-500">Your premium prep tools are unlocked instantly.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-center items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <Lock className="h-3 w-3 text-slate-400" />
          <span>256-BIT SSL SECURED BANK-GRADE ENCRYPTION</span>
        </div>
      </motion.div>
    </div>
  );
}

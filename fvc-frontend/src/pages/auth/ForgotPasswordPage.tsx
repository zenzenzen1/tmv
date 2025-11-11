import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.png";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate API call here
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#6568D2] via-[#A564A1] to-[#BD638F] p-6">
      <div className="w-full max-w-lg rounded-xl shadow-xl bg-white/90 backdrop-blur-sm p-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 text-center">
          <img src={Logo} alt="FVC" className="h-16 w-16 object-contain" />
          <div className="text-left">
            <h1 className="text-2xl font-semibold uppercase">
              FPTU Vovinam Club
            </h1>
            <p className="text-gray-600">Management System</p>
          </div>
        </div>

        {/* Intro */}
        <div className="mt-8 text-center">
          <p className="font-medium">Forgot your password? No worries!</p>
          <p className="text-sm text-gray-600 mt-2">
            Simply enter your email address below,
            <br /> and we’ll send you a link to reset your password.
          </p>
        </div>

        {/* Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="mt-8">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email!"
              className="w-full rounded-md border border-gray-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="mt-6 w-full rounded-md bg-blue-600 py-3 text-white font-medium hover:bg-blue-700"
            >
              RESET YOUR PASSWORD
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-6 text-center">
            <div className="rounded border border-green-200 bg-green-50 text-green-700 p-3 text-sm">
              If this email exists, a reset link has been sent.
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full rounded-md bg-blue-600 py-3 text-white font-medium hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="mt-10 text-center text-xs text-gray-500">
          © 2025 All Rights Reserved. FVC
        </p>
      </div>
    </div>
  );
}

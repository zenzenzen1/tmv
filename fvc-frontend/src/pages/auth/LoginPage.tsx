// src/pages/LoginPage.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.png";
import Background from "../../assets/background.png";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useAuthActions, useAuth } from "../../stores/authStore";
import type { LoginRequest } from "../../types";
import { validateEmail, validateRequired } from "../../utils/validation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { login } = useAuthActions();
  const { isLoading, error } = useAuth();

  // Email validation
  const emailValidation = useMemo(() => {
    return validateEmail(formData.email, { required: true });
  }, [formData.email]);

  // Password validation
  const passwordValidation = useMemo(() => {
    return validateRequired(formData.password, "Mật khẩu");
  }, [formData.password]);

  // Form validation
  const isFormValid = useMemo(() => {
    return emailValidation.isValid && passwordValidation.isValid;
  }, [emailValidation.isValid, passwordValidation.isValid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!isFormValid) {
      return;
    }

    try {
      await login(formData);
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the store
      console.error("Login failed:", error);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${Background})` }}
    >
      {/* Main container */}
      <div className="flex items-center justify-center min-h-screen w-full p-4">
        {/* Form container */}
        <div
          className="w-full max-w-4xl rounded-md shadow-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden "
          style={{ backgroundColor: "#FAFAFAD9" }} // màu trắng nhạt, opacity ~70%
        >
          {/* Left Section */}
          <div className="flex flex-col justify-between p-8 md:p-12">
            <div className="flex items-center gap-4">
              <img src={Logo} alt="Logo" className="h-20 w-20 object-contain" />
              <div className="flex flex-col">
                <span className="text-xl font-medium leading-tight">
                  FPTU Vovinam Club
                </span>
                <span className="text-gray-700 text-sm">Management System</span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-2xl font-bold">
                <span className="text-[#0d8aff]">FPTU</span>{" "}
                <span className="text-[#DEA919]">Vovinam </span>
                <span className="text-red-500">Club</span>
              </h2>
              <p className="text-gray-700 mt-2 text-sm">
                “Tham gia FPTU Vovinam Club là tham gia một trong những nền văn
                hoá truyền thống võ học của dân tộc”
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-8">
              © 2025 All Rights Reserved. FVC
            </p>
          </div>

          {/* Right Section - Login Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Welcome Back
            </h2>
            <h1 className="text-2xl font-semibold mb-6">
              Log In to your Account
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className={`mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 bg-white/70 ${
                    emailValidation.isValid || formData.email === ""
                      ? "border-gray-300 focus:ring-blue-500"
                      : "border-red-500 focus:ring-red-500"
                  }`}
                  required
                />
                {!emailValidation.isValid && formData.email !== "" && (
                  <p className="text-red-500 text-xs mt-1">
                    {emailValidation.errorMessage}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="********"
                    autoComplete="current-password"
                    className={`w-full rounded-md border p-2 pr-10 focus:outline-none focus:ring-2 bg-white/70 ${
                      passwordValidation.isValid || formData.password === ""
                        ? "border-gray-300 focus:ring-blue-500"
                        : "border-red-500 focus:ring-red-500"
                    }`}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
                {!passwordValidation.isValid && formData.password !== "" && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordValidation.errorMessage}
                  </p>
                )}
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  Remember me
                </label>
                <Link to="/forgot" className="text-black hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-md font-medium transition-colors"
              >
                {isLoading ? "LOGGING IN..." : "CONTINUE"}
              </button>

              {/* Removed social login and sign up to simplify the login UI */}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

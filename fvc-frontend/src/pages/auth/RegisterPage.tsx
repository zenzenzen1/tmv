import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../assets/logo.png";
import Background from "../../assets/background.png";
import { Eye, EyeOff, Calendar, User, Mail, GraduationCap, Hash, UserCheck } from "lucide-react";
import { useAuthActions, useAuth } from "../../stores/authStore";
import type { FvcRegisterRequest } from "../../types";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FvcRegisterRequest>({
    fullName: "",
    personalMail: "",
    eduMail: "",
    password: "",
    confirmPassword: "",
    studentCode: "",
    dob: "",
    gender: "MALE",
  });

  const navigate = useNavigate();
  const { register } = useAuthActions();
  const { isLoading, error } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      await register(formData);
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the store
      console.error("Registration failed:", error);
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
          className="w-full max-w-4xl rounded-md shadow-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden"
          style={{ backgroundColor: "#FAFAFAD9" }}
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
                "Tham gia FPTU Vovinam Club là tham gia một trong những nền văn
                hoá truyền thống võ học của dân tộc"
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-8">
              © 2025 All Rights Reserved. FVC
            </p>
          </div>

          {/* Right Section - Registration Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Join Us
            </h2>
            <h1 className="text-2xl font-semibold mb-6">
              Create Your Account
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                  required
                />
              </div>

              {/* Personal Email */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail size={16} />
                  Personal Email
                </label>
                <input
                  type="email"
                  name="personalMail"
                  value={formData.personalMail}
                  onChange={handleInputChange}
                  placeholder="Enter your personal email"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                  required
                />
              </div>

              {/* Educational Email */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap size={16} />
                  Educational Email (Optional)
                </label>
                <input
                  type="email"
                  name="eduMail"
                  value={formData.eduMail}
                  onChange={handleInputChange}
                  placeholder="Enter your educational email"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                />
              </div>

              {/* Student Code */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Hash size={16} />
                  Student Code
                </label>
                <input
                  type="text"
                  name="studentCode"
                  value={formData.studentCode}
                  onChange={handleInputChange}
                  placeholder="Enter your student code"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                  required
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar size={16} />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <UserCheck size={16} />
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                  required
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
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
                    className="w-full rounded-md border border-gray-300 p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm font-medium">Confirm Password</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="********"
                    className="w-full rounded-md border border-gray-300 p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                    required
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-md font-medium transition-colors"
              >
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-sm text-gray-600 mt-4 text-center">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold hover:underline">
                SIGN IN HERE
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

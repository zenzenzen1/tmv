// src/pages/LoginPage.tsx
import { useState } from "react";
import Logo from "../../assets/logo.png";
import Background from "../../assets/background.png";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

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

            <form className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    className="w-full rounded-md border border-gray-300 p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors"
              >
                CONTINUE
              </button>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <hr className="flex-1 border-gray-300" />
                <span className="text-xs text-black">Or</span>
                <hr className="flex-1 border-gray-300" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 bg-white/80 hover:bg-gray-50 font-light"
              >
                <FcGoogle size={20} />
                Log In with Google
              </button>
            </form>

            {/* Signup */}
            <p className="text-sm text-gray-600 mt-4 text-center">
              New User?{" "}
              <a href="/register" className="font-semibold hover:underline">
                SIGN UP HERE
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

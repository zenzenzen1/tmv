import { useAuth } from "../stores/authStore";
import Header from "@/components/common/Header";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Dashboard Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Welcome, {user?.fullName}!
              </h2>
              <p className="text-green-700">
                You have successfully logged in to the FVC Management System.
              </p>
              <div className="mt-4 text-sm text-green-600">
                <p>
                  <strong>Student Code:</strong> {user?.studentCode}
                </p>
                <p>
                  <strong>Personal Email:</strong> {user?.personalMail}
                </p>
                <p>
                  <strong>Edu Email:</strong> {user?.eduMail}
                </p>
                <p>
                  <strong>Role:</strong> {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

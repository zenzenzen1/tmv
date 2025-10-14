import { useAuth, useAuthActions } from "../stores/authStore";

export default function DashboardPage() {
  const { user } = useAuth();
  const { logout } = useAuthActions();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Logout
            </button>
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
                <strong>Role:</strong> {user?.systemRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

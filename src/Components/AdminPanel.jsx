import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("ena-submit", {
        body: { action: "get-admin-users" },
      });
      if (res.data?.users) setUsers(res.data.users);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Admin Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">{users.length} accounts</p>
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      Joined:{" "}
                      {new Date(user.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <a
                    href="https://supabase.com/dashboard/project/wutqbleywmhihuedodny/auth/users"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100"
                  >
                    Manage
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

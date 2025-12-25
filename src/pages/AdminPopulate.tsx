import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import Header from "@/components/Header";
import { AdminPopulateBooks } from "@/components/AdminPopulateBooks";

const AdminPopulate = () => {
  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-slate-200 mb-2">Publisher Population</h1>
            <p className="text-slate-400">Populate publisher book collections from curated lists</p>
          </div>
          
          <AdminPopulateBooks />
        </main>
      </div>
    </ProtectedAdminRoute>
  );
};

export default AdminPopulate;

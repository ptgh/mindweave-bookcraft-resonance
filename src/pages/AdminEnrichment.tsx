import { AdminEnrichmentPanel } from "@/components/AdminEnrichmentPanel";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AdminEnrichment = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Author Enrichment Administration
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor author data enrichment from Wikipedia
          </p>
        </div>
        
        <AdminEnrichmentPanel />
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminEnrichment;

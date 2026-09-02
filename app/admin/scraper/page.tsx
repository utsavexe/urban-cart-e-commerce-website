"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  ExternalLink,
  Package,
  Clock,
  Upload,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ScrapedProduct {
  id: string;
  sourceSite: string;
  sourceUrl: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image: string | null;
  brand: string | null;
  rating: number | null;
  reviewCount: number | null;
  category: string | null;
  tags: string[];
  status: string;
  reviewedCategoryId: string | null;
  reviewedPrice: number | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "IMPORTED";

export default function AdminScraperPage() {
  // Scraping state
  const [mode, setMode] = useState<"url" | "keyword">("url");
  const [urls, setUrls] = useState("");
  const [keyword, setKeyword] = useState("");
  const [site, setSite] = useState("amazon");
  const [scraping, setScraping] = useState(false);

  // Queue state
  const [items, setItems] = useState<ScrapedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Review modal state
  const [reviewItem, setReviewItem] = useState<ScrapedProduct | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [reviewPrice, setReviewPrice] = useState("");
  const [reviewStock, setReviewStock] = useState("10");
  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({ pending: 0, approved: 0, imported: 0, total: 0 });

  // Auto-import state
  const [autoSite, setAutoSite] = useState("amazon");
  const [autoKeyword, setAutoKeyword] = useState("");
  const [autoScraping, setAutoScraping] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [recentJobs, setRecentJobs] = useState<Array<{
    id: string;
    site: string;
    keyword: string | null;
    status: string;
    totalScraped: number;
    totalImported: number;
    totalSkipped: number;
    createdAt: string;
  }>>([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/scraper?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load scraped products");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  const fetchStats = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, importedRes, rejectedRes] = await Promise.all([
        fetch("/api/admin/scraper?status=PENDING&limit=1"),
        fetch("/api/admin/scraper?status=APPROVED&limit=1"),
        fetch("/api/admin/scraper?status=IMPORTED&limit=1"),
        fetch("/api/admin/scraper?status=REJECTED&limit=1"),
      ]);
      const [pending, approved, imported, rejected] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        importedRes.json(),
        rejectedRes.json(),
      ]);
      const p = pending.pagination?.total || 0;
      const a = approved.pagination?.total || 0;
      const i = imported.pagination?.total || 0;
      const r = rejected.pagination?.total || 0;
      setStats({ pending: p, approved: a, imported: i, total: p + a + i + r });
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.allCategories || []))
      .catch(() => {});
  }, []);

  const fetchRecentJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/cron/scrape");
      const data = await res.json();
      setRecentJobs(data.jobs || []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchRecentJobs();
  }, [fetchRecentJobs]);

  const handleScrape = async () => {
    setScraping(true);
    try {
      let body: Record<string, unknown>;
      if (mode === "url") {
        const urlList = urls.split("\n").map((u) => u.trim()).filter(Boolean);
        if (urlList.length === 0) {
          toast.error("Please enter at least one URL");
          setScraping(false);
          return;
        }
        body = { urls: urlList };
      } else {
        if (!keyword.trim()) {
          toast.error("Please enter a search keyword");
          setScraping(false);
          return;
        }
        body = { keyword: keyword.trim(), site };
      }

      const res = await fetch("/api/admin/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Scraping completed");
        setUrls("");
        setKeyword("");
        fetchItems();
        fetchStats();
      } else {
        toast.error(data.error || "Scraping failed");
      }
    } catch {
      toast.error("Failed to scrape products");
    } finally {
      setScraping(false);
    }
  };

  const handleApprove = async () => {
    if (!reviewItem || !selectedCategoryId || !reviewPrice) {
      toast.error("Please fill in category and price");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/scraper/${reviewItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewedCategoryId: selectedCategoryId,
          reviewedPrice: Number(reviewPrice),
        }),
      });

      if (res.ok) {
        toast.success("Product approved");
        setReviewItem(null);
        fetchItems();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to approve");
      }
    } catch {
      toast.error("Failed to approve product");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/scraper/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (res.ok) {
        toast.success("Product rejected");
        fetchItems();
        fetchStats();
      }
    } catch {
      toast.error("Failed to reject product");
    }
  };

  const handleImport = async (item: ScrapedProduct) => {
    if (!item.reviewedCategoryId || !item.reviewedPrice) {
      toast.error("Please approve this product first with category and price");
      return;
    }

    try {
      const res = await fetch(`/api/admin/scraper/${item.id}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewedCategoryId: item.reviewedCategoryId,
          reviewedPrice: item.reviewedPrice,
          stock: Number(reviewStock) || 10,
        }),
      });

      if (res.ok) {
        toast.success("Product imported to catalog");
        fetchItems();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to import");
      }
    } catch {
      toast.error("Failed to import product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scraped product?")) return;
    try {
      const res = await fetch(`/api/admin/scraper/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted");
        fetchItems();
        fetchStats();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAutoScrape = async () => {
    if (!autoKeyword.trim()) {
      toast.error("Enter a search keyword");
      return;
    }
    setAutoScraping(true);
    try {
      const res = await fetch("/api/cron/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: autoSite, keyword: autoKeyword.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Auto-import job started: ${data.jobId}`);
        setAutoKeyword("");
        fetchRecentJobs();
        // Poll for completion
        setTimeout(() => { fetchItems(); fetchStats(); fetchRecentJobs(); }, 5000);
      } else {
        toast.error(data.error || "Failed to start auto-import");
      }
    } catch {
      toast.error("Failed to start auto-import");
    } finally {
      setAutoScraping(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/cron/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sync done: ${data.updated} updated, ${data.outOfStock} out-of-stock`);
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const openReview = (item: ScrapedProduct) => {
    setReviewItem(item);
    setSelectedCategoryId(item.reviewedCategoryId || "");
    setReviewPrice(item.reviewedPrice ? String(item.reviewedPrice) : "");
    setReviewStock("10");
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    IMPORTED: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Product Scraper</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Scrape products from e-commerce sites and import them to your catalog
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 p-2.5">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Pending</p>
            <p className="text-lg font-bold">{stats.pending}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-2.5">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Approved</p>
            <p className="text-lg font-bold">{stats.approved}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-2.5">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Imported</p>
            <p className="text-lg font-bold">{stats.imported}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 p-2.5">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Total Scraped</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Scrape Form */}
      <div className="border border-border rounded-xl p-6 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
            New Scrape Job
          </h3>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "url" ? "default" : "outline"}
            onClick={() => setMode("url")}
          >
            URL Mode
          </Button>
          <Button
            size="sm"
            variant={mode === "keyword" ? "default" : "outline"}
            onClick={() => setMode("keyword")}
          >
            Keyword Search
          </Button>
        </div>

        {mode === "url" ? (
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Product URLs (one per line, max 20)
            </label>
            <textarea
              placeholder={`https://www.amazon.in/dp/B09WNK39JN\nhttps://www.flipkart.com/product/...`}
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="w-full mt-1 rounded-md border border-input bg-background p-3 text-sm font-mono"
              rows={4}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Search Keyword</label>
              <Input
                placeholder="e.g. wireless headphones"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Site</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="amazon">Amazon</option>
                <option value="flipkart">Flipkart</option>
                <option value="myntra">Myntra</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleScrape} disabled={scraping}>
            {scraping ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {scraping ? "Scraping..." : "Start Scraping"}
          </Button>
        </div>
      </div>

      {/* Auto-Import & Sync */}
      <div className="border border-border rounded-xl p-6 bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Auto-Import & Sync
            </h3>
          </div>
          <Button size="xs" variant="outline" onClick={handleSync} disabled={syncing}>
            {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Sync Prices
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Site</label>
            <select
              value={autoSite}
              onChange={(e) => setAutoSite(e.target.value)}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
              <option value="myntra">Myntra</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">Keyword (auto-import)</label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="e.g. wireless headphones"
                value={autoKeyword}
                onChange={(e) => setAutoKeyword(e.target.value)}
              />
              <Button onClick={handleAutoScrape} disabled={autoScraping} className="flex-shrink-0">
                {autoScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Auto-Import"}
              </Button>
            </div>
          </div>
        </div>

        {recentJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Recent Auto-Import Jobs</p>
            <div className="space-y-1">
              {recentJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between text-[10px] border-b border-border pb-1 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${
                      job.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                      job.status === "FAILED" ? "bg-red-100 text-red-800" :
                      job.status === "RUNNING" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {job.status}
                    </span>
                    <span className="font-medium">{job.site}</span>
                    {job.keyword && <span className="text-muted-foreground">"{job.keyword}"</span>}
                  </div>
                  <span className="text-muted-foreground">
                    {job.totalImported} imported / {job.totalScraped} scraped
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Queue Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PENDING", "APPROVED", "REJECTED", "IMPORTED"] as StatusFilter[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-2">{total} items</span>
      </div>

      {/* Queue Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-16">
          No scraped products found. Start a scrape job above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border font-bold">
                <th className="p-3">Product</th>
                <th className="p-3">Source</th>
                <th className="p-3">Scraped Price</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/10 last:border-0">
                  <td className="p-3 font-semibold flex items-center gap-2 max-w-[300px]">
                    {item.image && (
                      <img src={item.image} className="h-8 w-8 object-cover rounded bg-muted flex-shrink-0" alt={item.name} />
                    )}
                    <span className="truncate">{item.name}</span>
                  </td>
                  <td className="p-3 capitalize">{item.sourceSite}</td>
                  <td className="p-3">
                    {item.price > 0 ? `${item.currency} ${Math.round(item.price * 100) / 100}` : "N/A"}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded ${statusColors[item.status] || ""}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                      {item.status !== "IMPORTED" && (
                        <>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openReview(item)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          {item.status !== "REJECTED" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleReject(item.id)}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {item.status === "APPROVED" && (
                        <Button variant="default" size="icon" className="h-7 w-7" onClick={() => handleImport(item)}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-[10px] text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Review Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Review Scraped Product
            </h3>

            <div className="flex gap-4">
              {reviewItem.image && (
                <img src={reviewItem.image} className="h-24 w-24 object-cover rounded bg-muted" alt={reviewItem.name} />
              )}
              <div className="space-y-1">
                <p className="font-bold text-sm">{reviewItem.name}</p>
                {reviewItem.brand && <p className="text-xs text-muted-foreground">Brand: {reviewItem.brand}</p>}
                <p className="text-xs text-muted-foreground">
                  Scraped: {reviewItem.currency} {Math.round(reviewItem.price * 100) / 100}
                </p>
                {reviewItem.rating && (
                  <p className="text-xs text-muted-foreground">
                    Rating: {reviewItem.rating}/5 ({reviewItem.reviewCount || 0} reviews)
                  </p>
                )}
              </div>
            </div>

            {reviewItem.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">{reviewItem.description}</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Assign Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Price (in paise, e.g. 1000 = ₹10)
                </label>
                <Input
                  type="number"
                  value={reviewPrice}
                  onChange={(e) => setReviewPrice(e.target.value)}
                  placeholder="e.g. 499900 for ₹4,999"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Initial Stock</label>
                <Input
                  type="number"
                  value={reviewStock}
                  onChange={(e) => setReviewStock(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setReviewItem(null)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => { handleReject(reviewItem.id); setReviewItem(null); }}>
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={saving || !selectedCategoryId || !reviewPrice}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

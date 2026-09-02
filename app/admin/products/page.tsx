"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Trash2, Search } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  stock: number;
  image: string;
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [image, setImage] = useState("");
  const [stock, setStock] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", "10");

    fetch(`/api/admin/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  useEffect(() => {
    // Fetch categories for dropdown
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.allCategories || []))
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleEditClick = (p: Product) => {
    // Populate form
    setEditProductId(p.id);
    setName(p.name);
    // Fetch full description first
    fetch(`/api/products/${p.id}`)
      .then((res) => res.json())
      .then((data) => setDescription(data.description || ""))
      .catch(() => setDescription(""));

    setPrice(p.price);
    setOriginalPrice(p.originalPrice);
    setImage(p.image);
    setStock(p.stock);
    setCategoryId(p.category.id);
    setShowForm(true);
  };

  const handleAddNewClick = () => {
    setEditProductId(null);
    setName("");
    setDescription("");
    setPrice(0);
    setOriginalPrice(0);
    setImage("/placeholder.svg");
    setStock(10);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      description,
      price: Number(price),
      originalPrice: Number(originalPrice),
      image,
      stock: Number(stock),
      categoryId,
    };

    try {
      const url = editProductId ? `/api/admin/products/${editProductId}` : "/api/admin/products";
      const method = editProductId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editProductId ? "Product updated successfully!" : "Product created successfully!");
        setShowForm(false);
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to save product");
      }
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Product deleted successfully!");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Manage Products</h2>
          <p className="text-xs text-muted-foreground mt-1">Add, update, or remove inventory items from store catalog</p>
        </div>
        {!showForm && (
          <Button onClick={handleAddNewClick} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="border border-border rounded-xl p-6 bg-card space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
            {editProductId ? "Edit Product" : "Create Product"}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Product Name</label>
                <Input placeholder="Cool T-Shirt" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <textarea
                placeholder="Write description here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background p-3 text-sm"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Price (in Paise, e.g. 1000 = ₹10)</label>
                <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Original Price (in Paise)</label>
                <Input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(Number(e.target.value))} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Inventory Stock</label>
                <Input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} required />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Product Image URL / Path</label>
              <Input placeholder="/casual-tshirt.png" value={image} onChange={(e) => setImage(e.target.value)} required />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Product
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-1" /> Find
            </Button>
          </form>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-center text-destructive py-16">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-16">No products found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border font-bold">
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-muted/10 last:border-0">
                      <td className="p-3 font-semibold flex items-center gap-2">
                        <img src={p.image} className="h-8 w-8 object-cover rounded bg-muted" alt={p.name} />
                        <span>{p.name}</span>
                      </td>
                      <td className="p-3">{p.category.name}</td>
                      <td className="p-3">{formatPrice(p.price)}</td>
                      <td className="p-3">{p.stock}</td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditClick(p)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
              <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="flex items-center text-[10px] text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

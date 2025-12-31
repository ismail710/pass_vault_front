"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  
  const [passwords, setPasswords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visiblePasswords, setVisiblePasswords] = useState({});
  
  const [activePanel, setActivePanel] = useState(null); // 'add', 'edit', 'category', 'generator'
  const [editingPassword, setEditingPassword] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "", username: "", password: "", url: "", notes: "", categoryId: "",
  });
  
  const [newCategory, setNewCategory] = useState({ name: "", description: "", icon: "folder" });
  
  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16, includeNumbers: true, includeSymbols: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) { fetchPasswords(); fetchCategories(); }
  }, [user]);

  const fetchPasswords = async () => {
    try {
      const response = await apiService.get("/vault/entries");
      setPasswords(response || []);
    } catch (err) { setPasswords([]); }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.get("/vault/categories");
      setCategories(response || []);
    } catch (err) { setCategories([]); }
  };

  const generatePassword = async () => {
    try {
      const params = new URLSearchParams({
        length: generatorOptions.length.toString(),
        numbers: generatorOptions.includeNumbers.toString(),
        symbols: generatorOptions.includeSymbols.toString(),
      });
      const response = await apiService.get(`/generator/generate?${params}`);
      setGeneratedPassword(response.password || response);
    } catch (err) { setError("Failed to generate password"); }
  };

  const handleQuickGenerate = async () => {
    try {
      const params = new URLSearchParams({
        length: '16', numbers: 'true', symbols: 'true',
      });
      const response = await apiService.get(`/generator/generate?${params}`);
      const pwd = response.password || response;
      setFormData({ ...formData, password: pwd });
    } catch (err) { setError("Failed to generate password"); }
  };

  const useGeneratedPassword = () => {
    setFormData({ ...formData, password: generatedPassword });
    setActivePanel('add');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const payload = { ...formData };
      if (!payload.categoryId) delete payload.categoryId;
      
      if (editingPassword) {
        await apiService.put(`/vault/entries/${editingPassword.id}`, payload);
        setSuccess("Password updated!");
      } else {
        await apiService.post("/vault/entries", payload);
        setSuccess("Password saved!");
      }
      resetForm();
      fetchPasswords();
    } catch (err) { setError(err.message || "Failed to save"); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await apiService.post("/vault/categories", newCategory);
      setSuccess("Category created!");
      setNewCategory({ name: "", description: "", icon: "folder" });
      fetchCategories();
    } catch (err) { setError(err.message || "Failed to create category"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this password?")) return;
    try {
      await apiService.delete(`/vault/entries/${id}`);
      setSuccess("Deleted!"); fetchPasswords();
    } catch (err) { setError("Failed to delete"); }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await apiService.delete(`/vault/categories/${id}`);
      fetchCategories();
    } catch (err) { setError("Failed to delete category"); }
  };

  const handleEdit = (pwd) => {
    setEditingPassword(pwd);
    setFormData({
      title: pwd.title || "", username: pwd.username || "", password: pwd.password || "",
      url: pwd.url || "", notes: pwd.notes || "", categoryId: pwd.category?.id || "",
    });
    setActivePanel('edit');
  };

  const resetForm = () => {
    setFormData({ title: "", username: "", password: "", url: "", notes: "", categoryId: "" });
    setEditingPassword(null);
    setActivePanel(null);
    setGeneratedPassword("");
  };

  const toggleVisibility = (id) => setVisiblePasswords(p => ({ ...p, [id]: !p[id] }));
  
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied!`);
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleLogout = () => { logout(); router.push("/"); };

  const filteredPasswords = selectedCategory === "all" ? passwords
    : selectedCategory === "uncategorized" ? passwords.filter(p => !p.category)
    : passwords.filter(p => p.category?.id === selectedCategory);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">PassVault</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{user.username}</span>
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-500">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Messages */}
          {(error || success) && (
            <div className={`mb-6 p-4 rounded-lg flex justify-between items-center ${error ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
              <span>{error || success}</span>
              <button onClick={() => { setError(""); setSuccess(""); }} className="hover:opacity-70">✕</button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => { resetForm(); setActivePanel(activePanel === 'add' ? null : 'add'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activePanel === 'add' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
            >
              {activePanel === 'add' ? 'Cancel' : '+ New Password'}
            </button>
            <button
              onClick={() => { setActivePanel(activePanel === 'generator' ? null : 'generator'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activePanel === 'generator' ? 'bg-zinc-200 dark:bg-zinc-700 border-transparent' : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              Generator
            </button>
            <button
              onClick={() => { setActivePanel(activePanel === 'category' ? null : 'category'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activePanel === 'category' ? 'bg-zinc-200 dark:bg-zinc-700 border-transparent' : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              Categories
            </button>
          </div>

          {/* Generator Panel */}
          {activePanel === 'generator' && (
            <div className="mb-8 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Password Generator</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Length: <span className="font-semibold text-zinc-900 dark:text-zinc-50">{generatorOptions.length}</span>
                  </label>
                  <input
                    type="range" min="8" max="64" value={generatorOptions.length}
                    onChange={(e) => setGeneratorOptions({ ...generatorOptions, length: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input type="checkbox" checked={generatorOptions.includeNumbers}
                      onChange={(e) => setGeneratorOptions({ ...generatorOptions, includeNumbers: e.target.checked })}
                      className="w-4 h-4 rounded accent-blue-600" />
                    Numbers
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input type="checkbox" checked={generatorOptions.includeSymbols}
                      onChange={(e) => setGeneratorOptions({ ...generatorOptions, includeSymbols: e.target.checked })}
                      className="w-4 h-4 rounded accent-blue-600" />
                    Symbols
                  </label>
                </div>
                <button onClick={generatePassword} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium">
                  Generate
                </button>
                {generatedPassword && (
                  <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <div className="flex gap-2">
                      <input type="text" value={generatedPassword} onChange={(e) => setGeneratedPassword(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono text-sm text-zinc-900 dark:text-zinc-50" />
                      <button onClick={() => copyToClipboard(generatedPassword, "Password")}
                        className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm">
                        Copy
                      </button>
                    </div>
                    <button onClick={useGeneratedPassword}
                      className="mt-3 w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium">
                      Use for new entry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Panel */}
          {activePanel === 'category' && (
            <div className="mb-8 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Categories</h2>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                      <span className="text-sm">{getCategoryIcon(cat.icon)}</span>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-zinc-400 hover:text-red-500 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <select value={newCategory.icon} onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm">
                  <option value="folder">📁</option>
                  <option value="social">👥</option>
                  <option value="work">💼</option>
                  <option value="bank">🏦</option>
                  <option value="shopping">🛒</option>
                  <option value="email">📧</option>
                  <option value="gaming">🎮</option>
                  <option value="other">📌</option>
                </select>
                <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="New category name" required
                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400" />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium">
                  Add
                </button>
              </form>
            </div>
          )}

          {/* Add/Edit Form */}
          {(activePanel === 'add' || activePanel === 'edit') && (
            <div className="mb-8 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {editingPassword ? 'Edit Password' : 'New Password'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required placeholder="e.g., Gmail"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Category</label>
                    <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50">
                      <option value="">None</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Username/Email *</label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required placeholder="user@example.com"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Password *</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required placeholder="Enter or generate password"
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-mono text-zinc-900 dark:text-zinc-50 placeholder-zinc-400" />
                    <button type="button" onClick={handleQuickGenerate}
                      className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium whitespace-nowrap">
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">URL</label>
                  <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="2" placeholder="Additional notes..."
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={resetForm}
                    className="flex-1 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium">
                    {editingPassword ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === "all" ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
              📋 All ({passwords.length})
            </button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                {getCategoryIcon(cat.icon)} {cat.name} ({passwords.filter(p => p.category?.id === cat.id).length})
              </button>
            ))}
            {passwords.some(p => !p.category) && (
              <button onClick={() => setSelectedCategory("uncategorized")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === "uncategorized" ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                📌 Uncategorized ({passwords.filter(p => !p.category).length})
              </button>
            )}
          </div>

          {/* Password List */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Passwords <span className="text-sm font-normal text-zinc-500">({filteredPasswords.length})</span>
              </h2>
            </div>
            
            {filteredPasswords.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">🔐</div>
                <p className="text-zinc-500 dark:text-zinc-400">No passwords yet</p>
                <button onClick={() => setActivePanel('add')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium">
                  Add your first password
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredPasswords.map((pwd) => (
                  <div key={pwd.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-50 truncate">{pwd.title}</h3>
                          {pwd.category && (
                            <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                              {getCategoryIcon(pwd.category.icon)} {pwd.category.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{pwd.username}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-sm font-mono text-zinc-700 dark:text-zinc-300">
                            {visiblePasswords[pwd.id] ? pwd.password : '••••••••'}
                          </code>
                          <button onClick={() => toggleVisibility(pwd.id)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-sm">
                            {visiblePasswords[pwd.id] ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {pwd.url && (
                          <a href={pwd.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-500 mt-1 block truncate">
                            {pwd.url}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 sm:flex-col">
                        <button onClick={() => copyToClipboard(pwd.password, "Password")}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-500">
                          Copy
                        </button>
                        <button onClick={() => handleEdit(pwd)}
                          className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(pwd.id)}
                          className="px-3 py-1.5 text-red-600 hover:text-red-500 rounded text-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            © 2025 PassVault. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function getCategoryIcon(icon) {
  const icons = {
    folder: '📁', social: '👥', work: '💼', bank: '🏦',
    shopping: '🛒', email: '📧', gaming: '🎮', other: '📌',
  };
  return icons[icon] || '📁';
}

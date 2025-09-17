import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';
import { 
  Plus, User, Wrench, CreditCard, LogOut, Phone, Calendar, DollarSign, 
  Search, X, MessageCircle, ClipboardList, Trash2, Edit3, Settings, 
  TrendingUp, Users, Receipt, Clock, CheckCircle, AlertCircle, Copy,
  Sparkles, Zap, ArrowRight, BarChart3, PieChart, Activity, Star,
  ChevronRight, ChevronLeft, Filter, Download, RefreshCw
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      toast({
        title: "🎉 Berhasil masuk!",
        description: `Selamat datang kembali, ${userData.username}!`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "❌ Gagal masuk",
        description: error.response?.data?.detail || "Username atau password salah",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { access_token, user: newUser } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(newUser);
      
      toast({
        title: "🎊 Berhasil mendaftar!",
        description: `Selamat datang di sistem bengkel, ${newUser.username}!`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "❌ Gagal mendaftar",
        description: error.response?.data?.detail || "Terjadi kesalahan saat mendaftar",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast({
      title: "👋 Sampai jumpa!",
      description: "Anda telah berhasil keluar dari sistem",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Enhanced Login Component
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    workshop_name: '',
    workshop_id: '',
    role: 'owner'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (isLogin) {
      await login(formData.username, formData.password);
    } else {
      await register(formData);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Wrench className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {isLogin ? 'Masuk ke Sistem' : 'Daftar Bengkel Baru'}
          </CardTitle>
          <CardDescription className="text-base text-slate-600">
            {isLogin ? 'Kelola bengkel Anda dengan mudah' : 'Mulai digitalisasi bengkel Anda'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-slate-700">Saya adalah</Label>
                  <select
                    id="role"
                    className="w-full h-11 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="owner">🏢 Pemilik Bengkel (Buat bengkel baru)</option>
                    <option value="employee">👥 Karyawan Bengkel (Gabung ke bengkel)</option>
                  </select>
                </div>

                {formData.role === 'employee' && (
                  <div className="space-y-2">
                    <Label htmlFor="workshop_id" className="text-sm font-medium text-slate-700">ID Bengkel</Label>
                    <Input
                      id="workshop_id"
                      type="text"
                      placeholder="Masukkan 18 karakter ID bengkel"
                      value={formData.workshop_id}
                      onChange={(e) => setFormData({ ...formData, workshop_id: e.target.value.toUpperCase() })}
                      maxLength={18}
                      className="h-11 font-mono"
                      required
                    />
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                      💡 Minta ID bengkel dari pemilik bengkel Anda
                    </p>
                  </div>
                )}

                {formData.role === 'owner' && (
                  <div className="space-y-2">
                    <Label htmlFor="workshop_name" className="text-sm font-medium text-slate-700">Nama Bengkel</Label>
                    <Input
                      id="workshop_name"
                      type="text"
                      placeholder="Contoh: Bengkel Motor Jaya"
                      value={formData.workshop_name}
                      onChange={(e) => setFormData({ ...formData, workshop_name: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email (Opsional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Masuk...' : 'Mendaftar...'}
                </div>
              ) : (
                <div className="flex items-center">
                  {isLogin ? 'Masuk' : 'Daftar'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full h-11 text-slate-600 hover:text-slate-800"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Dashboard Component
const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSummary, setCustomerSummary] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showNewServiceSession, setShowNewServiceSession] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWhatsAppOptions, setShowWhatsAppOptions] = useState(false);
  const [selectedServiceSession, setSelectedServiceSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [newService, setNewService] = useState({ description: '', price: 0, service_session_id: '' });
  const [serviceItems, setServiceItems] = useState([{ description: '', price: 0 }]);
  const [editingService, setEditingService] = useState(null);
  const [showEditService, setShowEditService] = useState(false);
  const [showDeleteService, setShowDeleteService] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [newPayment, setNewPayment] = useState({ amount: 0, description: '', service_session_id: '' });
  const [newServiceSession, setNewServiceSession] = useState({ session_name: '' });

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customerData =>
        customerData.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerData.customer.phone.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    }
  }, [customers, searchTerm]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/dashboard`);
      setCustomers(response.data.customers);
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal mengambil data dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const fetchCustomerSummary = async (customerId) => {
    try {
      const response = await axios.get(`${API}/customers/${customerId}/summary`);
      setCustomerSummary(response.data);
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal mengambil detail pelanggan",
        variant: "destructive",
      });
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/customers`, newCustomer);
      setNewCustomer({ name: '', phone: '' });
      setShowAddCustomer(false);
      fetchDashboard();
      toast({
        title: "✅ Berhasil!",
        description: "Pelanggan baru berhasil ditambahkan",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal menambahkan pelanggan",
        variant: "destructive",
      });
    }
  };

  const addServiceItem = () => {
    setServiceItems([...serviceItems, { description: '', price: 0 }]);
  };

  const removeServiceItem = (index) => {
    if (serviceItems.length > 1) {
      setServiceItems(serviceItems.filter((_, i) => i !== index));
    }
  };

  const updateServiceItem = (index, field, value) => {
    const updatedItems = serviceItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setServiceItems(updatedItems);
  };

  const handleEditService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      await axios.put(`${API}/services/${editingService.id}`, {
        description: editingService.description,
        price: editingService.price
      });
      setEditingService(null);
      setShowEditService(false);
      fetchCustomerSummary(selectedCustomer.customer.id);
      toast({
        title: "✅ Berhasil!",
        description: "Item servis berhasil diperbarui",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal memperbarui item servis",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      await axios.delete(`${API}/services/${serviceToDelete.id}`);
      setServiceToDelete(null);
      setShowDeleteService(false);
      fetchCustomerSummary(selectedCustomer.customer.id);
      toast({
        title: "✅ Berhasil!",
        description: "Item servis berhasil dihapus",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal menghapus item servis",
        variant: "destructive",
      });
    }
  };

  const openEditService = (service) => {
    setEditingService({ ...service });
    setShowEditService(true);
  };

  const openDeleteService = (service) => {
    setServiceToDelete(service);
    setShowDeleteService(true);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.service_session_id) {
      toast({
        title: "❌ Error",
        description: "Pilih servis session terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Validasi semua item
    const validItems = serviceItems.filter(item =>
      item.description.trim() !== '' && item.price > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "❌ Error",
        description: "Harap isi minimal satu item servis",
        variant: "destructive",
      });
      return;
    }

    try {
      // Submit semua items
      const promises = validItems.map(item =>
        axios.post(`${API}/services`, {
          ...item,
          service_session_id: newService.service_session_id,
          customer_id: selectedCustomer.customer.id
        })
      );

      await Promise.all(promises);
      setNewService({ description: '', price: 0, service_session_id: '' });
      setServiceItems([{ description: '', price: 0 }]);
      setShowAddService(false);
      fetchDashboard();
      fetchCustomerSummary(selectedCustomer.customer.id);
      toast({
        title: "✅ Berhasil!",
        description: `${validItems.length} item servis berhasil ditambahkan`,
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal menambahkan service",
        variant: "destructive",
      });
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/payments`, {
        ...newPayment,
        customer_id: selectedCustomer.customer.id
      });
      setNewPayment({ amount: 0, description: '', service_session_id: '' });
      setShowAddPayment(false);
      fetchDashboard();
      fetchCustomerSummary(selectedCustomer.customer.id);
      toast({
        title: "✅ Berhasil!",
        description: "Pembayaran berhasil dicatat",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal mencatat pembayaran",
        variant: "destructive",
      });
    }
  };

  const handleCreateServiceSession = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/service-sessions`, {
        ...newServiceSession,
        customer_id: selectedCustomer.customer.id
      });
      setNewServiceSession({ session_name: '' });
      setShowNewServiceSession(false);
      fetchCustomerSummary(selectedCustomer.customer.id);
      toast({
        title: "✅ Berhasil!",
        description: "Sesi servis baru berhasil dibuat",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal membuat sesi servis baru",
        variant: "destructive",
      });
    }
  };

  const handleShareWhatsApp = async (sessionId = null) => {
    try {
      const url = sessionId
        ? `${API}/customers/${selectedCustomer.customer.id}/whatsapp-message?session_id=${sessionId}`
        : `${API}/customers/${selectedCustomer.customer.id}/whatsapp-message`;
      
      const response = await axios.get(url);
      window.open(response.data.whatsapp_url, '_blank');
      
      const sessionInfo = sessionId ? "sesi tertentu" : "semua sesi";
      toast({
        title: "📱 WhatsApp dibuka!",
        description: `Detail servis ${sessionInfo} siap dikirim ke pelanggan`,
      });
      setShowWhatsAppOptions(false);
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal membuat pesan WhatsApp",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      await axios.delete(`${API}/customers/${selectedCustomer.customer.id}`);
      setShowDeleteConfirm(false);
      setSelectedCustomer(null);
      setCustomerSummary(null);
      fetchDashboard();
      toast({
        title: "✅ Berhasil!",
        description: "Data pelanggan dan semua riwayat servis berhasil dihapus",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal menghapus data pelanggan",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyWorkshopId = () => {
    navigator.clipboard.writeText(user.workshop_id);
    toast({
      title: "📋 ID Bengkel disalin!",
      description: "ID bengkel berhasil disalin ke clipboard",
    });
  };

  // Calculate dashboard stats
  const dashboardStats = {
    totalCustomers: customers.length,
    totalDebt: customers.reduce((sum, c) => sum + c.total_debt, 0),
    paidCustomers: customers.filter(c => c.total_debt === 0).length,
    unpaidCustomers: customers.filter(c => c.total_debt > 0).length
  };

  if (selectedCustomer && customerSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerSummary(null);
                }}
                className="hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-600" />
                  {customerSummary.customer.name}
                </h1>
                <p className="text-sm text-slate-600 flex items-center mt-1">
                  <Phone className="w-4 h-4 mr-1" />
                  {customerSummary.customer.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Dialog open={showWhatsAppOptions} onOpenChange={setShowWhatsAppOptions}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Bagikan via WhatsApp
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
                      Pilih Data yang Akan Dikirim
                    </DialogTitle>
                    <DialogDescription>
                      Pilih apakah ingin mengirim semua riwayat servis atau hanya sesi tertentu saja
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <Button
                      onClick={() => handleShareWhatsApp()}
                      className="w-full bg-green-600 hover:bg-green-700 text-white justify-start"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Kirim Semua Sesi ({customerSummary.service_sessions.length} sesi)
                    </Button>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm text-slate-700 mb-3">Atau pilih sesi tertentu:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {customerSummary.service_sessions.map((sessionSummary) => (
                          <Button
                            key={sessionSummary.session.id}
                            onClick={() => handleShareWhatsApp(sessionSummary.session.id)}
                            variant="outline"
                            className="w-full justify-start text-left hover:bg-green-50 hover:border-green-200"
                          >
                            <ClipboardList className="w-4 h-4 mr-2 text-green-600" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{sessionSummary.session.session_name}</div>
                              <div className="text-xs text-slate-500">
                                {formatDate(sessionSummary.session.session_date)} • 
                                {sessionSummary.services.length} item • 
                                {formatCurrency(sessionSummary.services.reduce((sum, s) => sum + s.price, 0))}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="shadow-lg hover:shadow-xl transition-all duration-200">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center text-red-600">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Konfirmasi Hapus Data
                    </DialogTitle>
                    <DialogDescription className="space-y-3">
                      <p>Anda yakin ingin menghapus semua data pelanggan <strong>{customerSummary.customer.name}</strong>?</p>
                      
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-red-800 font-medium text-sm mb-2">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
                        <p className="text-sm text-red-700">Data yang akan dihapus:</p>
                        <ul className="list-disc list-inside mt-1 text-sm text-red-700 space-y-1">
                          <li>Semua riwayat servis ({customerSummary.service_sessions.length} sesi)</li>
                          <li>Semua data pembayaran</li>
                          <li>Informasi kontak pelanggan</li>
                        </ul>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteCustomer}
                      className="flex-1"
                    >
                      Ya, Hapus Data
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Badge 
                variant={customerSummary.remaining_debt > 0 ? "destructive" : "default"}
                className="text-sm px-3 py-1 font-semibold"
              >
                {customerSummary.remaining_debt > 0 ? 
                  `💳 Sisa Hutang: ${formatCurrency(customerSummary.remaining_debt)}` : 
                  '✅ Lunas'
                }
              </Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Service Sessions */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-blue-600" />
                    Riwayat Servis
                  </CardTitle>
                  
                  <div className="flex space-x-2">
                    <Dialog open={showNewServiceSession} onOpenChange={setShowNewServiceSession}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                          <Plus className="w-4 h-4 mr-2" />
                          Sesi Baru
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Buat Sesi Servis Baru</DialogTitle>
                          <DialogDescription>
                            Buat sesi servis baru untuk memisahkan transaksi berdasarkan waktu atau jenis servis
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateServiceSession} className="space-y-4">
                          <div>
                            <Label htmlFor="session_name">Nama Sesi Servis</Label>
                            <Input
                              id="session_name"
                              placeholder="Contoh: Servis Berkala Januari 2025"
                              value={newServiceSession.session_name}
                              onChange={(e) => setNewServiceSession({ ...newServiceSession, session_name: e.target.value })}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Buat Sesi Baru
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showAddService} onOpenChange={setShowAddService}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Tambah Item Servis</DialogTitle>
                          <DialogDescription>
                            Tambahkan beberapa item servis atau sparepart sekaligus
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleAddService} className="space-y-4">
                          <div>
                            <Label htmlFor="service_session_select">Pilih Sesi Servis</Label>
                            <select
                              id="service_session_select"
                              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              value={newService.service_session_id}
                              onChange={(e) => setNewService({ ...newService, service_session_id: e.target.value })}
                              required
                            >
                              <option value="">Pilih Sesi Servis</option>
                              {customerSummary.service_sessions.map((sessionSummary) => (
                                <option key={sessionSummary.session.id} value={sessionSummary.session.id}>
                                  {sessionSummary.session.session_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Daftar Item Servis/Sparepart</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addServiceItem}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Tambah Item
                              </Button>
                            </div>

                            {serviceItems.map((item, index) => (
                              <div key={index} className="flex gap-2 items-start p-4 border rounded-lg bg-slate-50">
                                <div className="flex-1 space-y-2">
                                  <Input
                                    placeholder="Contoh: Oli mesin, Busi, Ganti rem, dll"
                                    value={item.description}
                                    onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                                    className="bg-white"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Harga"
                                    value={item.price}
                                    onChange={(e) => updateServiceItem(index, 'price', parseFloat(e.target.value) || 0)}
                                    className="bg-white"
                                  />
                                </div>
                                
                                {serviceItems.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeServiceItem(index)}
                                    className="mt-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t">
                            <div className="flex space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setShowAddService(false);
                                  setServiceItems([{ description: '', price: 0 }]);
                                  setNewService({ description: '', price: 0, service_session_id: '' });
                                }}
                              >
                                Batal
                              </Button>
                              <Button type="submit" className="flex-1">
                                Simpan Semua Item
                              </Button>
                            </div>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {customerSummary.service_sessions.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList className="mx-auto w-12 h-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-600 mb-2">Belum ada riwayat servis</h3>
                      <p className="text-slate-500 mb-4">Mulai dengan membuat sesi servis pertama</p>
                      <Button onClick={() => setShowNewServiceSession(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Sesi Servis
                      </Button>
                    </div>
                  ) : (
                    customerSummary.service_sessions.map((sessionSummary) => (
                      <div key={sessionSummary.session.id} className="border rounded-xl p-6 bg-gradient-to-r from-white to-slate-50 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-lg text-slate-800 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                            {sessionSummary.session.session_name}
                          </h3>
                          
                          <Badge 
                            variant={sessionSummary.remaining_debt > 0 ? "destructive" : "default"}
                            className="text-sm px-3 py-1"
                          >
                            {sessionSummary.remaining_debt > 0 ? 
                              `Sisa: ${formatCurrency(sessionSummary.remaining_debt)}` : 
                              '✅ Lunas'
                            }
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-4 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDate(sessionSummary.session.session_date)}
                        </p>

                        {/* Services */}
                        {sessionSummary.services.length > 0 && (
                          <div className="space-y-3 mb-4">
                            <h4 className="font-semibold text-slate-700 flex items-center">
                              <Wrench className="w-4 h-4 mr-2" />
                              Item Servis:
                            </h4>
                            
                            {sessionSummary.services.map((service) => (
                              <div key={service.id} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-slate-50 transition-colors">
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{service.description}</span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <span className="font-semibold text-sm text-green-600">
                                    {formatCurrency(service.price)}
                                  </span>
                                  
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => openEditService(service)}
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => openDeleteService(service)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Payments */}
                        {sessionSummary.payments.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-slate-700 flex items-center">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pembayaran:
                            </h4>
                            
                            {sessionSummary.payments.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                <div>
                                  <span className="text-sm font-medium text-green-800">
                                    {formatCurrency(payment.amount)}
                                  </span>
                                  {payment.description && (
                                    <span className="text-xs text-green-600 ml-2">
                                      ({payment.description})
                                    </span>
                                  )}
                                </div>
                                
                                <span className="text-xs text-green-600 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(payment.payment_date)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary & Payments */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Ringkasan Keseluruhan
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <DollarSign className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <div className="text-lg font-bold text-blue-900">
                        {formatCurrency(customerSummary.total_services_amount)}
                      </div>
                      <div className="text-xs text-blue-600">Total Servis</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <CreditCard className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <div className="text-lg font-bold text-green-900">
                        {formatCurrency(customerSummary.total_payments_amount)}
                      </div>
                      <div className="text-xs text-green-600">Total Bayar</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className={`text-center p-4 rounded-lg ${
                      customerSummary.remaining_debt > 0 ? 'bg-red-50' : 'bg-green-50'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        customerSummary.remaining_debt > 0 ? 'text-red-900' : 'text-green-900'
                      }`}>
                        {formatCurrency(customerSummary.remaining_debt)}
                      </div>
                      <div className={`text-sm ${
                        customerSummary.remaining_debt > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {customerSummary.remaining_debt > 0 ? 'Sisa Hutang' : 'Lunas'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    Tambah Pembayaran
                  </CardTitle>
                  
                  <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        disabled={customerSummary.remaining_debt <= 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Bayar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Catat Pembayaran</DialogTitle>
                        <DialogDescription>
                          Total sisa hutang: <strong>{formatCurrency(customerSummary.remaining_debt)}</strong>
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleAddPayment} className="space-y-4">
                        <div>
                          <Label htmlFor="payment_session_select">Untuk Sesi Servis (Opsional)</Label>
                          <select
                            id="payment_session_select"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                            value={newPayment.service_session_id}
                            onChange={(e) => setNewPayment({ ...newPayment, service_session_id: e.target.value })}
                          >
                            <option value="">Pembayaran Umum</option>
                            {customerSummary.service_sessions.filter(s => s.remaining_debt > 0).map((sessionSummary) => (
                              <option key={sessionSummary.session.id} value={sessionSummary.session.id}>
                                {sessionSummary.session.session_name} - {formatCurrency(sessionSummary.remaining_debt)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor="amount">Jumlah Bayar</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0"
                            value={newPayment.amount}
                            onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="payment_description">Keterangan (Opsional)</Label>
                          <Input
                            id="payment_description"
                            placeholder="Catatan pembayaran"
                            value={newPayment.description}
                            onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                          />
                        </div>
                        
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Catat Pembayaran
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* Edit Service Dialog */}
        <Dialog open={showEditService} onOpenChange={setShowEditService}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item Servis</DialogTitle>
              <DialogDescription>
                Ubah deskripsi dan harga item servis
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditService} className="space-y-4">
              <div>
                <Label htmlFor="edit_description">Deskripsi</Label>
                <Input
                  id="edit_description"
                  value={editingService?.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit_price">Harga</Label>
                <Input
                  id="edit_price"
                  type="number"
                  value={editingService?.price || 0}
                  onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEditService(false);
                    setEditingService(null);
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Service Confirmation Dialog */}
        <Dialog open={showDeleteService} onOpenChange={setShowDeleteService}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                Konfirmasi Hapus Item
              </DialogTitle>
              <DialogDescription className="space-y-3">
                <p>Anda yakin ingin menghapus item servis ini?</p>
                
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-semibold">"{serviceToDelete?.description}"</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(serviceToDelete?.price || 0)}</p>
                </div>
                
                <p className="text-red-600 font-medium text-sm">
                  ⚠️ Tindakan ini tidak dapat dibatalkan!
                </p>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteService(false);
                  setServiceToDelete(null);
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteService}
                className="flex-1"
              >
                Ya, Hapus Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wrench className="w-7 h-7 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                Dashboard Bengkel
                <Sparkles className="w-5 h-5 ml-2 text-yellow-500" />
              </h1>
              <p className="text-sm text-slate-600">
                Selamat datang, <span className="font-semibold">{user?.username}</span> 
                {user?.workshop_name && ` - ${user.workshop_name}`}
              </p>
              
              {user?.role === 'owner' && user?.workshop_id && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-slate-500">ID Bengkel:</span>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono cursor-pointer hover:bg-slate-200 transition-colors">
                    {user.workshop_id}
                  </code>
                  <button
                    onClick={copyWorkshopId}
                    className="text-xs text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                    title="Copy ID Bengkel"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Pelanggan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
                  <DialogDescription>
                    Tambahkan pelanggan baru ke sistem bengkel
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Pelanggan</Label>
                    <Input
                      id="name"
                      placeholder="Masukkan nama lengkap"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">No HP/WhatsApp</Label>
                    <Input
                      id="phone"
                      placeholder="Contoh: 08123456789"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Pelanggan
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" onClick={logout} className="hover:bg-red-50 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Pelanggan</p>
                <p className="text-2xl font-bold text-slate-800">{dashboardStats.totalCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Hutang</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(dashboardStats.totalDebt)}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pelanggan Lunas</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats.paidCustomers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ada Hutang</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardStats.unpaidCustomers}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-md mx-auto lg:max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari nama pelanggan atau nomor HP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-12 py-3 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-base"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {searchTerm && (
              <p className="text-sm text-slate-600 mt-2 text-center">
                Menampilkan <span className="font-semibold">{filteredCustomers.length}</span> dari <span className="font-semibold">{customers.length}</span> pelanggan
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="mx-auto w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600">Memuat data pelanggan...</p>
          </div>
        ) : (
          <>
            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomers.map((customerData) => (
                <Card
                  key={customerData.customer.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 group"
                  onClick={() => {
                    setSelectedCustomer(customerData);
                    fetchCustomerSummary(customerData.customer.id);
                  }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        {customerData.customer.name}
                      </CardTitle>
                      
                      <Badge 
                        variant={customerData.total_debt > 0 ? "destructive" : "default"}
                        className="shadow-sm"
                      >
                        {customerData.total_debt > 0 ? "💳 Ada Hutang" : "✅ Lunas"}
                      </Badge>
                    </div>
                    
                    <CardDescription className="flex items-center text-base">
                      <Phone className="w-4 h-4 mr-2" />
                      {customerData.customer.phone}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                        <div className={`text-lg font-bold ${customerData.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(customerData.total_debt)}
                        </div>
                        <div className="text-xs text-slate-600">Total Hutang</div>
                      </div>
                      
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {customerData.total_service_sessions}
                        </div>
                        <div className="text-xs text-slate-600">Sesi Servis</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between text-sm text-slate-600">
                      <span className="flex items-center">
                        <Wrench className="w-4 h-4 mr-1" />
                        {customerData.total_services} servis
                      </span>
                      <span className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-1" />
                        {customerData.total_payments} bayar
                      </span>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-end text-blue-600 group-hover:text-blue-700">
                      <span className="text-sm font-medium">Lihat Detail</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty States */}
            {filteredCustomers.length === 0 && customers.length > 0 && searchTerm && (
              <div className="text-center py-16">
                <Search className="mx-auto w-16 h-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Tidak ada hasil pencarian</h3>
                <p className="text-slate-500 mb-6">
                  Tidak ditemukan pelanggan dengan nama atau nomor "{searchTerm}"
                </p>
                <Button variant="outline" onClick={clearSearch} className="hover:bg-blue-50">
                  <X className="w-4 h-4 mr-2" />
                  Hapus Pencarian
                </Button>
              </div>
            )}

            {customers.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-700 mb-2">Selamat datang di sistem bengkel!</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Belum ada pelanggan yang terdaftar. Mulai dengan menambahkan pelanggan pertama Anda untuk memulai pencatatan servis.
                </p>
                
                <Button 
                  onClick={() => setShowAddCustomer(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Pelanggan Pertama
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Main App Component with Loading Enhancement
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Wrench className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-lg font-semibold text-slate-700">Memuat sistem bengkel...</p>
            </div>
            <p className="text-sm text-slate-500">Harap tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={user ? <Dashboard /> : <Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithAuth;
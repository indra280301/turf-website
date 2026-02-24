import { useState, useEffect } from "react";
import {
    Users, CalendarCheck, IndianRupee, Settings,
    Image as ImageIcon, Ticket, BarChart3, TrendingUp, Plus, Trash2, Shield, ShieldOff, UserPlus, X
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format } from "date-fns";
import DatePicker from "react-datepicker";

const API = import.meta.env.VITE_API_URL || "http://localhost:5005/api";
const BASE_URL = API.replace('/api', '');
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const format12H = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(':');
    let hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    return `${hr.toString().padStart(2, '0')}:${m} ${ampm}`;
};

export default function AdminPanelPage() {
    const [activeTab, setActiveTab] = useState("dashboard");

    const sideLinks = [
        { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
        { id: "bookings", label: "Bookings", icon: <CalendarCheck className="w-5 h-5" /> },
        { id: "pricing", label: "Custom Pricing", icon: <IndianRupee className="w-5 h-5" /> },
        { id: "coupons", label: "Coupons", icon: <Ticket className="w-5 h-5" /> },
        { id: "gallery", label: "Gallery", icon: <ImageIcon className="w-5 h-5" /> },
        { id: "users", label: "Users & Staff", icon: <Users className="w-5 h-5" /> },
        { id: "logs", label: "Activity Logs", icon: <Shield className="w-5 h-5" /> },
        { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
    ];

    // =========== DASHBOARD STATE ===========
    const [dashData, setDashData] = useState<any>(null);
    const [refundModal, setRefundModal] = useState<{ isOpen: boolean, isCancel: boolean, bookingId: number | null, passwordInput: string }>({ isOpen: false, isCancel: false, bookingId: null, passwordInput: '' });
    const [deleteCouponModal, setDeleteCouponModal] = useState<{ isOpen: boolean, couponId: number | null }>({ isOpen: false, couponId: null });

    // =========== BOOKINGS STATE ===========
    const [bookings, setBookings] = useState<any[]>([]);
    const [bookingFilter, setBookingFilter] = useState<"all" | "confirmed" | "refunded">("all");
    const [bookingDateFrom, setBookingDateFrom] = useState("");
    const [bookingDateTo, setBookingDateTo] = useState("");
    const [bookingSearch, setBookingSearch] = useState("");
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualBooking, setManualBooking] = useState({ date: "", startTime: "06:00", endTime: "07:00", sport: "FOOTBALL", amount: 1500, guestName: "", guestPhone: "", paymentMode: "COD" });

    // =========== PRICING STATE ===========
    const [overrideDate, setOverrideDate] = useState("");
    const [overrideSlots, setOverrideSlots] = useState<{ slot: string; price: number; isBlocked: boolean }[]>([]);
    const [bookedOverrideSlots, setBookedOverrideSlots] = useState<{ start: string; end: string }[]>([]);
    const [slotToToggle, setSlotToToggle] = useState<{ slot: string; price: number; currentBlocked: boolean, isBooked: boolean } | null>(null);
    const [blockLogs, setBlockLogs] = useState<any[]>([]);
    const [newCustomSlot, setNewCustomSlot] = useState({ startTime: "05:00", endTime: "06:00", price: 1500 });

    // =========== GALLERY STATE ===========
    const [galleryCategories, setGalleryCategories] = useState<any[]>([]);
    const [newImage, setNewImage] = useState({ categoryName: "Football Matches", file: null as File | null });
    const [newCategoryName, setNewCategoryName] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

    // =========== COUPONS STATE ===========
    const [coupons, setCoupons] = useState<any[]>([]);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [newCoupon, setNewCoupon] = useState<{ code: string, type: string, value: number, expiryDate: string, maxUsage: string, maxDiscount: string, validDate: string, validSlots: string[] }>({ code: "", type: "FLAT", value: 100, expiryDate: "", maxUsage: "", maxDiscount: "", validDate: "", validSlots: [] });

    // =========== USERS STATE ===========
    const [users, setUsers] = useState<any[]>([]);
    const [showAddWatchman, setShowAddWatchman] = useState(false);
    const [newWatchman, setNewWatchman] = useState({ name: "", phone: "", email: "", password: "" });

    // =========== SETTINGS STATE ===========
    const [settings, setSettings] = useState({
        contactNumber: "+91 9876543210",
        address: "Dhawal Plaza, Khend, Chiplun, Maharashtra 415605",
        facebookUrl: "",
        instagramUrl: ""
    });

    useEffect(() => {
        if (activeTab === "dashboard") fetchDashboard();
        if (activeTab === "bookings") fetchBookings();
        if (activeTab === "gallery") fetchGalleryCategories();
        if (activeTab === "users") fetchUsers();
        if (activeTab === "settings") fetchSettings();
        if (activeTab === "coupons") fetchCoupons();
        if (activeTab === "logs") fetchLogs();
    }, [activeTab]);

    // =========== FETCH FUNCTIONS ===========
    const fetchDashboard = async () => {
        try {
            const res = await axios.get(`${API}/admin/dashboard`, authHeaders());
            setDashData(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchBookings = async () => {
        try {
            const params = new URLSearchParams();
            if (bookingDateFrom) params.append("fromDate", bookingDateFrom);
            if (bookingDateTo) params.append("toDate", bookingDateTo);
            if (bookingSearch) params.append("searchName", bookingSearch);

            const res = await axios.get(`${API}/admin/bookings?${params.toString()}`, authHeaders());
            setBookings(res.data);
        } catch (err) { console.error(err); }
    };

    // Refetch bookings when filters change (debounced for search)
    useEffect(() => {
        if (activeTab === "bookings") {
            const timer = setTimeout(() => {
                fetchBookings();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [bookingDateFrom, bookingDateTo, bookingSearch, activeTab]);

    const fetchGalleryCategories = async () => {
        try {
            const res = await axios.get(`${API}/admin/gallery/categories`, authHeaders());
            setGalleryCategories(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchCoupons = async () => {
        try {
            const res = await axios.get(`${API}/admin/coupons`, authHeaders());
            setCoupons(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API}/admin/users`, authHeaders());
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API}/admin/settings`, authHeaders());
            if (res.data) setSettings(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchOverrideSlots = async (date: string) => {
        try {
            const res = await axios.get(`${API}/admin/pricing?date=${date}`, authHeaders());
            if (res.data.override) setOverrideSlots(JSON.parse(res.data.override.value));
            else setOverrideSlots([]);
            if (res.data.bookings) setBookedOverrideSlots(res.data.bookings.map((b: any) => ({ start: b.startTime, end: b.endTime })));
            else setBookedOverrideSlots([]);
        } catch (err) { setOverrideSlots([]); setBookedOverrideSlots([]); }
    };

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${API}/admin/pricing/logs`, authHeaders());
            setBlockLogs(res.data);
        } catch (error) { console.error("Failed to fetch logs", error); }
    };

    // =========== ACTION HANDLERS ===========
    const handleSaveOverrides = async (applyForward: boolean) => {
        try {
            await axios.post(`${API}/admin/pricing`, { date: overrideDate, overrides: overrideSlots, applyForward }, authHeaders());
            toast.success(applyForward ? "Applied for today and next 30 days!" : "Saved for today only!");
        } catch (err) { toast.error("Failed to save overrides."); }
    };

    const handleSaveSettings = async () => {
        try {
            const loadingToast = toast.loading("Saving settings...");
            await axios.post(`${API}/admin/settings`, settings, authHeaders());
            toast.success("Settings saved successfully.", { id: loadingToast });
        } catch (err) { toast.error("Failed to save settings."); }
    };

    const handleAddImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newImage.file) return toast.error("Please select an image file");
        setUploadingImage(true);
        const loadingToast = toast.loading("Adding image...");
        try {
            const formData = new FormData();
            formData.append('categoryName', newImage.categoryName);
            formData.append('image', newImage.file);

            await axios.post(`${API}/admin/gallery`, formData, {
                headers: {
                    ...authHeaders().headers,
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Reset the file input visually as well (hack without ref)
            const fileInput = document.getElementById('galleryFile') as HTMLInputElement;
            if (fileInput) fileInput.value = "";
            setNewImage({ ...newImage, file: null });
            fetchGalleryCategories();
            toast.success("Image added!", { id: loadingToast });
        } catch (err) { toast.error("Failed to add image.", { id: loadingToast }); }
        finally { setUploadingImage(false); }
    };

    const handleDeleteImage = async (id: number) => {
        // We'll replace default confirm with toast, but for quick actions confirm is okay. Or we can just use prompt.
        // For now, let's keep native confirm but use toast for result.
        if (!window.confirm("Delete this image?")) return;
        try {
            await axios.delete(`${API}/admin/gallery/${id}`, authHeaders());
            fetchGalleryCategories();
            toast.success("Image deleted.");
        }
        catch (err) { toast.error("Failed to delete."); }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await axios.post(`${API}/admin/gallery/categories`, { name: newCategoryName }, authHeaders());
            setNewCategoryName("");
            fetchGalleryCategories();
            toast.success("Category created!");
        }
        catch (err) { toast.error("Failed to create category."); }
    };

    const handleCreateCoupon = async () => {
        try {
            await axios.post(`${API}/admin/coupons`, newCoupon, authHeaders());
            setShowCouponModal(false);
            setNewCoupon({ code: "", type: "FLAT", value: 100, expiryDate: "", maxUsage: "", maxDiscount: "", validDate: "", validSlots: [] });
            fetchCoupons();
            toast.success("Coupon created successfully!");
        } catch (err: any) { toast.error(err.response?.data?.message || "Failed to create coupon."); }
    };

    const handleDeleteCoupon = (id: number) => {
        setDeleteCouponModal({ isOpen: true, couponId: id });
    };

    const confirmDeleteCoupon = async () => {
        if (!deleteCouponModal.couponId) return;
        try {
            await axios.delete(`${API}/admin/coupons/${deleteCouponModal.couponId}`, authHeaders());
            fetchCoupons();
            setDeleteCouponModal({ isOpen: false, couponId: null });
            toast.success("Coupon permanently deleted.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete.");
        }
    };

    const handleToggleUser = async (id: number) => {
        try {
            const res = await axios.put(`${API}/admin/users/${id}/toggle-status`, {}, authHeaders());
            fetchUsers();
            toast.success(res.data.message);
        }
        catch (err) { toast.error("Failed to toggle status."); }
    };

    const handleCreateWatchman = async () => {
        try {
            await axios.post(`${API}/admin/watchman`, newWatchman, authHeaders());
            setShowAddWatchman(false);
            setNewWatchman({ name: "", phone: "", email: "", password: "" });
            fetchUsers();
            toast.success("Watchman created successfully!");
        } catch (err: any) { toast.error(err.response?.data?.message || "Failed to create watchman."); }
    };

    const handleManualBooking = async () => {
        if (!manualBooking.date || !manualBooking.guestName || !manualBooking.guestPhone) {
            return toast.error("Please fill all required fields");
        }
        if (!/^\d{10}$/.test(manualBooking.guestPhone)) {
            return toast.error("Please enter a valid 10-digit Indian phone number");
        }
        try {
            await axios.post(`${API}/admin/bookings/manual`, manualBooking, authHeaders());
            setShowManualModal(false);
            fetchBookings();
            toast.success("Manual booking created!");
        } catch (err: any) { toast.error(err.response?.data?.message || "Failed."); }
    };

    const handleCancelBooking = (id: number) => {
        setRefundModal({ isOpen: true, isCancel: true, bookingId: id, passwordInput: '' });
    };

    const handleRefundBooking = (id: number) => {
        setRefundModal({ isOpen: true, isCancel: false, bookingId: id, passwordInput: '' });
    };

    const executeSecureAction = async () => {
        if (!refundModal.bookingId || !refundModal.passwordInput) return;
        const endpoint = refundModal.isCancel ? 'cancel' : 'refund';

        try {
            await axios.put(`${API}/admin/bookings/${refundModal.bookingId}/${endpoint}`, { password: refundModal.passwordInput }, authHeaders());
            fetchBookings();
            setRefundModal({ isOpen: false, isCancel: false, bookingId: null, passwordInput: '' });
            toast.success(refundModal.isCancel ? "Booking safely cancelled." : "Booking refunded & money dispatched via Razorpay API.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to ${endpoint}.`);
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (bookingFilter === "confirmed") return b.status === "CONFIRMED" && !b.isRefunded;
        if (bookingFilter === "refunded") return b.isRefunded;
        return true;
    });

    const inputClass = "w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#bde33c] focus:ring-1 focus:ring-[#bde33c] outline-none transition-all";
    const labelClass = "text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5";

    return (
        <div className="flex min-h-screen bg-background text-foreground pt-20">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-secondary/20 p-6 flex flex-col pt-10 shrink-0 hidden md:flex">
                <div className="mb-10 px-2">
                    <h2 className="text-xl font-bold text-primary tracking-tight">Admin Portal</h2>
                </div>
                <nav className="space-y-2 flex-1">
                    {sideLinks.map(link => (
                        <button
                            key={link.id}
                            onClick={() => setActiveTab(link.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === link.id
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-foreground hover:bg-secondary hover:text-primary"
                                }`}
                        >
                            {link.icon} {link.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Mobile Tab Bar */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#111] border-t border-border z-50 flex overflow-x-auto">
                {sideLinks.map(link => (
                    <button key={link.id} onClick={() => setActiveTab(link.id)}
                        className={`flex-1 min-w-[70px] flex flex-col items-center py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === link.id ? "text-primary" : "text-muted-foreground"}`}>
                        {link.icon}
                        <span className="mt-1">{link.label.split(" ")[0]}</span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full pb-24 md:pb-12">

                {/* ===== DASHBOARD ===== */}
                {activeTab === "dashboard" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
                            <p className="text-muted-foreground">Welcome back, Admin. Here's what's happening.</p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <div className="bg-background border border-border p-5 rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-medium text-muted-foreground">Today's Collection</h3>
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><IndianRupee className="w-4 h-4" /></div>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold">₹{dashData?.todayRevenue?.toLocaleString() || 0}</p>
                            </div>
                            <div className="bg-background border border-border p-5 rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-medium text-muted-foreground">Active Bookings</h3>
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><CalendarCheck className="w-4 h-4" /></div>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold">{dashData?.activeBookings || 0}</p>
                            </div>
                            <div className="bg-background border border-border p-5 rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-medium text-muted-foreground">Total Users</h3>
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Users className="w-4 h-4" /></div>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold">{dashData?.totalUsers?.toLocaleString() || 0}</p>
                            </div>
                            <div className="bg-background border border-border p-5 rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-medium text-muted-foreground">Occupancy Rate</h3>
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><TrendingUp className="w-4 h-4" /></div>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold">{dashData?.occupancyRate || 0}%</p>
                                <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${dashData?.occupancyRate || 0}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Revenue Chart */}
                        {dashData?.last7Days && (
                            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-6">Last 7 Days Event Collection</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={dashData.last7Days}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#bde33c" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#bde33c" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                                        <YAxis tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                                        <Tooltip contentStyle={{ background: '#1a1b1a', border: '1px solid #333', borderRadius: 12 }} labelStyle={{ color: '#bde33c' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Collection']} />
                                        <Area type="monotone" dataKey="revenue" stroke="#bde33c" strokeWidth={2} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {dashData?.last7Days && (
                            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-6">Daily Bookings</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={dashData.last7Days}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                                        <YAxis tick={{ fill: '#888', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ background: '#1a1b1a', border: '1px solid #333', borderRadius: 12 }} />
                                        <Bar dataKey="bookings" fill="#bde33c" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== BOOKINGS ===== */}
                {activeTab === "bookings" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
                            <button onClick={() => setShowManualModal(true)} className="bg-primary text-[#111] font-black px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all">
                                <Plus className="w-5 h-5" /> Manual Booking
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 bg-[#111] p-4 rounded-xl border border-[#333]">

                            <div className="flex-1">
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Search Name / Phone</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Virgil"
                                    value={bookingSearch}
                                    onChange={e => setBookingSearch(e.target.value)}
                                    className="w-full bg-[#1a1b1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-[#bde33c] outline-none"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">From Date</label>
                                    <DatePicker
                                        selected={bookingDateFrom ? new Date(bookingDateFrom) : null}
                                        onChange={(date: Date | null) => setBookingDateFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                                        dateFormat="MM/dd/yyyy"
                                        className="w-full bg-[#1a1b1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-[#bde33c] outline-none text-white text-center font-bold tracking-widest"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">To Date</label>
                                    <DatePicker
                                        selected={bookingDateTo ? new Date(bookingDateTo) : null}
                                        onChange={(date: Date | null) => setBookingDateTo(date ? format(date, 'yyyy-MM-dd') : '')}
                                        dateFormat="MM/dd/yyyy"
                                        className="w-full bg-[#1a1b1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-[#bde33c] outline-none text-white text-center font-bold tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="flex items-end gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0">
                                {(["all", "confirmed", "refunded"] as const).map(f => (
                                    <button key={f} onClick={() => setBookingFilter(f)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${bookingFilter === f ? "bg-[#bde33c] text-[#111]" : "bg-[#1a1b1a] border border-[#333] text-gray-400 hover:text-white"}`}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[800px] border-collapse">
                                    <thead className="bg-[#111111]/80 backdrop-blur-md text-muted-foreground text-[10px] uppercase tracking-[0.2em] border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-5 font-bold">Date / Time</th>
                                            <th className="px-6 py-5 font-bold">Guest</th>
                                            <th className="px-6 py-5 font-bold">Sport</th>
                                            <th className="px-6 py-5 font-bold">Amount</th>
                                            <th className="px-6 py-5 font-bold">Mode</th>
                                            <th className="px-6 py-5 font-bold">Status</th>
                                            <th className="px-6 py-5 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {filteredBookings.map(b => (
                                            <tr key={b.id} className="hover:bg-white/[0.02] transition-all group">
                                                <td className="px-6 py-5">
                                                    <span className="font-bold text-white block mb-1">
                                                        {new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-medium tracking-widest">{format12H(b.startTime)} - {format12H(b.endTime)}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="font-bold text-white block mb-1">{b.guestName || b.user?.name || "—"}</span>
                                                    <span className="text-xs text-muted-foreground tracking-wider">{b.guestPhone || b.user?.phone || ""}</span>
                                                </td>
                                                <td className="px-6 py-5 font-bold text-muted-foreground tracking-widest text-xs uppercase">{b.sport}</td>
                                                <td className="px-6 py-5 font-black text-white tracking-wider">₹{b.amount?.toLocaleString()}</td>
                                                <td className="px-6 py-5">
                                                    <span className="text-[10px] font-black tracking-widest px-3 py-1.5 rounded-md bg-[#222] border border-white/5 text-white/70 uppercase">
                                                        {b.paymentMode}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border shadow-sm ${b.isRefunded ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)]" :
                                                        b.status === "CONFIRMED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                                                            b.status === "CANCELLED" ? "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]" :
                                                                "bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                                                        }`}>
                                                        {b.isRefunded ? "REFUNDED" : b.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {b.status === "CONFIRMED" && !b.isRefunded && (
                                                        <>
                                                            <button onClick={() => handleCancelBooking(b.id)} className="text-[11px] font-black tracking-widest text-red-400 hover:text-red-300 transition-colors uppercase">Cancel</button>
                                                            <button onClick={() => handleRefundBooking(b.id)} className="text-[11px] font-black tracking-widest text-yellow-400 hover:text-yellow-300 transition-colors uppercase">Refund</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredBookings.length === 0 && (
                                            <tr><td colSpan={7} className="px-6 py-20 text-center text-muted-foreground font-medium">No active bookings found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Manual Booking Modal */}
                        {showManualModal && (
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[#1a1b1a] border border-border rounded-2xl p-8 w-full max-w-lg space-y-5">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-black">Manual Booking</h3>
                                        <button onClick={() => setShowManualModal(false)}><X className="w-5 h-5" /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Date</label>
                                            <DatePicker selected={manualBooking.date ? new Date(manualBooking.date) : null} onChange={(date: Date | null) => setManualBooking({ ...manualBooking, date: date ? format(date, 'yyyy-MM-dd') : '' })} dateFormat="yyyy-MM-dd" className={`${inputClass} text-center`} />
                                        </div>
                                        <div><label className={labelClass}>Sport</label>
                                            <select value={manualBooking.sport} onChange={e => setManualBooking({ ...manualBooking, sport: e.target.value })} className={inputClass}>
                                                <option value="FOOTBALL">Football</option>
                                                <option value="CRICKET">Cricket</option>
                                            </select>
                                        </div>
                                        <div><label className={labelClass}>Start Time</label><input type="time" value={manualBooking.startTime} onChange={e => setManualBooking({ ...manualBooking, startTime: e.target.value })} className={inputClass} /></div>
                                        <div><label className={labelClass}>End Time</label><input type="time" value={manualBooking.endTime} onChange={e => setManualBooking({ ...manualBooking, endTime: e.target.value })} className={inputClass} /></div>
                                        <div><label className={labelClass}>Guest Name</label><input type="text" value={manualBooking.guestName} onChange={e => setManualBooking({ ...manualBooking, guestName: e.target.value })} className={inputClass} /></div>
                                        <div><label className={labelClass}>Phone</label><input type="tel" value={manualBooking.guestPhone} onChange={e => setManualBooking({ ...manualBooking, guestPhone: e.target.value })} className={inputClass} /></div>
                                        <div><label className={labelClass}>Amount (₹)</label><input type="number" value={manualBooking.amount} onChange={e => setManualBooking({ ...manualBooking, amount: Number(e.target.value) })} className={inputClass} /></div>
                                        <div><label className={labelClass}>Payment Mode</label>
                                            <select value={manualBooking.paymentMode} onChange={e => setManualBooking({ ...manualBooking, paymentMode: e.target.value })} className={inputClass}>
                                                <option value="COD">COD (Cash)</option>
                                                <option value="UPI">UPI</option>
                                                <option value="CARD">Card</option>
                                                <option value="ONLINE">Online</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={handleManualBooking} className="w-full bg-primary text-[#111] font-black py-4 rounded-xl hover:bg-primary/90 transition-all">CREATE BOOKING</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== CUSTOM PRICING ===== */}
                {activeTab === "pricing" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Custom Turf Pricing & Blocks</h1>
                                <p className="text-muted-foreground mt-1">Select a date to set custom slot pricing or block hours. Base rate is ₹1,500.</p>
                            </div>
                        </div>

                        <div className="bg-background border border-border p-6 rounded-2xl shadow-sm space-y-6">
                            <div className="max-w-xs relative z-20">
                                <label className={labelClass}>Target Date</label>
                                <DatePicker
                                    selected={overrideDate ? new Date(overrideDate) : null}
                                    onChange={(date: Date | null) => {
                                        const dStr = date ? format(date, 'yyyy-MM-dd') : '';
                                        setOverrideDate(dStr);
                                        if (dStr) fetchOverrideSlots(dStr);
                                    }}
                                    dateFormat="MM/dd/yyyy"
                                    className={`${inputClass} text-center text-lg font-black tracking-widest text-[#bde33c]`}
                                />
                            </div>

                            {overrideDate && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(() => {
                                            const defaultSlots = Array.from({ length: 18 }, (_, i) => {
                                                const h = i + 6;
                                                return `${h.toString().padStart(2, '0')}:00-${(h + 1).toString().padStart(2, '0')}:00`;
                                            });
                                            const customSlotStrs = overrideSlots.filter(o => !defaultSlots.includes(o.slot)).map(o => o.slot);
                                            const allDisplaySlots = [...defaultSlots, ...customSlotStrs].sort();

                                            return allDisplaySlots.map(slotStr => {
                                                const startTime = slotStr.split('-')[0];
                                                const endTime = slotStr.split('-')[1];
                                                const existing = overrideSlots.find(o => o.slot === slotStr);
                                                const price = existing?.price ?? 1500;
                                                const isBlocked = existing?.isBlocked ?? false;

                                                const isBooked = bookedOverrideSlots.some(b =>
                                                    (startTime >= b.start && startTime < b.end) ||
                                                    (endTime > b.start && endTime <= b.end) ||
                                                    (startTime <= b.start && endTime >= b.end)
                                                );

                                                const updateSlot = (newPrice: number, blocked: boolean) => {
                                                    if (isBooked) return;
                                                    const updated = overrideSlots.filter(o => o.slot !== slotStr);
                                                    updated.push({ slot: slotStr, price: newPrice, isBlocked: blocked });
                                                    setOverrideSlots(updated);
                                                };

                                                const containerClass = isBooked
                                                    ? "relative overflow-hidden bg-gradient-to-br from-red-600 to-red-900 border border-red-500 cursor-not-allowed shadow-[0_0_15px_rgba(220,38,38,0.3)] scale-[0.98]"
                                                    : isBlocked
                                                        ? "border-orange-500/50 bg-orange-500/5"
                                                        : "border-[#bde33c]/50 bg-[#bde33c]/5";

                                                return (
                                                    <div key={slotStr} className={`p-4 rounded-xl transition-all ${containerClass}`}>
                                                        {isBooked && (
                                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                                                        )}
                                                        <div className="relative z-10 flex justify-between items-center mb-3">
                                                            <span className={`font-black text-sm ${isBooked ? "text-white/90" : "text-foreground"}`}>{`${format12H(startTime)} - ${format12H(endTime)}`}</span>
                                                            <button
                                                                onClick={() => setSlotToToggle({ slot: slotStr, price, currentBlocked: isBlocked, isBooked })}
                                                                className={`text-xs font-black tracking-widest px-4 py-1.5 rounded-lg transition-all border ${isBooked ? "bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500 hover:text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                                                    : isBlocked ? "bg-orange-500/10 text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-white"
                                                                        : "bg-[#bde33c]/10 text-[#bde33c] border-[#bde33c] hover:bg-[#bde33c] hover:text-[#111]"
                                                                    }`}>
                                                                {isBooked ? "FORCE CANCEL & BLOCK" : isBlocked ? "OPEN" : "BLOCK"}
                                                            </button>
                                                        </div>
                                                        <div className="relative z-10 flex items-center gap-2">
                                                            <span className={`text-xs font-bold ${isBooked ? "text-white/50" : "text-muted-foreground"}`}>₹</span>
                                                            <input type="number" value={price} disabled={isBooked} onChange={e => updateSlot(Number(e.target.value), isBlocked)}
                                                                className={`w-full bg-[#111] border rounded-lg px-3 py-2 text-sm font-black focus:outline-none transition-all ${isBooked ? "border-transparent bg-black/40 text-white/50 cursor-not-allowed"
                                                                    : isBlocked ? "border-orange-500/30 focus:border-orange-500"
                                                                        : "border-[#333] focus:border-[#bde33c]"
                                                                    }`} />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>

                                    {/* Add Custom Slot */}
                                    <div className="mt-8 pt-8 border-t border-border/50">
                                        <h3 className="text-xl font-bold tracking-tight mb-4">Add Custom Timeslot</h3>
                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="flex-1 w-full">
                                                <label className={labelClass}>Start Time</label>
                                                <input type="time" value={newCustomSlot.startTime} onChange={e => setNewCustomSlot({ ...newCustomSlot, startTime: e.target.value })} className={inputClass} />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className={labelClass}>End Time</label>
                                                <input type="time" value={newCustomSlot.endTime} onChange={e => setNewCustomSlot({ ...newCustomSlot, endTime: e.target.value })} className={inputClass} />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className={labelClass}>Base Price (₹)</label>
                                                <input type="number" value={newCustomSlot.price} onChange={e => setNewCustomSlot({ ...newCustomSlot, price: Number(e.target.value) })} className={inputClass} />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <button onClick={async () => {
                                                    if (!newCustomSlot.startTime || !newCustomSlot.endTime) return toast.error("Please enter start and end times.");

                                                    // Strict 1-Hour Validation
                                                    const startH = parseInt(newCustomSlot.startTime.split(':')[0], 10);
                                                    const endH = parseInt(newCustomSlot.endTime.split(':')[0], 10);
                                                    if (endH - startH !== 1) return toast.error("Custom slots must exactly be 1 hour long (e.g. 04:00 to 05:00)");

                                                    const slotStr = `${newCustomSlot.startTime}-${newCustomSlot.endTime}`;
                                                    if (overrideSlots.find(s => s.slot === slotStr)) return toast.error("Slot already exists!");

                                                    const updatedOverrides = [...overrideSlots, { slot: slotStr, price: newCustomSlot.price, isBlocked: false }];

                                                    try {
                                                        const loadingToast = toast.loading("Generating and securely saving slot...");
                                                        await axios.post(`${API}/admin/pricing`, { date: overrideDate, overrides: updatedOverrides, applyForward: false }, authHeaders());
                                                        setOverrideSlots(updatedOverrides);
                                                        setNewCustomSlot({ startTime: '', endTime: '', price: 1500 });
                                                        toast.success("Custom slot generated and permanently saved!", { id: loadingToast });
                                                    } catch (err) {
                                                        toast.error("Failed to save custom slot.");
                                                    }
                                                }} className="w-full bg-secondary text-foreground font-black px-6 py-[18px] rounded-xl border border-border hover:border-primary hover:text-primary transition-all">
                                                    GENERATE SLOT
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save Options */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                                        <button onClick={() => handleSaveOverrides(false)} className="flex-1 bg-primary text-[#111] font-black py-4 rounded-xl hover:bg-primary/90 transition-all">
                                            SAVE FOR TODAY ONLY
                                        </button>
                                        <button onClick={() => handleSaveOverrides(true)} className="flex-1 bg-secondary text-foreground font-black py-4 rounded-xl border border-border hover:border-primary transition-all">
                                            APPLY FOR ALL DAYS FORWARD
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!overrideDate && (
                                <div className="py-20 text-center border-t border-border/50 mt-6">
                                    <p className="text-muted-foreground font-medium">Please select a date to configure slots.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== COUPONS ===== */}
                {activeTab === "coupons" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Coupons & Discounts</h1>
                                <p className="text-muted-foreground mt-1">Manage promotional codes, discounts, and view usage history.</p>
                            </div>
                            <button onClick={() => setShowCouponModal(true)} className="bg-primary text-[#111] font-black px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all">
                                <Plus className="w-5 h-5" /> Create Coupon
                            </button>
                        </div>

                        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[700px]">
                                    <thead className="bg-[#111] text-muted-foreground text-xs uppercase tracking-widest border-b border-[#333]">
                                        <tr>
                                            <th className="px-5 py-4 font-medium">Code</th>
                                            <th className="px-5 py-4 font-medium">Discount</th>
                                            <th className="px-5 py-4 font-medium">Validity</th>
                                            <th className="px-5 py-4 font-medium">Usage</th>
                                            <th className="px-5 py-4 font-medium">Status</th>
                                            <th className="px-5 py-4 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm">
                                        {coupons.map(c => {
                                            const isExpired = new Date(c.expiryDate) < new Date();
                                            return (
                                                <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                                                    <td className="px-5 py-4 font-black uppercase tracking-widest text-primary">{c.code}</td>
                                                    <td className="px-5 py-4 font-bold">
                                                        {c.type === 'FLAT' ? `₹${c.value}` : `${c.value}%`}
                                                        {c.type === 'PERCENTAGE' && c.maxDiscount && <span className="text-xs text-muted-foreground block font-normal">Max ₹{c.maxDiscount}</span>}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {new Date(c.expiryDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="font-bold">{c._count?.bookings || c.totalUsage || 0}</span>
                                                        {c.maxUsage && <span className="text-muted-foreground block text-xs">/ {c.maxUsage} Limit</span>}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${(!c.isActive || isExpired) ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                                                            {isExpired ? "EXPIRED" : !c.isActive ? "INACTIVE" : "ACTIVE"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button onClick={() => handleDeleteCoupon(c.id)} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/20 rounded-full transition-colors" title="Delete Coupon">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {coupons.length === 0 && (
                                            <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No coupons found. Create one.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {showCouponModal && (
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[#1a1b1a] border border-border rounded-2xl p-8 w-full max-w-lg space-y-5">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-black">Create Coupon</h3>
                                        <button onClick={() => setShowCouponModal(false)}><X className="w-5 h-5" /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Code</label><input type="text" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })} className={`${inputClass} uppercase`} placeholder="SUMMER20" /></div>
                                        <div><label className={labelClass}>Type</label>
                                            <select value={newCoupon.type} onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })} className={inputClass}>
                                                <option value="FLAT">Flat ₹</option>
                                                <option value="PERCENTAGE">Percentage %</option>
                                            </select>
                                        </div>
                                        <div><label className={labelClass}>Value</label><input type="number" value={newCoupon.value} onChange={e => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })} className={inputClass} /></div>
                                        <div><label className={labelClass}>Expiry Date</label>
                                            <DatePicker selected={newCoupon.expiryDate ? new Date(newCoupon.expiryDate) : null} onChange={(date: Date | null) => setNewCoupon({ ...newCoupon, expiryDate: date ? format(date, 'yyyy-MM-dd') : '' })} dateFormat="yyyy-MM-dd" className={`${inputClass} text-center`} />
                                        </div>
                                        <div><label className={labelClass}>Usage Limit <span className="font-normal capitalize">(Optional)</span></label><input type="number" value={newCoupon.maxUsage} onChange={e => setNewCoupon({ ...newCoupon, maxUsage: e.target.value })} className={inputClass} placeholder="e.g. 100" /></div>
                                        {newCoupon.type === "PERCENTAGE" && (
                                            <div><label className={labelClass}>Max ₹ Discount <span className="font-normal capitalize">(Optional)</span></label><input type="number" value={newCoupon.maxDiscount} onChange={e => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })} className={inputClass} placeholder="e.g. 500" /></div>
                                        )}
                                        <div><label className={labelClass}>Valid Date <span className="font-normal capitalize">(Optional)</span></label>
                                            <DatePicker selected={newCoupon.validDate ? new Date(newCoupon.validDate) : null} onChange={(date: Date | null) => setNewCoupon({ ...newCoupon, validDate: date ? format(date, 'yyyy-MM-dd') : '' })} dateFormat="yyyy-MM-dd" className={`${inputClass} text-center`} isClearable placeholderText="Any Date" />
                                        </div>
                                        <div><label className={labelClass}>Valid Slots <span className="font-normal capitalize">(Optional, comma separated)</span></label><input type="text" value={newCoupon.validSlots.join(", ")} onChange={e => setNewCoupon({ ...newCoupon, validSlots: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} className={inputClass} placeholder="18:00, 19:00" /></div>
                                    </div>
                                    <button onClick={handleCreateCoupon} className="w-full bg-primary text-[#111] font-black py-4 rounded-xl hover:bg-primary/90 transition-all">GENERATE COUPON</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== GALLERY ===== */}
                {activeTab === "gallery" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Gallery Management</h1>
                            <p className="text-muted-foreground mt-1">Add photos and organize by category.</p>
                        </div>

                        {/* Create Category */}
                        <div className="bg-background border border-border p-5 rounded-2xl shadow-sm">
                            <h3 className="text-sm font-bold mb-3 uppercase tracking-widest text-muted-foreground">Create New Category</h3>
                            <div className="flex gap-3">
                                <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Night Matches" className={`flex-1 min-w-0 ${inputClass}`} />
                                <button onClick={handleCreateCategory} className="shrink-0 bg-primary text-[#111] font-black px-5 py-3 rounded-xl hover:bg-primary/90 transition-all">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Add Image Form */}
                        <div className="bg-background border border-border p-5 rounded-2xl shadow-sm">
                            <h3 className="text-sm font-bold mb-3 uppercase tracking-widest text-muted-foreground">Add New Image</h3>
                            <form onSubmit={handleAddImage} className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="file"
                                        id="galleryFile"
                                        accept="image/jpeg, image/png, image/webp"
                                        required
                                        onChange={e => setNewImage({ ...newImage, file: e.target.files ? e.target.files[0] : null })}
                                        className="w-full bg-[#111] border border-border/50 text-white rounded-xl px-4 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-[#111] hover:file:bg-primary/80 transition-all cursor-pointer"
                                    />
                                </div>
                                <div className="w-full md:w-56">
                                    <select value={newImage.categoryName} onChange={e => setNewImage({ ...newImage, categoryName: e.target.value })} className={inputClass}>
                                        {galleryCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        <option value="Football Matches">Football Matches</option>
                                        <option value="Cricket Matches">Cricket Matches</option>
                                    </select>
                                </div>
                                <button type="submit" disabled={uploadingImage} className="shrink-0 bg-primary text-[#111] font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50">
                                    <Plus className="w-5 h-5" /> {uploadingImage ? "ADDING..." : "ADD"}
                                </button>
                            </form>
                        </div>

                        {/* Gallery by Categories */}
                        {galleryCategories.map(cat => (
                            <div key={cat.id} className="space-y-4">
                                <h3 className="text-lg font-black text-white bg-secondary/30 px-4 py-2 rounded-xl inline-block">{cat.name} ({cat.galleries.length})</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {cat.galleries.map((img: any) => (
                                        <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border/50 aspect-video bg-secondary">
                                            <img src={img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => handleDeleteImage(img.id)} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {galleryCategories.length === 0 && (
                            <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-border/50">
                                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-bold text-muted-foreground">Gallery is empty</h3>
                                <p className="text-sm text-muted-foreground">Create a category and add photos using the forms above.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== USERS & STAFF ===== */}
                {activeTab === "users" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Users & Staff Management</h1>
                                <p className="text-muted-foreground mt-1">Manage customers, block users, and create watchman accounts.</p>
                            </div>
                            <button onClick={() => setShowAddWatchman(true)} className="bg-primary text-[#111] font-black px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all">
                                <UserPlus className="w-5 h-5" /> Add Watchman
                            </button>
                        </div>

                        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-widest">
                                        <tr>
                                            <th className="px-5 py-4 font-medium">Name</th>
                                            <th className="px-5 py-4 font-medium">Phone</th>
                                            <th className="px-5 py-4 font-medium">Role</th>
                                            <th className="px-5 py-4 font-medium">Status</th>
                                            <th className="px-5 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="px-5 py-4 font-medium">{u.name}<br /><span className="text-xs text-muted-foreground">{u.email || ""}</span></td>
                                                <td className="px-5 py-4">{u.phone}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${u.role === "ADMIN" ? "bg-primary/20 text-primary" : u.role === "WATCHMAN" ? "bg-blue-500/20 text-blue-400" : "bg-secondary text-muted-foreground"}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-xs font-bold ${u.status === "ACTIVE" ? "text-emerald-500" : "text-red-500"}`}>{u.status}</span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {u.role !== "ADMIN" && (
                                                        <button onClick={() => handleToggleUser(u.id)}
                                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${u.status === "ACTIVE" ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
                                                            {u.status === "ACTIVE" ? <><ShieldOff className="w-3 h-3 inline mr-1" />Block</> : <><Shield className="w-3 h-3 inline mr-1" />Unblock</>}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>



                        {/* Add Watchman Modal */}
                        {showAddWatchman && (
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[#1a1b1a] border border-border rounded-2xl p-8 w-full max-w-md space-y-5">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-black">Create Watchman Account</h3>
                                        <button onClick={() => setShowAddWatchman(false)}><X className="w-5 h-5" /></button>
                                    </div>
                                    <div className="space-y-4">
                                        <div><label className={labelClass}>Full Name</label><input value={newWatchman.name} onChange={e => setNewWatchman({ ...newWatchman, name: e.target.value })} className={inputClass} /></div>
                                        <div><label className={labelClass}>Phone</label><input value={newWatchman.phone} onChange={e => setNewWatchman({ ...newWatchman, phone: e.target.value })} className={inputClass} /></div>
                                        <div><label className={labelClass}>Email (Optional)</label><input type="email" value={newWatchman.email} onChange={e => setNewWatchman({ ...newWatchman, email: e.target.value })} className={inputClass} /></div>
                                        <div><label className={labelClass}>Password</label><input type="password" value={newWatchman.password} onChange={e => setNewWatchman({ ...newWatchman, password: e.target.value })} className={inputClass} /></div>
                                    </div>
                                    <button onClick={handleCreateWatchman} className="w-full bg-primary text-[#111] font-black py-4 rounded-xl hover:bg-primary/90 transition-all">CREATE WATCHMAN</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== ACTIVITY LOGS ===== */}
                {activeTab === "logs" && (
                    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-500"><Shield className="w-6 h-6" /></div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
                                <p className="text-muted-foreground">Monitor administrative overrides and forced cancellations.</p>
                            </div>
                        </div>

                        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#111111]/80 backdrop-blur-md text-muted-foreground text-[10px] uppercase tracking-[0.2em] border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-5 font-bold">Timestamp</th>
                                            <th className="px-6 py-5 font-bold">Admin</th>
                                            <th className="px-6 py-5 font-bold">Action</th>
                                            <th className="px-6 py-5 font-bold">Target Date</th>
                                            <th className="px-6 py-5 font-bold">Slot</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {blockLogs.map((log, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-all">
                                                <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                                                    {format(new Date(log.date), 'dd MMM yyyy, hh:mm a')}
                                                </td>
                                                <td className="px-6 py-4 font-bold tracking-wider">{log.admin}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border shadow-sm ${log.action === "BLOCKED" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-white">{format(new Date(log.targetDate), 'dd MMM yyyy')}</td>
                                                <td className="px-6 py-4 font-black text-muted-foreground tracking-widest">{log.slot}</td>
                                            </tr>
                                        ))}
                                        {blockLogs.length === 0 && (
                                            <tr><td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-medium">No activity logs found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== SETTINGS ===== */}
                {activeTab === "settings" && (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Turf Settings</h1>
                        <div className="bg-background border border-border p-6 rounded-2xl shadow-sm space-y-6">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
                                <input value={settings.contactNumber} onChange={e => setSettings({ ...settings, contactNumber: e.target.value })} type="text" className={`${inputClass} mt-1`} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Address</label>
                                <textarea rows={3} value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} className={`${inputClass} mt-1 resize-none`} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Facebook Profile URL</label>
                                <input value={settings.facebookUrl} onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })} type="url" placeholder="https://facebook.com/dhavalmart" className={`${inputClass} mt-1`} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Instagram Profile URL</label>
                                <input value={settings.instagramUrl} onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })} type="url" placeholder="https://instagram.com/dhavalmart" className={`${inputClass} mt-1`} />
                            </div>
                            <button onClick={handleSaveSettings} className="bg-primary text-[#111] px-6 py-3 rounded-xl font-black w-full hover:bg-primary/90 transition-all">
                                SAVE SETTINGS
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== GLOBAL MODALS ===== */}
                {/* Slot Toggle Confirmation Modal */}
                {slotToToggle && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1b1a] border border-border rounded-2xl p-8 w-full max-w-sm space-y-6 text-center shadow-2xl animate-in zoom-in-95">
                            <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4 text-orange-500">
                                <Shield className="w-8 h-8" />
                            </div>
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black">
                                    {slotToToggle.currentBlocked ? "Open this slot?" : "Block this slot?"}
                                </h3>
                                <button onClick={() => setSlotToToggle(null)}><X className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed text-left">
                                Are you sure you want to {slotToToggle.currentBlocked ? "OPEN" : "BLOCK"} the <strong>{slotToToggle.slot}</strong> time slot on {overrideDate}? <br />
                                {slotToToggle.isBooked && (
                                    <span className="text-red-400 font-bold mt-3 block p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        🚨 WARNING: A user has booked this slot. Blocking it will forcefully CANCEL their booking in the system!
                                    </span>
                                )}
                            </p>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setSlotToToggle(null)} className="flex-1 px-4 py-3 rounded-xl border border-[#333] hover:bg-white/5 transition-colors font-bold text-sm">
                                    Cancel
                                </button>
                                <button onClick={async () => {
                                    const isBlockingAction = !slotToToggle.currentBlocked;
                                    try {
                                        await axios.post(`${API}/admin/pricing/force-toggle`, {
                                            date: overrideDate,
                                            slot: slotToToggle.slot,
                                            isBlocked: isBlockingAction
                                        }, authHeaders());

                                        toast.success(`Slot successfully ${isBlockingAction ? 'Blocked' : 'Opened'}`);
                                        setSlotToToggle(null);
                                        fetchOverrideSlots(overrideDate);
                                        fetchLogs(); // Refresh logs if we're generating new ones
                                    } catch (error: any) {
                                        toast.error(error.response?.data?.message || "Failed to toggle slot");
                                    }
                                }} className={`flex-1 px-4 py-3 rounded-xl text-white font-black text-sm transition-colors shadow-lg ${slotToToggle.isBooked ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"}`}>
                                    Yes, {slotToToggle.isBooked ? "Cancel User & Block" : slotToToggle.currentBlocked ? "Open It" : "Block It"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Secure Password Action Modal */}
                {refundModal.isOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-[#111] border border-[#333] rounded-3xl p-8 w-full max-w-sm space-y-6 text-center shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2 text-red-500">
                                <Shield className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight text-white mb-2">Security Check</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {refundModal.isCancel
                                        ? "Enter your Admin password to cancel this booking permanently."
                                        : "Enter your Admin password to securely refund this booking via Razorpay."}
                                </p>
                            </div>

                            <div className="text-left space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Admin Password</label>
                                <input
                                    type="password"
                                    autoFocus
                                    value={refundModal.passwordInput}
                                    onChange={e => setRefundModal({ ...refundModal, passwordInput: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && executeSecureAction()}
                                    className="w-full bg-[#1a1b1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-gray-600"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setRefundModal({ isOpen: false, isCancel: false, bookingId: null, passwordInput: '' })} className="flex-1 px-4 py-3 rounded-xl border border-[#333] hover:bg-white/5 transition-colors font-bold text-sm text-gray-300">
                                    Go Back
                                </button>
                                <button onClick={executeSecureAction} className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 text-white font-black text-sm transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111]">
                                    {refundModal.isCancel ? "Cancel Booking" : "Issue Refund"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Coupon Deletion Confirmation Modal */}
                {deleteCouponModal.isOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-[#111] border border-[#333] rounded-3xl p-8 w-full max-w-sm space-y-6 text-center shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2 text-red-500">
                                <X className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight text-white mb-2">Delete Coupon?</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Are you sure you want to permanently discard this promo code? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setDeleteCouponModal({ isOpen: false, couponId: null })} className="flex-1 px-4 py-3 rounded-xl border border-[#333] hover:bg-white/5 transition-colors font-bold text-sm text-gray-300">
                                    Cancel
                                </button>
                                <button onClick={confirmDeleteCoupon} className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 text-white font-black text-sm transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111]">
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, Save, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const format12H = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(':');
    let hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    return `${hr.toString().padStart(2, '0')}:${m} ${ampm}`;
};

export default function UserDashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("bookings");
    const [user, setUser] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [profileData, setProfileData] = useState({ name: "", phone: "", email: "" });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // Email Verify State
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    const [emailOtp, setEmailOtp] = useState("");
    const [verifyingEmail, setVerifyingEmail] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [userRes, bookingsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/auth/me`, config),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/users/bookings`, config)
                ]);

                setUser(userRes.data);
                setProfileData({
                    name: userRes.data.name || "",
                    phone: userRes.data.phone || "",
                    email: userRes.data.email || ""
                });
                setBookings(bookingsRes.data);
            } catch (error) {
                console.error("Dashboard error:", error);
                localStorage.removeItem("token");
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleCancelBooking = async (id: number) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/users/bookings/${id}/cancel`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            alert("Booking cancelled successfully.");
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to cancel booking.");
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        if (!/^\d{10}$/.test(profileData.phone || "")) {
            setMessage("Error: Please enter a valid 10-digit Indian phone number.");
            setSaving(false);
            return;
        }

        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/users/profile`, profileData, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setUser(res.data);
            setMessage("Profile updated successfully!");
        } catch (err: any) {
            setMessage(err.response?.data?.message || "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleSendEmailOtp = async () => {
        if (!user?.email || profileData.email !== user.email) {
            return toast.error("Please save your profile with the new email first.");
        }
        const tid = toast.loading("Sending Verification Email...");
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/auth/email/otp/send`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setEmailOtpSent(true);
            toast.success("Verification Code sent to your inbox!", { id: tid });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send OTP email", { id: tid });
        }
    };

    const handleVerifyEmailOtp = async () => {
        if (emailOtp.length !== 6) return toast.error("Please enter a valid 6-digit code");
        setVerifyingEmail(true);
        const tid = toast.loading("Verifying Code...");
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/auth/email/otp/verify`, { otp: emailOtp }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setUser({ ...user, isEmailVerified: true });
            setEmailOtpSent(false);
            setEmailOtp("");
            toast.success("Email Verified successfully! Secure Password Reset is now enabled.", { id: tid });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to verify code", { id: tid });
        } finally {
            setVerifyingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full pt-28 pb-20 container mx-auto px-4 min-h-screen">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

                {/* Sidebar */}
                <aside className="w-full md:w-64 space-y-2 flex-shrink-0">
                    <div className="bg-secondary/30 rounded-2xl p-6 border border-border mb-6 text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold mb-4">
                            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <h3 className="font-bold text-lg truncate">{user?.name || "Player"}</h3>
                        <p className="text-muted-foreground text-sm truncate">{user?.phone || user?.email}</p>
                    </div>

                    <nav className="space-y-2">
                        {["bookings", "profile", "support"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full text-left px-5 py-3 rounded-xl font-semibold capitalize transition-all ${activeTab === tab
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "hover:bg-secondary text-foreground"
                                    }`}
                            >
                                {tab === "bookings" ? "My Bookings" : tab}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {activeTab === "bookings" && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <h2 className="text-3xl font-bold tracking-tight mb-8">Booking History</h2>

                            <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[800px] border-collapse">
                                        <thead className="bg-[#111111]/80 backdrop-blur-md text-muted-foreground text-[10px] uppercase tracking-[0.2em] border-b border-white/5">
                                            <tr>
                                                <th className="px-6 py-5 font-bold">Date / Time</th>
                                                <th className="px-6 py-5 font-bold">Sport</th>
                                                <th className="px-6 py-5 font-bold">Status</th>
                                                <th className="px-6 py-5 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-sm">
                                            {bookings.map(booking => (
                                                <tr key={booking.id} className="hover:bg-white/[0.02] transition-all group">
                                                    <td className="px-6 py-5">
                                                        <span className="font-bold text-white block mb-1">
                                                            {format(new Date(booking.date), 'dd MMM yyyy')}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-medium tracking-widest">{format12H(booking.startTime)} - {format12H(booking.endTime)}</span>
                                                    </td>
                                                    <td className="px-6 py-5 font-bold text-muted-foreground tracking-widest text-xs uppercase">{booking.sport}</td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border shadow-sm ${booking.status === "CONFIRMED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                                                            booking.status === "COMPLETED" ? "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]" :
                                                                "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                                                            }`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right space-x-3 opacity-80 group-hover:opacity-100 transition-opacity flex justify-end items-center gap-3">
                                                        <button className="text-[11px] font-black tracking-widest text-[#bde33c] hover:text-[#cff454] transition-colors uppercase inline-flex items-center gap-1">
                                                            <Download className="w-3 h-3" /> Receipt
                                                        </button>
                                                        {booking.status === "CONFIRMED" && (() => {
                                                            const bookingDateTime = new Date(`${booking.date.split('T')[0]}T${booking.startTime}`);
                                                            const diffHours = (bookingDateTime.getTime() - new Date().getTime()) / 3600000;
                                                            return diffHours >= 12;
                                                        })() && (
                                                                <button
                                                                    onClick={() => handleCancelBooking(booking.id)}
                                                                    className="text-[11px] font-black tracking-widest text-red-400 hover:text-red-300 transition-colors uppercase"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {bookings.length === 0 && (
                                                <tr><td colSpan={4} className="px-6 py-20 text-center text-muted-foreground font-medium">You have no bookings yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="bg-background border border-border rounded-3xl p-8 max-w-2xl animate-in fade-in duration-500">
                            <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
                            <p className="text-muted-foreground mb-8">Manage your account details and contact information.</p>

                            {message && (
                                <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.includes("success") ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                        className="w-full bg-[#111111] border border-border/50 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={e => setProfileData({ ...profileData, phone: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                                            className="w-full bg-[#111111] border border-border/50 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Email Address</label>
                                            {user?.email && user.email === profileData.email && (
                                                user?.isEmailVerified ? (
                                                    <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" /> Verified
                                                    </span>
                                                ) : (
                                                    <button type="button" onClick={handleSendEmailOtp} className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1 text-primary hover:text-[#cff454] bg-primary/10 px-2 py-0.5 rounded border border-primary/20 transition-colors">
                                                        <ShieldCheck className="w-3 h-3" /> Verify Now
                                                    </button>
                                                )
                                            )}
                                        </div>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                            className="w-full bg-[#111111] border border-border/50 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                        />

                                        {emailOtpSent && (
                                            <div className="mt-3 p-4 bg-primary/5 border border-primary/30 rounded-xl">
                                                <p className="text-xs font-bold text-primary mb-2">Enter Verification Code sent to {user.email}</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={emailOtp}
                                                        onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-[#111111] border border-border/50 rounded-lg px-3 py-2 text-center font-black tracking-[0.3em] outline-none focus:border-primary"
                                                        placeholder="------"
                                                    />
                                                    <button type="button" disabled={verifyingEmail || emailOtp.length !== 6} onClick={handleVerifyEmailOtp} className="bg-primary text-[#111] font-black px-4 rounded-lg text-xs disabled:opacity-50">VERIFY</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 text-[#111111] font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === "support" && (
                        <div className="bg-background border border-border rounded-3xl p-8 max-w-2xl animate-in fade-in duration-500">
                            <h2 className="text-2xl font-bold mb-4">Support & Contact</h2>
                            <p className="text-muted-foreground mb-6">Need help with a booking? Contact the turf management directly.</p>
                            <div className="space-y-4">
                                <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Support</p>
                                    <p className="font-bold mt-1">+91 99999 00000</p>
                                </div>
                                <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Support</p>
                                    <p className="font-bold mt-1">support@dhavalplaza.com</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, LogIn, Phone, Mail, Lock, X, Key, ShieldCheck } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AuthPage() {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);

    // "phone-pass" | "email-pass" | "phone-otp"
    const [loginMethod, setLoginMethod] = useState<"phone-pass" | "email-pass" | "phone-otp">("phone-pass");
    const [formData, setFormData] = useState({ name: "", identifier: "", password: "", email: "", phone: "", otp: "" });
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState("");

    // Forgot Password State
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [fpMethod, setFpMethod] = useState<"phone" | "email">("phone");
    const [fpIdentifier, setFpIdentifier] = useState("");
    const [fpOtpSent, setFpOtpSent] = useState(false);
    const [fpOtp, setFpOtp] = useState("");
    const [fpNewPassword, setFpNewPassword] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (isSignUp && (!/^\d{10}$/.test(formData.phone))) {
            setError("Please enter a valid 10-digit Indian phone number.");
            setLoading(false); return;
        }

        if (!isSignUp && (loginMethod === "phone-pass" || loginMethod === "phone-otp") && (!/^\d{10}$/.test(formData.identifier))) {
            setError("Please enter a valid 10-digit Indian phone number.");
            setLoading(false); return;
        }

        // Handle Signup OTP Sending
        if (isSignUp && !otpSent) {
            const loadingToast = toast.loading("Sending OTP...");
            try {
                await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5005/api"}/auth/send-otp`, { phone: formData.phone });
                setOtpSent(true);
                toast.success("OTP sent to " + formData.phone, { id: loadingToast });
            } catch (err: any) {
                const errMsg = err.response?.data?.message || "Failed to send OTP.";
                setError(errMsg);
                toast.error(errMsg, { id: loadingToast });
            } finally {
                setLoading(false); return;
            }
        }

        // Handle Login OTP Sending
        if (!isSignUp && loginMethod === "phone-otp" && !otpSent) {
            const loadingToast = toast.loading("Sending Login OTP...");
            try {
                await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5005/api"}/auth/login/otp/send`, { phone: formData.identifier });
                setOtpSent(true);
                toast.success("OTP sent to " + formData.identifier, { id: loadingToast });
            } catch (err: any) {
                const errMsg = err.response?.data?.message || "Failed to send OTP.";
                setError(errMsg);
                toast.error(errMsg, { id: loadingToast });
            } finally {
                setLoading(false); return;
            }
        }

        const loadingToast = toast.loading(isSignUp ? "Verifying & Creating account..." : "Authenticating...");

        try {
            let endpoint = "";
            let payload: any = {};

            if (isSignUp) {
                endpoint = "/auth/register";
                payload = {
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    password: formData.password,
                    otp: formData.otp
                };
            } else {
                if (loginMethod === "phone-otp") {
                    endpoint = "/auth/login/otp/verify";
                    payload = { phone: formData.identifier, otp: formData.otp };
                } else {
                    endpoint = "/auth/login";
                    payload = { password: formData.password };
                    if (loginMethod === "phone-pass") payload.phone = formData.identifier;
                    if (loginMethod === "email-pass") payload.email = formData.identifier;
                }
            }

            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5005/api"}${endpoint}`, payload);

            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("userRole", res.data.user?.role || "USER");
                localStorage.setItem("userName", res.data.user?.name || "");
                localStorage.setItem("userPhone", res.data.user?.phone || "");

                toast.success(isSignUp ? "Account created successfully!" : "Logged in successfully!", { id: loadingToast });

                if (res.data.user?.role === "ADMIN") navigate("/admin");
                else if (res.data.user?.role === "WATCHMAN") navigate("/watchman");
                else navigate("/book");
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "Authentication failed. Please try again.";
            setError(errMsg);
            toast.error(errMsg, { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordInitiate = async () => {
        if (!fpIdentifier) return toast.error("Please enter your Phone or Email");
        const tid = toast.loading("Sending Reset OTP...");
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5005/api"}/auth/forgot-password/initiate`, {
                identifier: fpIdentifier
            });
            setFpOtpSent(true);
            toast.success("OTP Sent! Check your device.", { id: tid });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to initiate reset", { id: tid });
        }
    };

    const handleForgotPasswordReset = async () => {
        if (!fpOtp || !fpNewPassword) return toast.error("Please fill all fields");
        const tid = toast.loading("Resetting Password...");
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5005/api"}/auth/forgot-password/reset`, {
                identifier: fpIdentifier,
                otp: fpOtp,
                newPassword: fpNewPassword
            });
            toast.success("Password Reset Successful! You can now login.", { id: tid });
            setShowForgotPassword(false);
            setFpOtpSent(false);
            setFpIdentifier("");
            setFpOtp("");
            setFpNewPassword("");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reset password", { id: tid });
        }
    };

    return (
        <div className="w-full bg-[#111111] min-h-screen text-white font-sans flex items-center justify-center py-20 px-4 relative overflow-hidden">
            <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md bg-[#1a1b1a] rounded-[32px] p-8 md:p-10 border border-border/50 shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <img src="/images/logo.png" alt="Logo" className="w-20 h-20 rounded-full object-cover mx-auto mb-6 shadow-[0_0_15px_rgba(189,227,60,0.2)]" />
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2">
                        {isSignUp ? "Sign up to track and manage your turf bookings." : "Login to manage your turf bookings."}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                {!isSignUp && (
                    <div className="flex bg-[#111111] p-1 rounded-xl mb-6 border border-border/50 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => { setLoginMethod("phone-pass"); setFormData(prev => ({ ...prev, identifier: "", password: "", otp: "" })); setOtpSent(false); }}
                            className={`flex-[1.5] py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${loginMethod === "phone-pass" ? "bg-[#222] text-white shadow-md border border-border/50" : "text-muted-foreground hover:text-white"}`}
                        >
                            Phone Login
                        </button>
                        <button
                            type="button"
                            onClick={() => { setLoginMethod("phone-otp"); setFormData(prev => ({ ...prev, identifier: "", password: "", otp: "" })); setOtpSent(false); }}
                            className={`flex-[1.5] py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${loginMethod === "phone-otp" ? "bg-primary text-[#111] shadow-md border border-primary/50" : "text-muted-foreground hover:text-white"}`}
                        >
                            <ShieldCheck className="w-3 h-3" /> Get OTP
                        </button>
                        <button
                            type="button"
                            onClick={() => { setLoginMethod("email-pass"); setFormData(prev => ({ ...prev, identifier: "", password: "", otp: "" })); setOtpSent(false); }}
                            className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${loginMethod === "email-pass" ? "bg-[#222] text-white shadow-md border border-border/50" : "text-muted-foreground hover:text-white"}`}
                        >
                            Email
                        </button>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    {isSignUp ? (
                        <>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Full Name</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#111111] border border-border/50 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-primary transition-all font-medium" placeholder="Virgil van Dijk" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Mobile Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Phone className="w-5 h-5" /></div>
                                    <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                                        className="w-full bg-[#111111] border border-border/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all font-medium" placeholder="10-digit phone number" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Mail className="w-5 h-5" /></div>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[#111111] border border-border/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all font-medium" placeholder="athlete@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Lock className="w-5 h-5" /></div>
                                    <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-[#111111] border border-border/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all font-medium" placeholder="••••••••" />
                                </div>
                            </div>

                            {otpSent && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2">
                                    <label className="text-xs font-bold text-primary uppercase tracking-widest block mb-2">Enter 6-Digit OTP</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary"><ShieldCheck className="w-5 h-5" /></div>
                                        <input type="text" required maxLength={6} value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                            className="w-full bg-primary/5 border border-primary/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all font-black tracking-[0.5em] text-center shadow-[0_0_15px_rgba(189,227,60,0.1)] focus:shadow-[0_0_20px_rgba(189,227,60,0.3)]" placeholder="------" />
                                    </div>
                                    <button type="button" onClick={() => setOtpSent(false)} className="text-xs text-muted-foreground hover:text-white mt-3 font-medium underline block w-full text-center">Change Details</button>
                                </motion.div>
                            )}
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                                    {loginMethod === "email-pass" ? "Email Address" : "Mobile Number"}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                                        {loginMethod === "email-pass" ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                                    </div>
                                    <input
                                        type={loginMethod === "email-pass" ? "email" : "tel"}
                                        required
                                        value={formData.identifier}
                                        onChange={(e) => {
                                            if (loginMethod !== "email-pass") setFormData({ ...formData, identifier: e.target.value.replace(/\D/g, '').substring(0, 10) });
                                            else setFormData({ ...formData, identifier: e.target.value });
                                        }}
                                        className="w-full bg-[#111111] border border-border/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all font-medium"
                                        placeholder={loginMethod === "email-pass" ? "athlete@example.com" : "10-digit phone number"}
                                    />
                                </div>
                            </div>

                            {loginMethod === "phone-otp" && otpSent && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2">
                                    <label className="text-xs font-bold text-primary uppercase tracking-widest block mb-2">Enter 6-Digit OTP</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary"><ShieldCheck className="w-5 h-5" /></div>
                                        <input type="text" required maxLength={6} value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                            className="w-full bg-primary/5 border border-primary/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all font-black tracking-[0.5em] text-center shadow-[0_0_15px_rgba(189,227,60,0.1)] focus:shadow-[0_0_20px_rgba(189,227,60,0.3)]" placeholder="------" />
                                    </div>
                                    <button type="button" onClick={() => setOtpSent(false)} className="text-xs text-muted-foreground hover:text-white mt-3 font-medium underline block w-full text-center">Change Number</button>
                                </motion.div>
                            )}

                            {loginMethod !== "phone-otp" && (
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Lock className="w-5 h-5" /></div>
                                        <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-[#111111] border border-border/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all font-medium" placeholder="••••••••" />
                                    </div>
                                    <div className="flex justify-end mt-3">
                                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs font-bold text-primary hover:underline">
                                            Forgot Password?
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-[#111111] py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(189,227,60,0.15)] mt-4"
                    >
                        {loading ? "PROCESSING..." : isSignUp ? (otpSent ? "VERIFY & REGISTER" : "SEND OTP") : (loginMethod === "phone-otp" && !otpSent ? "SEND SECURE OTP" : "SECURE LOGIN")} <LogIn className="w-5 h-5" />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsSignUp(!isSignUp); setFormData({ name: "", identifier: "", password: "", email: "", phone: "", otp: "" }); setOtpSent(false); setError(""); }} className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
                        {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                    </button>
                </div>

                <div className="mt-6 pt-6 border-t border-border/50">
                    <p className="text-center text-sm font-medium text-muted-foreground mb-4">Or just want to book quickly?</p>
                    <Link to="/book" className="w-full bg-[#111111] border border-border/50 hover:border-primary/50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group">
                        CONTINUE AS GUEST <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </motion.div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotPassword && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1a1b1a] border border-border/50 rounded-3xl p-8 max-w-sm w-full relative shadow-2xl"
                        >
                            <button onClick={() => setShowForgotPassword(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white bg-[#111] p-2 rounded-full">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="mb-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 border border-primary/20">
                                    <Key className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black uppercase">Reset Password</h3>
                                <p className="text-sm text-muted-foreground mt-2">Choose how you want to receive your reset OTP.</p>
                            </div>

                            {!fpOtpSent ? (
                                <div className="space-y-4">
                                    <div className="flex bg-[#111111] p-1 rounded-xl border border-border/50">
                                        <button onClick={() => setFpMethod("phone")} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${fpMethod === "phone" ? "bg-[#222] text-white shadow-md" : "text-muted-foreground hover:text-white"}`}>SMS OTP</button>
                                        <button onClick={() => setFpMethod("email")} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${fpMethod === "email" ? "bg-[#222] text-white shadow-md" : "text-muted-foreground hover:text-white"}`}>Email Link</button>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{fpMethod === "phone" ? "Mobile Number" : "Email Address"}</label>
                                        <input
                                            type={fpMethod === "phone" ? "tel" : "email"}
                                            value={fpIdentifier}
                                            onChange={(e) => setFpIdentifier(fpMethod === "phone" ? e.target.value.replace(/\D/g, '').substring(0, 10) : e.target.value)}
                                            className="w-full bg-[#111111] border border-border/50 rounded-xl px-4 py-4 text-white focus:border-primary outline-none transition-all font-medium text-sm"
                                            placeholder={fpMethod === "phone" ? "10-digit number" : "athlete@example.com"}
                                        />
                                    </div>
                                    <button onClick={handleForgotPasswordInitiate} className="w-full bg-primary text-[#111] font-black uppercase py-4 rounded-xl mt-4 hover:shadow-[0_0_20px_rgba(189,227,60,0.3)] transition-all flex items-center justify-center gap-2">
                                        <ShieldCheck className="w-5 h-5" /> Receive OTP
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-xs text-primary text-center font-bold mb-4">OTP sent to {fpIdentifier}</p>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">6-Digit OTP</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={fpOtp}
                                            onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-primary/5 border border-primary/50 text-white font-black tracking-[0.5em] text-center rounded-xl px-4 py-4 focus:border-primary outline-none transition-all"
                                            placeholder="------"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2 mt-4">New Password</label>
                                        <input
                                            type="password"
                                            value={fpNewPassword}
                                            onChange={(e) => setFpNewPassword(e.target.value)}
                                            className="w-full bg-[#111111] border border-border/50 rounded-xl px-4 py-4 text-white focus:border-primary outline-none transition-all font-medium text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <button onClick={handleForgotPasswordReset} disabled={fpOtp.length !== 6 || !fpNewPassword} className="w-full bg-primary text-[#111] font-black uppercase py-4 rounded-xl mt-4 hover:shadow-[0_0_20px_rgba(189,227,60,0.3)] transition-all disabled:opacity-50">
                                        Update Password
                                    </button>
                                    <button onClick={() => setFpOtpSent(false)} className="w-full text-center text-xs text-muted-foreground hover:text-white mt-4 underline font-medium">Use a different contact</button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

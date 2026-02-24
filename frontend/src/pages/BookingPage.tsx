import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Loader2, ArrowRight, Star, Calendar as CalendarIcon, Clock } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const format12H = (time24: string) => {
    const [h, m] = time24.split(':');
    let hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    return `${hr.toString().padStart(2, '0')}:${m} ${ampm}`;
};

export default function BookingPage() {
    // 1 for Selection, 2 for Checkout
    const [step, setStep] = useState(1);
    const [date, setDate] = useState<Date>(new Date());
    const [slots, setSlots] = useState<{ startTime: string, endTime: string, isBooked: boolean, price: number }[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [timeWarningSlot, setTimeWarningSlot] = useState<{ slotStr: string, minsLeft: number } | null>(null);

    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, discount: number } | null>(null);
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    const isStandardUser = !!token && userRole === "USER"; // Only auto-fill if normal user
    const [guestDetails, setGuestDetails] = useState({
        name: isStandardUser ? (localStorage.getItem("userName") || "") : "",
        phone: isStandardUser ? (localStorage.getItem("userPhone") || "") : "",
        email: isStandardUser ? (localStorage.getItem("userEmail") || "") : ""
    });

    const dates = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));

    // Fetch slots whenever date or sport changes
    useEffect(() => {
        const fetchSlots = async () => {
            setLoading(true);
            try {
                const formattedDate = format(date, 'yyyy-MM-dd');
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/bookings/slots?date=${formattedDate}`);
                setSlots(res.data.slots);
            } catch (err) {
                console.error("Failed to fetch slots:", err);
                setSlots([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSlots();
        setSelectedSlots([]); // reset selections on date change
    }, [date]);

    const toggleSlot = (slotStr: string) => {
        if (selectedSlots.includes(slotStr)) {
            setSelectedSlots(prev => prev.filter(s => s !== slotStr));
            return;
        }

        const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const nowStr = format(nowIST, 'yyyy-MM-dd');
        const isToday = format(date, 'yyyy-MM-dd') === nowStr;

        const slotHour = parseInt(slotStr.split('-')[0].split(':')[0], 10);

        if (isToday && slotHour === nowIST.getHours()) {
            const minsPassed = nowIST.getMinutes();
            if (minsPassed > 0) {
                setTimeWarningSlot({ slotStr, minsLeft: 60 - minsPassed });
                return;
            }
        }

        setSelectedSlots(prev => [...prev, slotStr]);
    };

    const totalAmount = selectedSlots.reduce((sum, slotStr) => {
        const slot = slots.find(s => `${s.startTime}-${s.endTime}` === slotStr);
        return sum + (slot ? slot.price : 1500);
    }, 0);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/bookings/validate-coupon`, {
                couponCode,
                amount: totalAmount
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setAppliedDiscount({ code: res.data.couponId, discount: res.data.discount });
            toast.success("Coupon applied successfully!");
        } catch (error: any) {
            setAppliedDiscount(null);
            toast.error(error.response?.data?.message || "Invalid coupon code");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        if (selectedSlots.length === 0) return;

        if (guestDetails.phone.length !== 10) {
            toast.error("Please enter a valid 10-digit mobile number.");
            return;
        }

        const authHeaders = () => {
            const token = localStorage.getItem("token");
            return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        };

        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/bookings/initiate`, {
                date: format(date, 'yyyy-MM-dd'),
                slots: selectedSlots,
                sport: "FOOTBALL", // Fixed for backend compatibility
                amount: totalAmount,
                guestName: guestDetails.name,
                guestPhone: guestDetails.phone,
                guestEmail: guestDetails.email,
                couponId: appliedDiscount?.code
            }, authHeaders());

            const { order, bookingIds } = data;

            const options = {
                key: "rzp_test_SJesOqd8XLK2Ac",
                amount: order.amount,
                currency: order.currency,
                name: "Dhaval Plaza Turf & Arena",
                description: `Turf Booking`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/bookings/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingIds: bookingIds
                        }, authHeaders());

                        if (verifyRes.data.message === "Payment verified successfully") {
                            toast.success("Booking Confirmed! You'll receive a WhatsApp text shortly.", { duration: 5000 });
                            window.location.href = "/";
                        }
                    } catch (err) {
                        toast.error("Payment verification failed!");
                        console.error(err);
                    }
                },
                prefill: {
                    name: guestDetails.name,
                    contact: guestDetails.phone,
                },
                theme: {
                    color: "#bde33c" // Primary neon color
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error(`Payment Failed: ${response.error.description}`);
            });
            rzp.open();

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to initiate booking. Slots may be unavailable.");
        }
    };

    const headerImg = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2805&auto=format&fit=crop";
    const title = "Dhaval Plaza Arena";
    const subtitle = "Premium Multisport Turf";
    const amenities = ["FIFA Approved Grass", "LED Floodlights", "Box Cricket Nets", "First-Aid", "Changing Room"];

    if (step === 2) {
        return (
            <div className="w-full pt-20 pb-24 min-h-screen bg-[#111111] text-white">
                <div className="container mx-auto px-4 max-w-4xl mt-10">
                    <button onClick={() => setStep(1)} className="text-primary font-bold mb-6 hover:underline flex items-center gap-2">
                        ← Back to Slots
                    </button>
                    <div className="bg-[#1a1b1a] rounded-[32px] p-8 border border-border/50 shadow-2xl">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h3 className="text-3xl font-black tracking-tight border-b border-border/50 pb-4">Guest Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest block mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={guestDetails.name}
                                            onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                                            className="w-full bg-[#111111] border border-border/50 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-medium"
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest block mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={guestDetails.email}
                                            onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                                            className="w-full bg-[#111111] border border-border/50 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-medium"
                                            placeholder="Receipts will be sent here"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest block mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10}"
                                            value={guestDetails.phone}
                                            onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                                            className="w-full bg-[#111111] border border-border/50 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-medium"
                                            placeholder="10 digit mobile number"
                                        />
                                    </div>
                                </div>

                                <div className="bg-[#111111] p-6 rounded-2xl border border-border/50 mt-6">
                                    <h4 className="font-bold mb-3 uppercase tracking-widest text-sm text-primary">Apply Coupon</h4>
                                    <div className="flex gap-2 items-stretch">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="flex-1 min-w-0 bg-[#1a1b1a] border border-border/50 rounded-xl px-4 py-3 uppercase focus:border-primary outline-none transition-all font-bold tracking-widest text-white"
                                            placeholder="DP20"
                                        />
                                        <button onClick={handleApplyCoupon} disabled={!couponCode || loading} className="shrink-0 bg-primary/20 text-primary font-black px-5 py-3 rounded-xl border border-primary/30 hover:bg-primary hover:text-[#111] transition-all text-sm disabled:opacity-50">
                                            {appliedDiscount ? "Applied!" : "Apply"}
                                        </button>
                                    </div>
                                    {appliedDiscount && (
                                        <p className="text-xs text-primary font-bold mt-2">Discount of ₹{appliedDiscount.discount} applied using {appliedDiscount.code}</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#111111] p-8 rounded-[24px] border border-border/50 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">Order Summary</h3>
                                    <div className="space-y-5 mb-8">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-bold uppercase tracking-widest">Sport</span>
                                            <span className="font-black text-lg bg-[#222] px-3 py-1 rounded-md">Turf Arena</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-bold uppercase tracking-widest">Date</span>
                                            <span className="font-bold">{format(date, 'do MMMM, yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between items-start text-sm">
                                            <span className="text-muted-foreground font-bold uppercase tracking-widest">Slots</span>
                                            <div className="text-right">
                                                {selectedSlots.map(s => {
                                                    const [st, et] = s.split('-');
                                                    return <div key={s} className="font-bold text-primary">{`${format12H(st)} - ${format12H(et)}`}</div>;
                                                })}
                                            </div>
                                        </div>
                                        <div className="w-full h-px bg-border/50 my-4" />
                                        <div className="flex justify-between text-sm items-start">
                                            <span className="text-muted-foreground font-bold uppercase tracking-widest mt-1">Rates</span>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                {selectedSlots.map(s => {
                                                    const slotInfo = slots.find(slot => `${slot.startTime}-${slot.endTime}` === s);
                                                    const [st, et] = s.split('-');
                                                    return (
                                                        <span key={s} className="font-bold flex items-center justify-end gap-2">
                                                            <span className="text-muted-foreground text-[10px] tracking-widest">{`${format12H(st)} - ${format12H(et)}`}</span>
                                                            <span>₹{slotInfo ? slotInfo.price : 1500}</span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-4">
                                            <span className="text-muted-foreground font-bold uppercase tracking-widest">Subtotal</span>
                                            <span className="font-bold text-xl text-white">₹{totalAmount}</span>
                                        </div>
                                        {appliedDiscount && (
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="text-primary font-bold uppercase tracking-widest">Discount ({appliedDiscount.code})</span>
                                                <span className="font-black text-xl text-primary">-₹{appliedDiscount.discount}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-border/50">
                                            <span className="text-muted-foreground font-bold uppercase tracking-widest">Total Amount</span>
                                            <span className="font-black text-4xl text-white">₹{Math.max(0, totalAmount - (appliedDiscount?.discount || 0))}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={!guestDetails.name || !guestDetails.phone}
                                        className="w-full bg-primary hover:bg-primary/90 text-[#111111] py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(189,227,60,0.2)]"
                                    >
                                        PAY SECURELY <ArrowRight className="w-5 h-5" />
                                    </button>
                                    <p className="text-[10px] uppercase font-bold text-center text-muted-foreground mt-4 tracking-widest">
                                        By proceeding, you agree to our Terms
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 1: Selection UI (App Style)
    return (
        <div className="w-full bg-[#111111] font-sans min-h-screen pb-12">
            {/* Header / Hero */}
            <div className="relative h-[45vh] w-full rounded-b-[40px] overflow-hidden shadow-2xl">
                <img src={headerImg} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-transparent" />

                {/* Decorative Spacer */}
                <div className="absolute top-24 left-0 w-full px-6 flex justify-between items-center z-10">
                </div>

                <div className="absolute bottom-8 left-0 w-full px-6 z-10">
                    <div className="container mx-auto md:px-4 max-w-2xl">
                        <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs mb-1">{subtitle}</p>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">{title}</h1>
                        <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30">
                            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Top 10 Rated</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-4 max-w-2xl mt-8">
                {/* Amenities */}
                <div className="mb-10">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                        {amenities.map(item => (
                            <span key={item} className="bg-[#1a1b1a] border border-border/50 text-white/80 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Date Selection */}
                <div className="mb-10">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" /> Select a reservation date
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {dates.map((d, i) => {
                            const isSelected = format(date, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
                            return (
                                <button
                                    key={i}
                                    onClick={() => setDate(d)}
                                    className={`flex-none snap-center flex flex-col items-center justify-center w-20 h-24 rounded-2xl border transition-all ${isSelected
                                        ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(189,227,60,0.15)] ring-1 ring-primary/50"
                                        : "border-border/50 bg-[#1a1b1a] text-white hover:border-primary/50"
                                        }`}
                                >
                                    <span className="text-3xl font-black leading-none">{format(d, 'd')}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${isSelected ? "text-primary" : "opacity-60"}`}>
                                        {format(d, 'E')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Selection */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Select time slot(s)
                    </h3>
                    {loading ? (
                        <div className="h-48 flex items-center justify-center bg-[#1a1b1a] rounded-3xl border border-border/50">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                            {slots.filter(s => {
                                const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                                const nowStr = format(nowIST, 'yyyy-MM-dd');
                                const isToday = format(date, 'yyyy-MM-dd') === nowStr;
                                if (!isToday) return true;
                                const slotHour = parseInt(s.startTime.split(':')[0], 10);
                                return slotHour >= nowIST.getHours();
                            }).map((s, i) => {
                                const slotStr = `${s.startTime}-${s.endTime}`;
                                const isSelected = selectedSlots.includes(slotStr);
                                return (
                                    <button
                                        key={i}
                                        disabled={s.isBooked}
                                        onClick={() => toggleSlot(slotStr)}
                                        className={`relative py-4 rounded-xl text-center text-sm font-black tracking-widest transition-all border overflow-hidden ${s.isBooked
                                            ? "bg-red-500/5 border-red-500/20 text-red-500/80 cursor-not-allowed shadow-[inset_0_0_20px_rgba(239,68,68,0.03)] opacity-75"
                                            : isSelected
                                                ? "border-primary bg-primary text-[#111111]"
                                                : "border-border/30 bg-[#1a1b1a] text-white/80 hover:bg-[#222]"
                                            }`}
                                    >
                                        <span className="relative z-10">{s.isBooked ? "UNAVAILABLE" : `${format12H(s.startTime)} - ${format12H(s.endTime)}`}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Time Warning Modal */}
                {timeWarningSlot && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1b1a] border border-border rounded-2xl p-8 w-full max-w-sm space-y-6 text-center shadow-2xl animate-in zoom-in-95">
                            <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4 text-orange-500">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black">Partial Slot Alert</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                You are trying to book the <strong>{timeWarningSlot ? `${format12H(timeWarningSlot.slotStr.split('-')[0])} - ${format12H(timeWarningSlot.slotStr.split('-')[1])}` : ''}</strong> slot, but {timeWarningSlot ? 60 - timeWarningSlot.minsLeft : 0} minutes have already passed. <br /><br />
                                You will only have <strong>{timeWarningSlot.minsLeft} minutes</strong> remaining in this session.
                            </p>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setTimeWarningSlot(null)} className="flex-1 px-4 py-3 rounded-xl border border-[#333] hover:bg-white/5 transition-colors font-bold text-sm">
                                    Cancel
                                </button>
                                <button onClick={() => {
                                    setSelectedSlots(prev => [...prev, timeWarningSlot.slotStr]);
                                    setTimeWarningSlot(null);
                                }} className="flex-1 px-4 py-3 rounded-xl bg-primary text-[#111] font-black text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(189,227,60,0.2)]">
                                    Proceed Anyway
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Proceed Panel */}
                <div className={`mt-10 mb-8 w-full bg-[#1a1b1a] border border-border/50 rounded-2xl p-4 md:py-6 md:px-8 flex flex-row items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.8)]`}>
                    <div className="text-left">
                        <span className="block text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Price</span>
                        <div className="flex items-end justify-start gap-1.5 md:gap-2 text-white">
                            <span className="text-2xl md:text-4xl font-black leading-none tracking-tight">₹{totalAmount.toLocaleString()}</span>
                            {selectedSlots.length > 0 && <span className="text-sm font-bold text-primary mb-0.5">({selectedSlots.length} hrs)</span>}
                        </div>
                    </div>
                    <button
                        disabled={selectedSlots.length === 0}
                        onClick={() => setStep(2)}
                        className="bg-primary hover:bg-primary/95 text-[#111111] px-6 py-3.5 md:px-10 md:py-4 rounded-full font-black text-sm md:text-base tracking-wider flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(189,227,60,0.15)] active:scale-95"
                    >
                        BOOK NOW <ArrowRight className="w-5 h-5 ml-1.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

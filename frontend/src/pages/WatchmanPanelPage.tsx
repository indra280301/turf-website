import { useState } from "react";
import { format } from "date-fns";
import { Search, CheckCircle2, Languages } from "lucide-react";

const format12H = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(':');
    let hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    return `${hr.toString().padStart(2, '0')}:${m} ${ampm}`;
};

// Mock Data
const mockBookings = [
    { id: 1, guestName: "Rahul Sharma", guestPhone: "9876543210", sport: "FOOTBALL", startTime: "18:00", endTime: "19:00", isArrived: false },
    { id: 2, guestName: "Amit Patel", guestPhone: "9123456789", sport: "CRICKET", startTime: "19:00", endTime: "21:00", isArrived: true },
    { id: 3, guestName: "Sneha Desai", guestPhone: "9988776655", sport: "FOOTBALL", startTime: "21:00", endTime: "22:00", isArrived: false },
];

export default function WatchmanPanelPage() {
    const [lang, setLang] = useState<"EN" | "MR">("EN");
    const [search, setSearch] = useState("");
    const [bookings, setBookings] = useState(mockBookings);

    const translations = {
        EN: {
            title: "Watchman Dashboard",
            today: "Today's Bookings",
            search: "Search by Mobile Number",
            markArrived: "Mark as Arrived",
            arrived: "Arrived",
            noBookings: "No bookings found for today.",
            sport: "Sport",
            time: "Time",
            name: "Name",
            phone: "Phone"
        },
        MR: {
            title: "वॉचमन डॅशबोर्ड",
            today: "आजचे बुकिंग",
            search: "मोबाईल नंबरने शोधा",
            markArrived: "आले म्हणून मार्क करा",
            arrived: "आले",
            noBookings: "आजसाठी कोणतेही बुकिंग आढळले नाही.",
            sport: "खेळ",
            time: "वेळ",
            name: "नाव",
            phone: "मोबाईल"
        }
    };

    const t = translations[lang];

    const filteredBookings = bookings.filter(b => b.guestPhone.includes(search));

    const handleMarkArrived = (id: number) => {
        setBookings(bookings.map(b => b.id === id ? { ...b, isArrived: true } : b));
    };

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-12 w-full px-4 md:px-8 font-sans">
            <div className="max-w-5xl mx-auto">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">{t.title}</h1>
                        <p className="text-muted-foreground mt-2 font-medium">{format(new Date(), 'EEEE, do MMMM yyyy')}</p>
                    </div>

                    <button
                        onClick={() => setLang(lang === "EN" ? "MR" : "EN")}
                        className="bg-secondary hover:bg-secondary/80 text-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors border border-border"
                    >
                        <Languages className="w-5 h-5" />
                        {lang === "EN" ? "मराठी मध्ये बघा" : "View in English"}
                    </button>
                </div>

                {/* Large Actionable Cards */}
                <div className="bg-secondary/30 rounded-3xl border border-border p-6 md:p-10 shadow-lg mb-10">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                        <h2 className="text-3xl font-bold">{t.today}</h2>
                        <div className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <input
                                type="tel"
                                placeholder={t.search}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl py-4 pl-14 pr-6 text-lg outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Bookings List */}
                <div className="space-y-6">
                    {filteredBookings.length === 0 ? (
                        <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-border border-dashed">
                            <p className="text-xl text-muted-foreground">{t.noBookings}</p>
                        </div>
                    ) : (
                        filteredBookings.map((b) => (
                            <div key={b.id} className={`flex flex-col md:flex-row items-center justify-between p-6 md:p-8 rounded-3xl border transition-all ${b.isArrived ? "bg-primary/5 border-primary/20" : "bg-card border-border shadow-xl hover:border-primary/50"
                                }`}
                            >
                                <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 md:mb-0">
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium mb-1">{t.time}</p>
                                        <p className="text-2xl font-bold">{format12H(b.startTime)} - {format12H(b.endTime)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium mb-1">{t.name}</p>
                                        <p className="text-xl font-semibold">{b.guestName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium mb-1">{t.phone}</p>
                                        <p className="text-xl font-semibold text-primary">{b.guestPhone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium mb-1">{t.sport}</p>
                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${b.sport === "FOOTBALL" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                            }`}>
                                            {b.sport === "FOOTBALL" ? "⚽ Football" : "🏏 Cricket"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-none w-full md:w-auto mt-4 md:mt-0">
                                    {b.isArrived ? (
                                        <div className="flex items-center justify-center gap-2 bg-primary/20 text-primary w-full md:w-auto px-8 py-5 rounded-2xl font-bold border border-primary/30 text-lg">
                                            <CheckCircle2 className="w-6 h-6" /> {t.arrived}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleMarkArrived(b.id)}
                                            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5 rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all text-lg flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-6 h-6" /> {t.markArrived}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}

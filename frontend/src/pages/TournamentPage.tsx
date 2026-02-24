import { Trophy, CalendarClock, Users } from "lucide-react";

const tournaments = [
    {
        id: 1,
        title: "Monsoon Football Cup",
        date: "Aug 15, 2024",
        status: "UPCOMING",
        fee: "₹2,500/team",
        teamsFilled: 12,
        maxTeams: 16,
        image: "/images/IMG_6744.jpg"
    },
    {
        id: 2,
        title: "Midnight Cricket Bash",
        date: "Sept 1, 2024",
        status: "REGISTRATION OPEN",
        fee: "₹3,000/team",
        teamsFilled: 4,
        maxTeams: 8,
        image: "/images/IMG_6743.jpg"
    }
];

export default function TournamentPage() {
    return (
        <div className="w-full pt-28 pb-24 container mx-auto px-4 min-h-screen">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Tournaments</h1>
                <p className="text-muted-foreground text-lg">Compete with the best teams in Chiplun. Hosted by Dhaval Mart Turf.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {tournaments.map(t => (
                    <div key={t.id} className="bg-background border border-border rounded-3xl overflow-hidden shadow-xl hover:border-primary/50 transition-all group">
                        <div className="h-48 relative overflow-hidden">
                            <img src={t.image} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary border border-primary/20">
                                {t.status}
                            </div>
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                            <h3 className="text-2xl font-bold">{t.title}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <CalendarClock className="w-5 h-5 text-primary" />
                                    {t.date}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Trophy className="w-5 h-5 text-primary" />
                                    {t.fee}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground col-span-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    {t.teamsFilled} / {t.maxTeams} Teams Registered
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full"
                                    style={{ width: `${(t.teamsFilled / t.maxTeams) * 100}%` }}
                                />
                            </div>

                            <button className="w-full py-3 bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors rounded-xl font-bold border border-border">
                                Register Team
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

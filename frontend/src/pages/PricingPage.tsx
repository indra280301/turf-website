
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const pricingPlans = [
    {
        title: "Standard Hour",
        price: "₹1,000",
        description: "Perfect for daytime casual matches.",
        features: [
            "6AM to 5PM Slot",
            "Access to basic amenities",
            "Standard equipment provided",
            "Instant Confirmation"
        ],
        highlight: false
    },
    {
        title: "Peak Hour",
        price: "₹1,500",
        description: "Evening madness under the floodlights.",
        features: [
            "5PM to 11PM Slot",
            "High-intensity floodlights",
            "Premium match balls",
            "Priority support",
            "Free locker usage"
        ],
        highlight: true
    },
    {
        title: "Weekend Special",
        price: "₹1,800",
        description: "Weekend rates for high demand slots.",
        features: [
            "Any slot on Sat/Sun",
            "All peak hour benefits",
            "Extended 1.5hr booking available",
            "Complimentary water bottles"
        ],
        highlight: false
    }
];

export default function PricingPage() {
    return (
        <div className="w-full pt-28 pb-24 container mx-auto px-4 min-h-screen">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
                <p className="text-muted-foreground text-lg">No hidden fees. Book your time and hit the ground playing.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {pricingPlans.map((plan, i) => (
                    <div
                        key={i}
                        className={`relative bg-background border rounded-3xl p-8 flex flex-col transition-transform hover:-translate-y-2 duration-300 ${plan.highlight
                            ? "border-primary shadow-[0_0_30px_rgba(22,163,74,0.15)] scale-105 z-10"
                            : "border-border shadow-xl hover:border-primary/50"
                            }`}
                    >
                        {plan.highlight && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-sm font-bold px-4 py-1 rounded-full">
                                MOST POPULAR
                            </div>
                        )}
                        <div className="mb-6">
                            <h3 className="text-2xl font-semibold mb-2">{plan.title}</h3>
                            <p className="text-muted-foreground text-sm h-10">{plan.description}</p>
                        </div>

                        <div className="mb-6">
                            <span className="text-4xl font-extrabold">{plan.price}</span>
                            <span className="text-muted-foreground">/hour</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feat, j) => (
                                <li key={j} className="flex items-center gap-3 text-sm">
                                    <Check className="w-5 h-5 text-primary" />
                                    <span className="text-foreground/80">{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/book"
                            className={`w-full py-4 rounded-xl font-bold text-center transition-all ${plan.highlight
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30"
                                : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                                }`}
                        >
                            Book This Slot
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

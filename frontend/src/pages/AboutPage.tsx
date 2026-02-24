import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <div className="w-full pt-20">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="/images/IMG_6232.png" alt="Turf Background" className="w-full h-full object-cover opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
                <div className="relative z-10 text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-extrabold tracking-tight text-white"
                    >
                        About Us
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-muted-foreground max-w-2xl mx-auto"
                    >
                        Experience the finest artificial turf facility in Chiplun.
                    </motion.p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-20 container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold">More Than Just a Ground</h2>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                            Dhaval Mart Turf was founded with one simple goal: to provide sports enthusiasts in Chiplun with a world-class playing facility. Our state-of-the-art FIFA-approved artificial grass ensures an injury-free, high-performance experience whether you're playing football or cricket.

                            We are open 365 days a year, providing high-intensity floodlights for thrilling night matches, and adequate parking for large turnouts. Whether it's a casual weekend game with friends or a high-stakes corporate tournament, you will find everything you need right here.
                        </p>
                    </div>
                    <div className="relative">
                        <div className="aspect-video rounded-3xl overflow-hidden border border-border shadow-2xl relative">
                            <img src="/images/IMG_6743.jpg" alt="Players" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-8 -left-8 bg-secondary/80 backdrop-blur-md p-6 rounded-2xl border border-border hidden md:block">
                            <p className="text-3xl font-extrabold text-primary">5000+</p>
                            <p className="text-sm font-medium text-muted-foreground">Happy Players</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Amenities Section */}
            <section className="py-20 bg-secondary/10 border-y border-border">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16">Premium Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {[
                            { title: "FIFA Turf", icon: "⚽" },
                            { title: "Floodlights", icon: "💡" },
                            { title: "Parking", icon: "🚗" },
                            { title: "Washrooms", icon: "🚿" },
                            { title: "Café Nearby", icon: "☕" },
                            { title: "Supermarket", icon: "🏪" },
                        ].map((item, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                key={i}
                                className="bg-background border border-border/50 rounded-2xl p-6 text-center hover:border-primary/50 hover:shadow-[0_0_15px_rgba(22,163,74,0.1)] transition-all flex flex-col items-center justify-center gap-4"
                            >
                                <div className="text-4xl">{item.icon}</div>
                                <h3 className="font-semibold text-sm">{item.title}</h3>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

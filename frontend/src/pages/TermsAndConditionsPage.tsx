import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsAndConditionsPage() {
    return (
        <div className="w-full bg-background font-sans min-h-screen pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-8 font-bold text-sm uppercase tracking-wide">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>

                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Terms and Conditions</h1>

                <div className="space-y-8 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">1. Booking and Cancellation</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>All turf bookings are subject to availability.</li>
                            <li>Players must arrive at least 10 minutes prior to their booked slot.</li>
                            <li>Cancellations are allowed strictly up to 4 hours before the booked time. A full refund will be processed to the original payment method within 5-7 business days.</li>
                            <li>No refunds will be provided for cancellations made less than 4 hours before the booked slot, or in case of a no-show.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">2. Conduct and Equipment</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Proper sports attire and non-marking sports shoes/studs appropriate for artificial turf must be worn. Barefoot playing or wearing metal studs is strictly prohibited.</li>
                            <li>Consumption of alcohol, smoking, and using illegal substances within the premises are strictly forbidden.</li>
                            <li>Players are responsible for their own equipment. Dhaval Plaza management is not liable for lost, stolen, or damaged personal belongings.</li>
                            <li>Any damage caused to the turf, nets, or property due to negligence will be charged to the person/group responsible.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">3. Safety and Liability</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Players participate in sports and physical activities at their own risk. The management is not responsible for any injuries sustained during play.</li>
                            <li>Management reserves the right to refuse entry or eject individuals exhibiting unruly, abusive, or violent behavior.</li>
                            <li>In case of severe weather conditions interrupting play unexpectedly, management will review the situation for potential rescheduling, but this is solely at their discretion.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">4. Privacy Policy</h2>
                        <p>
                            We collect basic information such as your name, phone number, and email strictly for booking confirmation and communication purposes. We do not sell or share your personal data with third-party marketing agencies. Payment processes are securely handled by our payment gateway partners (e.g., Razorpay) and we do not store your sensitive financial information on our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">5. Amendment of Rules</h2>
                        <p>
                            Dhaval Plaza Turf management reserves the absolute right to amend, alter, or remove any terms and conditions without prior notice. Continued use of the facility implies acceptance of the updated terms.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

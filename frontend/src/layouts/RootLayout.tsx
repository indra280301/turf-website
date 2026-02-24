import { Outlet } from "react-router-dom";
import { TopNavbar } from "./TopNavbar";
import { Footer } from "./Footer";

export function RootLayout() {
    return (
        <div className="min-h-screen flex flex-col dark bg-background text-foreground selection:bg-primary/30">
            <TopNavbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

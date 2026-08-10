"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function LayoutClientside({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="auth-layout">

            <Sidebar
                open={sidebarOpen}
                onClose={closeSidebar}
            />

            <div className="auth-main">

                <header className="auth-header">
                    <Header
                        onMenuClick={() => setSidebarOpen(true)}
                    />
                </header>

                <main className="auth-content">
                    {children}
                </main>

            </div>
        </div>
    );
}
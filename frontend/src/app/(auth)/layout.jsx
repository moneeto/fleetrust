import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LayoutClientside from "./LayoutClientside";
import "./layout.css";

export default async function AuthLayout({ children }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) redirect("/login");

    return (
        <LayoutClientside>
            {children}
        </LayoutClientside>
    );
}
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { NextResponse } from "next/server";

export async function POST() {
    // llamar a tu API real
    await ApiComunicator("/auth/logout", "GET");

    // fallback por si la API no borra
    const res = NextResponse.redirect(
        new URL("/login", "http://localhost:3000")
    );

    res.cookies.set("token", "", {
        path: "/",
        maxAge: 0,
    });

    return res;
}

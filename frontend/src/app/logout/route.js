import { ApiComunicator } from "@/helpers/ApiComunicator";
import { NextResponse } from "next/server";

export async function POST(request) {
    // llamar a tu API real
    await ApiComunicator("/auth/logout", "GET");

    // fallback por si la API no borra
    const res = NextResponse.redirect(
        new URL("/login", process.env.FRONTEND_URL)
    );

    res.cookies.set("token", "", {
        path: "/",
        maxAge: 0,
    });

    return res;
}

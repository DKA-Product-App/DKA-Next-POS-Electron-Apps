'use client'
import React from 'react'
import dynamic from "next/dynamic";

const Billing = dynamic(() => import("../../../components/(cashier)/(billing)"), { ssr : false });

export default function HomePage() {
    return (
        <Billing/>
    )
}

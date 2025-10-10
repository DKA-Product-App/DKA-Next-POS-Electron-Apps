'use client';

import React from "react";
import dynamic from "next/dynamic";


const TransactionListItem = dynamic(() => import('./ui/(pane)/TransactionListItem'), {
    ssr: false,
})

export default function Transaction() {
    return (
        <>
            <TransactionListItem/>
        </>
    )
}

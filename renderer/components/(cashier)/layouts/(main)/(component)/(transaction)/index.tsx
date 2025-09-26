'use client';

import React, {useEffect} from "react";
import dynamic from "next/dynamic";
import ShimmerMenuSelectLoading from "./ui/(loading)/ShimmerMenuSelectLoading";


const TransactionListItem = dynamic(() => import('./ui/(pane)/TransactionListItem'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

export default function Transaction() {
    return (
        <>
            <TransactionListItem/>
        </>
    )
}

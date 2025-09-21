import dynamic from "next/dynamic";
import ShimmerLoading from "../../../components/(shared)/(loading)/ShimmerLoading";
import React from "react";

const Transaction = dynamic(() => import("../../../components/(cashier)/layouts/(main)/(component)/(transaction)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})
export default function TransactionLayout(){
    return (
        <Transaction/>
    )
};

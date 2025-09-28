import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const OperationsTransactionBills = dynamic(() => import("../../../../../../components/(admin)/layouts/(dashboards)/(transaction)/(bills)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ProductsPage(){
    return (
        <OperationsTransactionBills/>
    )
};

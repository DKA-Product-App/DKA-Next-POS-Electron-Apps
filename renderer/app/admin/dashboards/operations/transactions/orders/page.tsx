import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const OperationsTransactionOrder = dynamic(() => import("../../../../../../components/(admin)/layouts/(dashboards)/(transaction)/(order)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ProductsPage(){
    return (
        <OperationsTransactionOrder/>
    )
};

import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const DataConfigPaymentMethod = dynamic(() => import("../../../../../../../components/(admin)/layouts/(dashboards)/(data)/(payment-method)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ProductsPage(){
    return (
        <DataConfigPaymentMethod/>
    )
};

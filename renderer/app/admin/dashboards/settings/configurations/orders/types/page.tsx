import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const DataConfigOrderType = dynamic(() => import("../../../../../../../components/(admin)/layouts/(dashboards)/(data)/(order-type)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ProductsPage(){
    return (
        <DataConfigOrderType/>
    )
};

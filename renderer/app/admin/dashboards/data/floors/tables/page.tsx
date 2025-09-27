import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const FloorsTables = dynamic(() => import("../../../../../../components/(admin)/layouts/(dashboards)/(data)/(floors-tables)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ProductsPage(){
    return (
        <FloorsTables/>
    )
};

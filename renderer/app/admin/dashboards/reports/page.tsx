import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const Reports = dynamic(() => import("../../../../components/(admin)/layouts/(dashboards)/(catalog)/(products)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ReportsPage(){
    return (
        <Reports/>
    )
};

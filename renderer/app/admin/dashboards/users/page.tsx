import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const Overview = dynamic(() => import("../../../../components/(admin)/layouts/(dashboards)/(overview)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function OverviewPage(){
    return (
        <Overview/>
    )
};

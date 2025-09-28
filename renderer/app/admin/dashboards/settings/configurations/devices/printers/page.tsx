import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const DeviceConfigPrinter = dynamic(() => import("../../../../../../../components/(admin)/layouts/(dashboards)/(device)/(printer)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ProductsPage(){
    return (
        <DeviceConfigPrinter/>
    )
};

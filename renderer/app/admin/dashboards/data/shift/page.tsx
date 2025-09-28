import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const Shift = dynamic(() => import("../../../../../components/(admin)/layouts/(dashboards)/(data)/(shift)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ProductsPage(){
    return (
        <Shift/>
    )
};

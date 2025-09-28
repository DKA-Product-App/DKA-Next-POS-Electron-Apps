import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const SlaApprovalsVoid = dynamic(() => import("../../../../../../components/(admin)/layouts/(dashboards)/(catalog)/(categories)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ProductsPage(){
    return (
        <SlaApprovalsVoid/>
    )
};

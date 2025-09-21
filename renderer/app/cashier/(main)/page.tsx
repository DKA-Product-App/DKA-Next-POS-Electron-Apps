import dynamic from "next/dynamic";
import ShimmerLoading from "../../../components/(shared)/(loading)/ShimmerLoading";
import ShimmerMenuSelectLoading
    from "../../../components/(cashier)/layouts/(overview)/ui/(loading)/ShimmerMenuSelectLoading";
import React from "react";

const Overview = dynamic(() => import("../../../components/(cashier)/layouts/(overview)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

const CashierMain = dynamic(() => import("../../../components/(cashier)/layouts/(main)"), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})
export default function OverviewLayout(){
    return (
        <CashierMain/>
    )
};

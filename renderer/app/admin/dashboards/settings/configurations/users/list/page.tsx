import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const Accounts = dynamic(() => import("../../../../../../../components/(admin)/layouts/(dashboards)/(account)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function AccountsPage(){
    return (
        <Accounts/>
    )
};


import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const AccountRoles = dynamic(() => import("../../../../../../../components/(admin)/layouts/(dashboards)/(account)/(account-roles)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function AccountRolesPages(){
    return (
        <AccountRoles/>
    )
};

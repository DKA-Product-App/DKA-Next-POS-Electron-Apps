import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../components/(shared)/(loading)/ShimmerLoading";
import * as React from "react";

const ProductsVariants = dynamic(() => import("../../../../../components/(admin)/layouts/(dashboards)/(catalog)/(variants)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function ProductsPage(){
    return (
        <ProductsVariants/>
    )
};

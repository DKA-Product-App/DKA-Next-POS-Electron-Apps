'use client';

import React from "react";
import dynamic from "next/dynamic";
import ResizableGrid from "./ui/ResizableContainer";
import ShimmerMenuSelectLoading from "./ui/(loading)/ShimmerMenuSelectLoading";
const Information = dynamic(() => import('./ui/(pane)/InformationContent'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})
const Transaction = dynamic(() => import("../(transaction)"), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})


const MenuSelect = dynamic(() => import('./ui/(pane)/MenuSelect'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

export default function Overview() {


    return (
        <ResizableGrid
            defaultSize={'85%'}
            minSize={300}
            left={<Transaction/>}
            right={<MenuSelect/>}
        />
    )
}

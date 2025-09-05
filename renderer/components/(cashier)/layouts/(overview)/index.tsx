import React from "react";
import dynamic from "next/dynamic";
import ResizableGrid from "./ui/ResizableContainer";
import ShimmerMenuSelectLoading from "./ui/(loading)/ShimmerMenuSelectLoading";


const MenuSelect = dynamic(() => import('./ui/(pane)/MenuSelect'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

export default function Overview() {


    return (
        <ResizableGrid
            left={<></>}
            right={<MenuSelect/>}
        />
    )
}

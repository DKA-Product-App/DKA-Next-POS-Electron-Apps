import React from "react";
import dynamic from "next/dynamic";
import ResizableGrid from "./ui/ResizableContainer";
import ShimmerMenuSelectLoading from "./ui/(loading)/ShimmerMenuSelectLoading";
import ShimmerLoading from "../../../(shared)/(loading)/ShimmerLoading";

const MenuSelect = dynamic(() => import('./ui/(pane)/MenuSelect'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

export default function Dashboards({ children }) {


    return (
        <ResizableGrid
            left={<MenuSelect/>}
            right={children}
        />
    )
}

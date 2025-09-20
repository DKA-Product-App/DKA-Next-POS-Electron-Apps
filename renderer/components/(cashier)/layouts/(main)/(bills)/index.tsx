'use client';

import React, {useEffect} from "react";
import dynamic from "next/dynamic";
import ResizableGrid from "./ui/ResizableContainer";
import {useLayoutManipulatorResizable} from "../../../../../contexts/LayoutManipulatorResizableContext";
import ShimmerMenuSelectLoading from "./ui/(loading)/ShimmerMenuSelectLoading";


const BillsListItem = dynamic(() => import('./ui/(pane)/BillsListItem'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

export default function Bills() {
    const { layout, setLayout } = useLayoutManipulatorResizable();

    useEffect(() => {
        setLayout((prev) => {
            return {
                ...prev,
                left : <BillsListItem/>,
                right : <></>,
            }
        })
    }, []);

    return (
        <ResizableGrid
            defaultSize={'23%'}
            minSize={400}
            left={layout?.left ?? <></>}
            right={layout?.right ?? <></>}
        />
    )
}

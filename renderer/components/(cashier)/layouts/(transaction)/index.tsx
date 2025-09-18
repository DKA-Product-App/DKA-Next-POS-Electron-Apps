'use client';

import React, {useEffect} from "react";
import dynamic from "next/dynamic";
import ResizableGrid from "./ui/ResizableContainer";
import ShimmerMenuSelectLoading from "./ui/(loading)/ShimmerMenuSelectLoading";
import {useLayoutManipulatorResizable} from "../../../../contexts/LayoutManipulatorResizableContext";


const TransactionListItem = dynamic(() => import('./ui/(pane)/TransactionListItem'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

export default function Transaction() {
    const { layout, setLayout } = useLayoutManipulatorResizable();

    useEffect(() => {
        setLayout((prev) => {
            return {
                ...prev,
                left : <TransactionListItem/>,
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

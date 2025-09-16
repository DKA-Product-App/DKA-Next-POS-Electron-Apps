import React from "react";
import dynamic from "next/dynamic";
import ResizableGrid from "./ui/ResizableContainer";
import ShimmerMenuSelectLoading from "./ui/(loading)/ShimmerMenuSelectLoading";
import {SeatingProvider} from "./context/SeatingContext";


const TransactionListItem = dynamic(() => import('./ui/(pane)/TransactionListItem'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

export default function Overview({ children }) {


    return (
        <ResizableGrid
            left={<TransactionListItem/>}
            right={children}
        />
    )
}

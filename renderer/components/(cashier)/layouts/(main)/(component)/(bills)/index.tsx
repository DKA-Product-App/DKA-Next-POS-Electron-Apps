'use client';

import React, {useEffect} from "react";
import dynamic from "next/dynamic";
import ShimmerMenuSelectLoading from "./ui/(loading)/ShimmerMenuSelectLoading";


const BillsListItem = dynamic(() => import('./ui/(pane)/BillsListItem'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

export default function Bills() {
    return (<BillsListItem/>)
}

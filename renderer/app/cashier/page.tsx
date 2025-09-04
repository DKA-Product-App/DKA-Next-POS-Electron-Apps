'use client'

import React, {useEffect, useState} from 'react'
import dynamic from "next/dynamic";

const Overview = dynamic(() => import("../../components/(cashier)/(overview)"), { ssr : false });

export default function Chasier() {

    const [ isMounted, setMounted ] = useState(false);


    useEffect(() => {
        setMounted(true);

        return () => {
            return setMounted(false);
        }
    }, []);


    useEffect(() => {
        if (isMounted){
            window.ipc.send('message', { halo : true })
        }
    }, [isMounted]);

    return (
        <>
            <Overview/>
        </>
    )
}

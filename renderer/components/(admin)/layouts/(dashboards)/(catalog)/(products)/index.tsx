'use client';

import * as React from 'react';
import { useEffect } from 'react';

import dynamic from "next/dynamic";
import {TabNavigationHandlerProvider} from "./context/TabNavigationHandlerContext";


const TabNavigation = dynamic(() => import('./ui/TabNavigation'), {
    ssr: false,
});

export default function CashierMain() {


    return (
        <>
            <TabNavigationHandlerProvider>
                <TabNavigation />
            </TabNavigationHandlerProvider>

        </>
    );
}

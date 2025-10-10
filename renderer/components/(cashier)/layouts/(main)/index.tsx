'use client';

import * as React from 'react';
import { useEffect } from 'react';
import ResizableGrid from './ui/ResizableContainer';
import { useLayoutManipulatorResizable } from '../../../../contexts/LayoutManipulatorResizableContext';

import dynamic from "next/dynamic";
import ShimmerMenuSelectLoading from "./(component)/(transaction)/ui/(loading)/ShimmerMenuSelectLoading";
import {TabNavigationHandlerProvider} from "./(component)/(transaction)/context/TabNavigationHandlerContext";
import {useLayoutManipulatorSingleLayout} from "../../../../contexts/LayoutManipulatorSingleLayoutContext";


const TabNavigation = dynamic(() => import('./ui/TabNavigation'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
});

export default function CashierMain() {
    const { layout, setLayout } = useLayoutManipulatorResizable();
    const LayoutSingle = useLayoutManipulatorSingleLayout();

    useEffect(() => {
        LayoutSingle.setLayout(
            <ResizableGrid
                defaultSize="23%"
                minSize={400}
                left={layout?.left ?? <TabNavigation />}
                right={layout?.right ?? <></>}
            />
        )
    }, [LayoutSingle.setLayout, layout]);

    useEffect(() => {
        if (!layout?.left) {
            setLayout(prev => ({
                ...(prev ?? {}),
                left: <TabNavigation />,      // tanam tab nav di kiri
                right: prev?.right ?? <></>,  // JANGAN reset right yang sudah ada di awal
            }));
        }
    }, [layout?.left, setLayout]);

    return (
        <>
            <TabNavigationHandlerProvider>
                { LayoutSingle.layout }
            </TabNavigationHandlerProvider>

        </>
    );
}

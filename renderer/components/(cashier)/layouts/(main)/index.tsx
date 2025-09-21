'use client';

import * as React from 'react';
import { useEffect } from 'react';
import ResizableGrid from './ui/ResizableContainer';
import { useLayoutManipulatorResizable } from '../../../../contexts/LayoutManipulatorResizableContext';
import { TransactionEventTriggerProvider } from './(component)/(transaction)/ui/(pane)/context/TransactionEventTriggerContext';

import dynamic from "next/dynamic";
import ShimmerMenuSelectLoading from "./(component)/(transaction)/ui/(loading)/ShimmerMenuSelectLoading";


const TabNavigation = dynamic(() => import('./ui/TabNavigation'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
});

export default function CashierMain() {
    const { layout, setLayout } = useLayoutManipulatorResizable();

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
            <TransactionEventTriggerProvider>
                <ResizableGrid
                    defaultSize="23%"
                    minSize={400}
                    left={layout?.left ?? <TabNavigation />}
                    right={layout?.right ?? <></>}
                />
            </TransactionEventTriggerProvider>
        </>
    );
}

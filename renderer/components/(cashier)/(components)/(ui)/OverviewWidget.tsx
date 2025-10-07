'use client'

import * as React from 'react'
import {
    IconButton, Tooltip
} from '@mui/material'
import PaidIcon from '@mui/icons-material/Paid';
import {useLayoutManipulatorSingleLayout} from "../../../../contexts/LayoutManipulatorSingleLayoutContext";
import {useEffect} from "react";
import ResizableGrid from "../../layouts/(main)/ui/ResizableContainer";
import dynamic from "next/dynamic";
import ShimmerMenuSelectLoading
    from "../../layouts/(main)/(component)/(transaction)/ui/(loading)/ShimmerMenuSelectLoading";
import {useLayoutManipulatorResizable} from "../../../../contexts/LayoutManipulatorResizableContext";
import ShimmerLoading from "../../../(shared)/(loading)/ShimmerLoading";


type OverviewWidgetProps = {
    /** Lebar popover (px) */
    width?: number
    /** Tinggi maksimum scroll area (px) */
    maxHeight?: number
    /** Ukuran ikon MUI */
    iconFontSize?: 'small' | 'medium' | 'large'
}

const TabNavigation = dynamic(() => import("../../layouts/(main)/ui/TabNavigation"), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
});

const Overview = dynamic(() => import("../../layouts/(overview)"), {
    loading: () => <ShimmerLoading />,
    ssr: false,
});


export default function OverviewWidget({ width = 420, maxHeight = 360, iconFontSize = 'small' }: OverviewWidgetProps) {
    const { layout, setLayout } = useLayoutManipulatorResizable();
    const [inViewMode, setInViewMode] = React.useState<boolean>(false);
    const LayoutSingle = useLayoutManipulatorSingleLayout();
    const onClickButton = () => {
        setInViewMode((prev) => !prev);
    }

    useEffect(() => {
        if (inViewMode){
            LayoutSingle.setLayout(
                <Overview/>
            )
        }else{
            LayoutSingle.setLayout(
                <ResizableGrid
                    defaultSize="23%"
                    minSize={400}
                    left={layout?.left ?? <TabNavigation />}
                    right={layout?.right ?? <></>}
                />
            )
        }
    }, [inViewMode]);
    return (
        <>
            {/* Anchor: ikon cloud */}
            <Tooltip title={`Lihat Overview`}>
                <IconButton
                    size="small"
                    onClick={onClickButton}
                    aria-haspopup="dialog"
                    aria-controls="network-popover"
                >
                    <PaidIcon fontSize={iconFontSize}/>
                </IconButton>
            </Tooltip>
        </>
    )
}

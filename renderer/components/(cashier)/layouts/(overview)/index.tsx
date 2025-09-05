'use client';

import React from "react";
import ResizableGrid from "./ui/ResizableContainer";
import MenuSelect from "./ui/(pane)/MenuSelect";

export default function Overview() {


    return (
        <ResizableGrid
            left={<></>}
            right={<MenuSelect/>}
        />
    )
}

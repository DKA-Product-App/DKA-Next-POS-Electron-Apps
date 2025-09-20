import React from "react";
import dynamic from "next/dynamic";
import ResizableGrid from "./ui/ResizableContainer";
import ShimmerMenuSelectLoading from "./ui/(loading)/ShimmerMenuSelectLoading";
import {SeatingProvider} from "./context/SeatingContext";


/*const MenuSelect = dynamic(() => import('./ui/(pane)/MenuSelect'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})*/

const TablePicker2DWidget = dynamic(() => import('./ui/(pane)/TablePicker2DWidget'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

const TableAssignPanel = dynamic(() => import('./ui/(pane)/TableAssignPanel'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
});
export default function SelectTables({ onSelectTable, allowWishlistIdTable } : { onSelectTable?: (id : string) => void; allowWishlistIdTable?: string[] }) {

    return (
        <SeatingProvider>
            <ResizableGrid
                left={<TablePicker2DWidget
                    allowWishlistIdTable={allowWishlistIdTable}
                />}
                right={<TableAssignPanel onSelectTable={onSelectTable} allowWishlistActive={!!allowWishlistIdTable?.length} />}
            />
        </SeatingProvider>
    )
}

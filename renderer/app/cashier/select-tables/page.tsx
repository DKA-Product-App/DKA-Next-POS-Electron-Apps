import dynamic from "next/dynamic";
import ShimmerLoading from "../../../components/(loading)/ShimmerLoading";

const SelectTables = dynamic(() => import("../../../components/(cashier)/layouts/(select-tables)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})
export default function SelectTablesLayout(){
    return (
        <SelectTables/>
    )
};

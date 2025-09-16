import dynamic from "next/dynamic";
import ShimmerLoading from "../../../components/(shared)/(loading)/ShimmerLoading";

const Transaction = dynamic(() => import("../../../components/(cashier)/layouts/(transaction)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})
export default function SelectTablesLayout({ children }){
    return (
        <Transaction>
            { children }
        </Transaction>
    )
};

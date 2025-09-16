import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../components/(shared)/(loading)/ShimmerLoading";


const TransactionContainer = dynamic(() => import("../../../../components/(cashier)/layouts/(transaction)/ui/(pane)/TransactionContainer"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function TransactionBatchLayout(){
    return (
        <TransactionContainer/>
    )
};

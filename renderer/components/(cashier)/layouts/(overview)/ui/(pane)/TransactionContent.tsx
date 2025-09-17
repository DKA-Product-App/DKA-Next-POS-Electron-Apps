import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../components/(shared)/(loading)/ShimmerLoading";

const Transaction = dynamic(() => import("../../../(transaction)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

const TransactionContainer = dynamic(() => import("../../../../layouts/(transaction)/ui/(pane)/TransactionContainer"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})
export default function TransactionContent(){
    return (
        <TransactionContainer/>
    )
};

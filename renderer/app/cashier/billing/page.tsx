import dynamic from "next/dynamic";
import ShimmerLoading from "../../../components/(shared)/(loading)/ShimmerLoading";

const Billing = dynamic(() => import("../../../components/(cashier)/layouts/(billing)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})
export default function BillingLayout(){
    return (
        <Billing/>
    )
};

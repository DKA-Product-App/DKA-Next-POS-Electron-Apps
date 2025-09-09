import dynamic from "next/dynamic";
import ShimmerLoading from "../../../components/(shared)/(loading)/ShimmerLoading";

const Overview = dynamic(() => import("../../../components/(cashier)/layouts/(overview)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})
export default function OverviewLayout(){
    return (
        <Overview/>
    )
};

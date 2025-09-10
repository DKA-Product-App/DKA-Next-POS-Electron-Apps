import * as React from 'react'
import LayoutContainer from "../../components/(admin)/LayoutContainer";
import dynamic from "next/dynamic";
import ShimmerLoading from "../../components/(shared)/(loading)/ShimmerLoading";

const Dashboard = dynamic(() => import("../../components/(admin)/layouts/(dashboards)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})

export default function Layout({ children }) {

    return (
        <LayoutContainer>
            <Dashboard>
                { children }
            </Dashboard>
        </LayoutContainer>
    )
}

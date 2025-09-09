import React from "react";
import dynamic from "next/dynamic";
import ShimmerSignInCard from "../../../components/(auth)/components/(loading)/ShimmerSignInCard";

const SignInCard = dynamic(() => import("../../../components/(auth)/components/SignInCard"), {
    loading : () => <ShimmerSignInCard/>,
    ssr : false,
})
export default function Login(){

    return (
        <SignInCard />
    )
}
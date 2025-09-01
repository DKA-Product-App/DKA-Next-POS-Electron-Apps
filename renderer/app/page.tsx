import dynamic from "next/dynamic";


const Billing = dynamic(() => import('../components/(billing)'), {
        ssr : false,
        loading: () => <></>
});

export default function App() {

    return (
        <Billing/>
    )
}
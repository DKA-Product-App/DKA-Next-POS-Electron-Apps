import React from 'react'
import dynamic from 'next/dynamic'
import ResizableGrid from './ui/ResizableContainer'
import ShimmerLoadingPreviewSelectCheckout from './ui/(loading)/ShimmerLoadingPreviewSelectCheckout'
import ShimmerLoadingSelectMenu from './ui/(loading)/ShimmerLoadingSelectMenu'
import { CartProvider } from './context/CartContext'

const PreviewSelectCheckout = dynamic(() => import('./ui/(pane)/PreviewSelectCheckout'), {
    loading: () => <ShimmerLoadingPreviewSelectCheckout />,
    ssr: false,
})

const SelectMenuAndVariant = dynamic(() => import('./ui/(pane)/SelectMenuAndVariant'), {
    loading: () => <ShimmerLoadingSelectMenu />,
    ssr : false,
})


export default function Billing() {

    return (
        <CartProvider initialTaxRate={0.11}>
            <ResizableGrid
                left={<SelectMenuAndVariant />}
                right={<PreviewSelectCheckout  />}
            />
        </CartProvider>
    )
}

import React from 'react'
import dynamic from 'next/dynamic'
import ResizableGrid from './ui/ResizableContainer'
import ShimmerLoadingPreviewSelectCheckout from './ui/(loading)/ShimmerLoadingPreviewSelectCheckout'
import ShimmerLoadingSelectMenu from './ui/(loading)/ShimmerLoadingSelectMenu'
import { CartProvider } from './context/CartContext'
import { PRODUCTS, CATEGORIES } from './data' // opsional: kalau mau pindahkan data ke file terpisah

const PreviewSelectCheckout = dynamic(() => import('./ui/(pane)/PreviewSelectCheckout'), {
    loading: () => <ShimmerLoadingPreviewSelectCheckout />,
    ssr: false,
})

const SelectMenuAndVariant = dynamic(() => import('./ui/(pane)/SelectMenuAndVariant'), {
    loading: () => <ShimmerLoadingSelectMenu />,
    ssr : false,
})

export default function Billing() {

    const leftEl = React.useMemo(() => (
        <SelectMenuAndVariant product={PRODUCTS} categories={CATEGORIES} />
    ), [])

    const rightEl = React.useMemo(() => <PreviewSelectCheckout />, [])

    return (
        <CartProvider initialTaxRate={0.11}>
            <ResizableGrid left={leftEl} right={rightEl} />
        </CartProvider>
    )
}

'use client'

import React, { FC, memo } from 'react'
import { Tabs, Tab, Chip, Stack } from '@mui/material'
import {ProductsCategories} from "../../../../../../../types/product/product.categories.type";

type Props = {
    value: number
    onChange: (idx: number) => void
    categories: ProductsCategories[]
    counts: Map<string, number>
    total: number
    indicatorGradient?: string
}

const CategoryTabs: FC<Props> = ({
                                     value,
                                     onChange,
                                     categories,
                                     counts,
                                     total,
                                     indicatorGradient = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)',
                                 }) => {
    return (
        <Tabs
            value={value}
            onChange={(_, v) => onChange(v)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
                mt: 1,
                '.MuiTabs-indicator': { height: 3, borderRadius: 3, background: indicatorGradient },
                '.MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    minHeight: 36,
                    px: 1.25,
                    '&:not(.Mui-selected)': { opacity: 0.85 },
                },
            }}
        >
            <Tab
                label={
                    <Stack direction="row" spacing={1} alignItems="center">
                        <span>All</span>
                        <Chip size="small" variant="outlined" label={total} />
                    </Stack>
                }
            />
            {categories.map((c) => (
                <Tab
                    key={String(c.id)}
                    label={
                        <Stack direction="row" spacing={1} alignItems="center">
                            <span>{c.name}</span>
                            <Chip size="small" variant="outlined" label={counts.get(String(c.id)) ?? 0} />
                        </Stack>
                    }
                />
            ))}
        </Tabs>
    )
}

export default memo(CategoryTabs)

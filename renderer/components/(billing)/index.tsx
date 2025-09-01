'use client';

import React, { useLayoutEffect } from "react";
import dynamic from 'next/dynamic'
import ResizableGrid from "./ResizableContainer";
import {CartItem} from "./(components)/PreviewSelectCheckout";
import ShimmerLoadingSelectMenu from "./(helper)/ShimmerLoadingSelectMenu";
import ShimmerLoadingPreviewSelectCheckout from "./(helper)/ShimmerLoadingPreviewSelectCheckout";
import {Products} from "./types/products.type";
import {ProductsCategories} from "./types/product.categories.type";
import {ProductsVariants} from "./types/products.variants.type";

// =======================
// Categories
// =======================
const CATEGORIES: ProductsCategories[] = [
    {
        "id": "00000000-0000-5000-a000-000000000001",
        "name": "Coffee",
        "description": "Arabika, Torabika, Robusta. Segala Jenis Kopi",
        "time_created": {
            "unix": 1748589346,
            "humanize": "15:15:46 30-05-2025"
        },
        "status": true
    },
    {
        "id": "00000000-0000-5000-a000-000000000002",
        "name": "Food",
        "description": "makanan",
        "time_created": {
            "unix": 1748589346,
            "humanize": "15:15:46 30-05-2025"
        },
        "status": true
    },
    {
        "id": "00000000-0000-5000-a000-000000000003",
        "name": "Tea",
        "description": "Berbagai jenis teh",
        "time_created": {
            "unix": 1748589346,
            "humanize": "15:15:46 30-05-2025"
        },
        "status": true
    }
]

// helper biar ga ngulang2
const TC = { unix: 1748589346, humanize: "15:15:46 30-05-2025" }
const CAT = {
    coffee: { id: "00000000-0000-5000-a000-000000000001", name: "Coffee", description: "Arabika, Torabika, Robusta. Segala Jenis Kopi", time_created: TC, status: true },
    food:   { id: "00000000-0000-5000-a000-000000000002", name: "Food",   description: "makanan",                                           time_created: TC, status: true },
    tea:    { id: "00000000-0000-5000-a000-000000000003", name: "Tea",    description: "Berbagai jenis teh",                                time_created: TC, status: true },
}

// =======================
// Products (hasil konversi dari data awal)
// - price = basePrice + priceDelta
// - id & variant.id pakai pola increment ala UUID dummy
// - sku di-derive dari nama (UPPERCASE, underscore)
// =======================
const PRODUCTS: Products[] = [
    // p1
    {
        "name": "Americano",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000001",
        "category": CAT.coffee,
        "sku": "AMERICANO",
        "description": "Americano",
        "image": "/uploads/images/americano.jpeg",
        "variants": [
            {
                "name": "Hot", "id": "00000000-0000-5000-a000-000000000001.00000000-0000-5000-a000-000000000001",
                "code": "HOT", "description": "Panas", "price": 20000, "time_created": TC, "status": true
            },
            {
                "name": "Iced", "id": "00000000-0000-5000-a000-000000000001.00000000-0000-5000-a000-000000000002",
                "code": "ICE", "description": "Dingin", "price": 23000, "time_created": TC, "status": true
            }
        ]
    },

    // p2
    {
        "name": "Latte",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000002",
        "category": CAT.coffee,
        "sku": "LATTE",
        "description": "Latte",
        "image": "/uploads/images/late.jpeg",
        "variants": [
            { "name": "Regular", "id": "00000000-0000-5000-a000-000000000002.00000000-0000-5000-a000-000000000001", "code": "REG", "description": "Ukuran Reguler", "price": 25000, "time_created": TC, "status": true },
            { "name": "XL",      "id": "00000000-0000-5000-a000-000000000002.00000000-0000-5000-a000-000000000002", "code": "XL",  "description": "Ukuran Besar",   "price": 30000, "time_created": TC, "status": true },
            { "name": "Oat Milk","id": "00000000-0000-5000-a000-000000000002.00000000-0000-5000-a000-000000000003", "code": "OAT", "description": "Susu Oat",       "price": 33000, "time_created": TC, "status": true }
        ]
    },

    // p3
    {
        "name": "Matcha Latte",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000003",
        "category": CAT.tea,
        "sku": "MATCHA_LATTE",
        "description": "Matcha Latte",
        "image": "/uploads/images/matcha.jpg",
        "variants": [
            { "name": "Hot",  "id": "00000000-0000-5000-a000-000000000003.00000000-0000-5000-a000-000000000001", "code": "HOT", "description": "Panas",  "price": 22000, "time_created": TC, "status": true },
            { "name": "Iced", "id": "00000000-0000-5000-a000-000000000003.00000000-0000-5000-a000-000000000002", "code": "ICE", "description": "Dingin", "price": 25000, "time_created": TC, "status": true }
        ]
    },

    // p6
    {
        "name": "Cappuccino Italiano Dari Italia",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000006",
        "category": CAT.coffee,
        "sku": "CAPPUCCINO_ITALIANO",
        "description": "Cappuccino Italiano",
        "image": "/uploads/images/cappucino.jpg",
        "variants": [
            { "name": "Hot",         "id": "00000000-0000-5000-a000-000000000006.00000000-0000-5000-a000-000000000001", "code": "HOT", "description": "Panas",        "price": 27000, "time_created": TC, "status": true },
            { "name": "Iced",        "id": "00000000-0000-5000-a000-000000000006.00000000-0000-5000-a000-000000000002", "code": "ICE", "description": "Dingin",       "price": 30000, "time_created": TC, "status": true },
            { "name": "Double Shot", "id": "00000000-0000-5000-a000-000000000006.00000000-0000-5000-a000-000000000003", "code": "DBL", "description": "Double Shot",  "price": 31000, "time_created": TC, "status": true }
        ]
    },

    // p7
    {
        "name": "Espresso",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000007",
        "category": CAT.coffee,
        "sku": "ESPRESSO",
        "description": "Espresso",
        "image": "/uploads/images/espresso.jpg",
        "variants": [
            { "name": "Single", "id": "00000000-0000-5000-a000-000000000007.00000000-0000-5000-a000-000000000001", "code": "SGL", "description": "Single", "price": 18000, "time_created": TC, "status": true },
            { "name": "Double", "id": "00000000-0000-5000-a000-000000000007.00000000-0000-5000-a000-000000000002", "code": "DBL", "description": "Double", "price": 21000, "time_created": TC, "status": true }
        ]
    },

    // p8
    {
        "name": "Mocha",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000008",
        "category": CAT.coffee,
        "sku": "MOCHA",
        "description": "Mocha",
        "image": "/uploads/images/mocca.jpg",
        "variants": [
            { "name": "Hot",  "id": "00000000-0000-5000-a000-000000000008.00000000-0000-5000-a000-000000000001", "code": "HOT", "description": "Panas",  "price": 29000, "time_created": TC, "status": true },
            { "name": "Iced", "id": "00000000-0000-5000-a000-000000000008.00000000-0000-5000-a000-000000000002", "code": "ICE", "description": "Dingin", "price": 32000, "time_created": TC, "status": true }
        ]
    },

    // p9
    {
        "name": "Caramel Macchiato",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000009",
        "category": CAT.coffee,
        "sku": "CARAMEL_MACCHIATO",
        "description": "Caramel Macchiato",
        "image": "/uploads/images/caramel_macchiato.webp",
        "variants": [
            { "name": "Hot",      "id": "00000000-0000-5000-a000-000000000009.00000000-0000-5000-a000-000000000001", "code": "HOT", "description": "Panas",      "price": 32000, "time_created": TC, "status": true },
            { "name": "Iced",     "id": "00000000-0000-5000-a000-000000000009.00000000-0000-5000-a000-000000000002", "code": "ICE", "description": "Dingin",     "price": 35000, "time_created": TC, "status": true },
            { "name": "Oat Milk", "id": "00000000-0000-5000-a000-000000000009.00000000-0000-5000-a000-000000000003", "code": "OAT", "description": "Susu Oat",   "price": 40000, "time_created": TC, "status": true }
        ]
    },

    // p10
    {
        "name": "Cold Brew",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000010",
        "category": CAT.coffee,
        "sku": "COLD_BREW",
        "description": "Cold Brew",
        "image": "/uploads/images/cold_brew.jpeg",
        "variants": [
            { "name": "Regular", "id": "00000000-0000-5000-a000-000000000010.00000000-0000-5000-a000-000000000001", "code": "REG", "description": "Reguler", "price": 26000, "time_created": TC, "status": true },
            { "name": "Vanilla", "id": "00000000-0000-5000-a000-000000000010.00000000-0000-5000-a000-000000000002", "code": "VAN", "description": "Vanilla", "price": 30000, "time_created": TC, "status": true }
        ]
    },

    // p11
    {
        "name": "Vietnamese Drip",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000011",
        "category": CAT.coffee,
        "sku": "VIETNAMESE_DRIP",
        "description": "Vietnamese Drip",
        "image": "/uploads/images/vietnam_drip.avif",
        "variants": [
            { "name": "Condensed Milk", "id": "00000000-0000-5000-a000-000000000011.00000000-0000-5000-a000-000000000001", "code": "COND", "description": "Susu Kental", "price": 28000, "time_created": TC, "status": true },
            { "name": "Black",          "id": "00000000-0000-5000-a000-000000000011.00000000-0000-5000-a000-000000000002", "code": "BLK",  "description": "Hitam",       "price": 24000, "time_created": TC, "status": true }
        ]
    },

    // p12
    {
        "name": "Affogato",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000012",
        "category": CAT.coffee,
        "sku": "AFFOGATO",
        "description": "Affogato",
        "image": "/uploads/images/affogato.jpeg",
        "variants": [
            { "name": "Standard",    "id": "00000000-0000-5000-a000-000000000012.00000000-0000-5000-a000-000000000001", "code": "STD", "description": "Standar",      "price": 32000, "time_created": TC, "status": true },
            { "name": "Double Shot", "id": "00000000-0000-5000-a000-000000000012.00000000-0000-5000-a000-000000000002", "code": "DBL", "description": "Double Shot",  "price": 36000, "time_created": TC, "status": true }
        ]
    },

    // p13
    {
        "name": "Black Tea",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000013",
        "category": CAT.tea,
        "sku": "BLACK_TEA",
        "description": "Black Tea",
        "variants": [
            { "name": "Hot",  "id": "00000000-0000-5000-a000-000000000013.00000000-0000-5000-a000-000000000001", "code": "HOT", "description": "Panas",  "price": 15000, "time_created": TC, "status": true },
            { "name": "Iced", "id": "00000000-0000-5000-a000-000000000013.00000000-0000-5000-a000-000000000002", "code": "ICE", "description": "Dingin", "price": 17000, "time_created": TC, "status": true }
        ]
    },

    // p14
    {
        "name": "Lemon Tea",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000014",
        "category": CAT.tea,
        "sku": "LEMON_TEA",
        "description": "Lemon Tea",
        "variants": [
            { "name": "Hot",  "id": "00000000-0000-5000-a000-000000000014.00000000-0000-5000-a000-000000000001", "code": "HOT", "description": "Panas",  "price": 17000, "time_created": TC, "status": true },
            { "name": "Iced", "id": "00000000-0000-5000-a000-000000000014.00000000-0000-5000-a000-000000000002", "code": "ICE", "description": "Dingin", "price": 19000, "time_created": TC, "status": true }
        ]
    },

    // p15
    {
        "name": "Thai Tea",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000015",
        "category": CAT.tea,
        "sku": "THAI_TEA",
        "description": "Thai Tea",
        "variants": [
            { "name": "Regular", "id": "00000000-0000-5000-a000-000000000015.00000000-0000-5000-a000-000000000001", "code": "REG", "description": "Reguler", "price": 22000, "time_created": TC, "status": true },
            { "name": "XL",      "id": "00000000-0000-5000-a000-000000000015.00000000-0000-5000-a000-000000000002", "code": "XL",  "description": "Besar",   "price": 27000, "time_created": TC, "status": true }
        ]
    },

    // p16
    {
        "name": "Milk Tea",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000016",
        "category": CAT.tea,
        "sku": "MILK_TEA",
        "description": "Milk Tea",
        "variants": [
            { "name": "Regular", "id": "00000000-0000-5000-a000-000000000016.00000000-0000-5000-a000-000000000001", "code": "REG",  "description": "Reguler", "price": 20000, "time_created": TC, "status": true },
            { "name": "Boba",    "id": "00000000-0000-5000-a000-000000000016.00000000-0000-5000-a000-000000000002", "code": "BOBA", "description": "Tambah Boba", "price": 25000, "time_created": TC, "status": true }
        ]
    },

    // p17
    {
        "name": "Jasmine Tea",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000017",
        "category": CAT.tea,
        "sku": "JASMINE_TEA",
        "description": "Jasmine Tea",
        "variants": [
            { "name": "Hot",  "id": "00000000-0000-5000-a000-000000000017.00000000-0000-5000-a000-000000000001", "code": "HOT", "description": "Panas",  "price": 16000, "time_created": TC, "status": true },
            { "name": "Iced", "id": "00000000-0000-5000-a000-000000000017.00000000-0000-5000-a000-000000000002", "code": "ICE", "description": "Dingin", "price": 18000, "time_created": TC, "status": true }
        ]
    },

    // p18
    {
        "name": "Peach Tea",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000018",
        "category": CAT.tea,
        "sku": "PEACH_TEA",
        "description": "Peach Tea",
        "variants": [
            { "name": "Iced", "id": "00000000-0000-5000-a000-000000000018.00000000-0000-5000-a000-000000000001", "code": "ICE", "description": "Dingin", "price": 21000, "time_created": TC, "status": true },
            { "name": "XL",   "id": "00000000-0000-5000-a000-000000000018.00000000-0000-5000-a000-000000000002", "code": "XL",  "description": "Besar",  "price": 25000, "time_created": TC, "status": true }
        ]
    },

    // p19
    {
        "name": "Nasi Goreng",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000019",
        "category": CAT.food,
        "sku": "NASI_GORENG",
        "description": "Nasi Goreng",
        "variants": [
            { "name": "Regular", "id": "00000000-0000-5000-a000-000000000019.00000000-0000-5000-a000-000000000001", "code": "REG", "description": "Reguler", "price": 25000, "time_created": TC, "status": true },
            { "name": "Spesial (telur+sosis)", "id": "00000000-0000-5000-a000-000000000019.00000000-0000-5000-a000-000000000002", "code": "SPC", "description": "Spesial", "price": 32000, "time_created": TC, "status": true }
        ]
    },

    // p20
    {
        "name": "Mie Goreng",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000020",
        "category": CAT.food,
        "sku": "MIE_GORENG",
        "description": "Mie Goreng",
        "variants": [
            { "name": "Regular", "id": "00000000-0000-5000-a000-000000000020.00000000-0000-5000-a000-000000000001", "code": "REG", "description": "Reguler", "price": 23000, "time_created": TC, "status": true },
            { "name": "Spesial (telur+ayam)", "id": "00000000-0000-5000-a000-000000000020.00000000-0000-5000-a000-000000000002", "code": "SPC", "description": "Spesial", "price": 30000, "time_created": TC, "status": true }
        ]
    },

    // p21
    {
        "name": "Chicken Katsu",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000021",
        "category": CAT.food,
        "sku": "CHICKEN_KATSU",
        "description": "Chicken Katsu",
        "variants": [
            { "name": "Pakai Nasi",  "id": "00000000-0000-5000-a000-000000000021.00000000-0000-5000-a000-000000000001", "code": "RICE",   "description": "Dengan Nasi", "price": 32000, "time_created": TC, "status": true },
            { "name": "Tanpa Nasi",  "id": "00000000-0000-5000-a000-000000000021.00000000-0000-5000-a000-000000000002", "code": "NORICE", "description": "Tanpa Nasi",  "price": 29000, "time_created": TC, "status": true }
        ]
    },

    // p22
    {
        "name": "Chicken Wings",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000022",
        "category": CAT.food,
        "sku": "CHICKEN_WINGS",
        "description": "Chicken Wings",
        "variants": [
            { "name": "4 pcs", "id": "00000000-0000-5000-a000-000000000022.00000000-0000-5000-a000-000000000001", "code": "4PCS", "description": "4 potong", "price": 28000, "time_created": TC, "status": true },
            { "name": "8 pcs", "id": "00000000-0000-5000-a000-000000000022.00000000-0000-5000-a000-000000000002", "code": "8PCS", "description": "8 potong", "price": 40000, "time_created": TC, "status": true }
        ]
    },

    // p23
    {
        "name": "French Fries",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000023",
        "category": CAT.food,
        "sku": "FRENCH_FRIES",
        "description": "French Fries",
        "variants": [
            { "name": "Regular",       "id": "00000000-0000-5000-a000-000000000023.00000000-0000-5000-a000-000000000001", "code": "REG",    "description": "Reguler",      "price": 18000, "time_created": TC, "status": true },
            { "name": "Large",         "id": "00000000-0000-5000-a000-000000000023.00000000-0000-5000-a000-000000000002", "code": "LG",     "description": "Besar",        "price": 23000, "time_created": TC, "status": true },
            { "name": "Cheese Powder", "id": "00000000-0000-5000-a000-000000000023.00000000-0000-5000-a000-000000000003", "code": "CHS",    "description": "Bumbu Keju",   "price": 22000, "time_created": TC, "status": true }
        ]
    },

    // p24
    {
        "name": "Beef Burger",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000024",
        "category": CAT.food,
        "sku": "BEEF_BURGER",
        "description": "Beef Burger",
        "variants": [
            { "name": "Single",       "id": "00000000-0000-5000-a000-000000000024.00000000-0000-5000-a000-000000000001", "code": "SGL",  "description": "Single",        "price": 32000, "time_created": TC, "status": true },
            { "name": "Double",       "id": "00000000-0000-5000-a000-000000000024.00000000-0000-5000-a000-000000000002", "code": "DBL",  "description": "Double",        "price": 44000, "time_created": TC, "status": true },
            { "name": "Extra Cheese", "id": "00000000-0000-5000-a000-000000000024.00000000-0000-5000-a000-000000000003", "code": "CHEE", "description": "Tambah Keju",  "price": 37000, "time_created": TC, "status": true }
        ]
    },

    // p25
    {
        "name": "Veggie Burger",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000025",
        "category": CAT.food,
        "sku": "VEGGIE_BURGER",
        "description": "Veggie Burger",
        "variants": [
            { "name": "Plain",  "id": "00000000-0000-5000-a000-000000000025.00000000-0000-5000-a000-000000000001", "code": "PLN",  "description": "Biasa",       "price": 30000, "time_created": TC, "status": true },
            { "name": "w/ Cheese", "id": "00000000-0000-5000-a000-000000000025.00000000-0000-5000-a000-000000000002", "code": "CHEE", "description": "Dengan Keju", "price": 35000, "time_created": TC, "status": true }
        ]
    },

    // p26
    {
        "name": "Caesar Salad",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000026",
        "category": CAT.food,
        "sku": "CAESAR_SALAD",
        "description": "Caesar Salad",
        "variants": [
            { "name": "Regular", "id": "00000000-0000-5000-a000-000000000026.00000000-0000-5000-a000-000000000001", "code": "REG",     "description": "Reguler",     "price": 27000, "time_created": TC, "status": true },
            { "name": "+ Chicken","id": "00000000-0000-5000-a000-000000000026.00000000-0000-5000-a000-000000000002", "code": "CHICK",   "description": "Tambah Ayam", "price": 35000, "time_created": TC, "status": true }
        ]
    },

    // p27
    {
        "name": "Spaghetti Bolognese",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000027",
        "category": CAT.food,
        "sku": "SPAGHETTI_BOLOGNESE",
        "description": "Spaghetti Bolognese",
        "variants": [
            { "name": "Regular",     "id": "00000000-0000-5000-a000-000000000027.00000000-0000-5000-a000-000000000001", "code": "REG",   "description": "Reguler",     "price": 30000, "time_created": TC, "status": true },
            { "name": "XL",          "id": "00000000-0000-5000-a000-000000000027.00000000-0000-5000-a000-000000000002", "code": "XL",    "description": "Besar",       "price": 37000, "time_created": TC, "status": true },
            { "name": "Extra Cheese","id": "00000000-0000-5000-a000-000000000027.00000000-0000-5000-a000-000000000003", "code": "CHEE",  "description": "Tambah Keju", "price": 35000, "time_created": TC, "status": true }
        ]
    },

    // p28
    {
        "name": "Spaghetti Carbonara",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000028",
        "category": CAT.food,
        "sku": "SPAGHETTI_CARBONARA",
        "description": "Spaghetti Carbonara",
        "variants": [
            { "name": "Regular",     "id": "00000000-0000-5000-a000-000000000028.00000000-0000-5000-a000-000000000001", "code": "REG",   "description": "Reguler",      "price": 31000, "time_created": TC, "status": true },
            { "name": "XL",          "id": "00000000-0000-5000-a000-000000000028.00000000-0000-5000-a000-000000000002", "code": "XL",    "description": "Besar",        "price": 38000, "time_created": TC, "status": true },
            { "name": "Smoked Beef", "id": "00000000-0000-5000-a000-000000000028.00000000-0000-5000-a000-000000000003", "code": "SMBF",  "description": "Daging Asap",  "price": 39000, "time_created": TC, "status": true }
        ]
    },

    // p29
    {
        "name": "Pizza Slice",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000029",
        "category": CAT.food,
        "sku": "PIZZA_SLICE",
        "description": "Pizza Slice",
        "variants": [
            { "name": "Cheese",     "id": "00000000-0000-5000-a000-000000000029.00000000-0000-5000-a000-000000000001", "code": "CHZ",  "description": "Keju",       "price": 22000, "time_created": TC, "status": true },
            { "name": "Pepperoni",  "id": "00000000-0000-5000-a000-000000000029.00000000-0000-5000-a000-000000000002", "code": "PEP",  "description": "Pepperoni",  "price": 27000, "time_created": TC, "status": true },
            { "name": "Margherita", "id": "00000000-0000-5000-a000-000000000029.00000000-0000-5000-a000-000000000003", "code": "MARG", "description": "Margherita", "price": 25000, "time_created": TC, "status": true }
        ]
    },

    // p30
    {
        "name": "Donut",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000030",
        "category": CAT.food,
        "sku": "DONUT",
        "description": "Donut",
        "variants": [
            { "name": "Glazed",    "id": "00000000-0000-5000-a000-000000000030.00000000-0000-5000-a000-000000000001", "code": "GLZ",  "description": "Glazed",     "price": 12000, "time_created": TC, "status": true },
            { "name": "Chocolate", "id": "00000000-0000-5000-a000-000000000030.00000000-0000-5000-a000-000000000002", "code": "CHOC", "description": "Cokelat",    "price": 14000, "time_created": TC, "status": true },
            { "name": "Sprinkles", "id": "00000000-0000-5000-a000-000000000030.00000000-0000-5000-a000-000000000003", "code": "SPR",  "description": "Sprinkles",  "price": 14000, "time_created": TC, "status": true }
        ]
    },

    // p31
    {
        "name": "Fried Chicken (2 pcs)",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000031",
        "category": CAT.food,
        "sku": "FRIED_CHICKEN_2PCS",
        "description": "Fried Chicken (2 pcs)",
        "variants": [
            { "name": "Original",    "id": "00000000-0000-5000-a000-000000000031.00000000-0000-5000-a000-000000000001", "code": "ORI",     "description": "Original",     "price": 28000, "time_created": TC, "status": true },
            { "name": "Spicy",       "id": "00000000-0000-5000-a000-000000000031.00000000-0000-5000-a000-000000000002", "code": "SPICY",   "description": "Pedas",        "price": 30000, "time_created": TC, "status": true },
            { "name": "Tambah Nasi", "id": "00000000-0000-5000-a000-000000000031.00000000-0000-5000-a000-000000000003", "code": "ADDRICE", "description": "Plus Nasi",    "price": 34000, "time_created": TC, "status": true }
        ]
    },

    // p32
    {
        "name": "Tuna Sandwich",
        "time_created": TC,
        "status": true,
        "id": "00000000-0000-5000-a000-000000000032",
        "category": CAT.food,
        "sku": "TUNA_SANDWICH",
        "description": "Tuna Sandwich",
        "variants": [
            { "name": "Regular",     "id": "00000000-0000-5000-a000-000000000032.00000000-0000-5000-a000-000000000001", "code": "REG",  "description": "Reguler",     "price": 26000, "time_created": TC, "status": true },
            { "name": "Extra Cheese","id": "00000000-0000-5000-a000-000000000032.00000000-0000-5000-a000-000000000002", "code": "CHEE", "description": "Tambah Keju", "price": 31000, "time_created": TC, "status": true }
        ]
    },
]


const PreviewSelectCheckout = dynamic(() => import('./(components)/PreviewSelectCheckout'), {
    loading: () => <ShimmerLoadingPreviewSelectCheckout />,
    ssr : false
})

const SelectMenuAndVariant = dynamic(() => import('./(components)/SelectMenuAndVariant'), {
    loading: () => <ShimmerLoadingSelectMenu />,
    ssr : false
})

export default function Billing() {
    const [items, setItems] = React.useState<CartItem[]>([])

    useLayoutEffect(() => {
        document.documentElement.style.overflow = 'hidden'
        document.documentElement.style.height = '100%'
        document.body.style.overflow = 'hidden'
        document.body.style.height = '100%'
        document.body.style.margin = '0'
    }, [])

    const addToCart = (p: Products, v?: ProductsVariants) => {
        const key = `${p.id}:${v?.id ?? 'base'}`
        const unitPrice = (v?.price ?? 0)
        const variantLabel = v?.name
        setItems(prev => {
            const idx = prev.findIndex(it => it.key === key)
            if (idx >= 0) {
                const updated = [...prev]
                updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 }
                return updated
            }
            return [...prev, { key, productId: p.id, name: p.name, variantLabel, unitPrice, qty: 1 }]
        })
    }

    const inc = (key: string) =>
        setItems(prev => prev.map(it => it.key === key ? { ...it, qty: it.qty + 1 } : it))

    const dec = (key: string) =>
        setItems(prev =>
            prev
                .map(it => it.key === key ? { ...it, qty: it.qty - 1 } : it)
                .filter(it => it.qty > 0)
        )

    const remove = (key: string) =>
        setItems(prev => prev.filter(it => it.key !== key))

    const clear = () => setItems([])

    return (
        <ResizableGrid
            left={
                <SelectMenuAndVariant
                    product={PRODUCTS}
                    categories={CATEGORIES}
                    onAdd={addToCart}
                />
            }
            right={
                <PreviewSelectCheckout
                    items={items}
                    onInc={inc}
                    onDec={dec}
                    onRemove={remove}
                    onClear={clear}
                />
            }
        />
    )
}

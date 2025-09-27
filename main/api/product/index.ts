import {BrowserWindow} from "electron";
import Product from "./api.product.api";
import ProductCategory from "./api.product.category.api";
import ProductVariant from "./api.product.variant.api";

export function ProductApi(mainWindow ?: BrowserWindow) {
    ProductCategory(mainWindow);
    Product(mainWindow);
    ProductVariant(mainWindow);
}

export default ProductApi;
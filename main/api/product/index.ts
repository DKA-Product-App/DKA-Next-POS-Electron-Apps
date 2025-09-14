import {BrowserWindow} from "electron";
import Product from "./api.product.api";
import ProductCategory from "./api.product.category.api";

export function ProductApi(mainWindow ?: BrowserWindow) {
    ProductCategory(mainWindow);
    Product(mainWindow);
}

export default ProductApi;
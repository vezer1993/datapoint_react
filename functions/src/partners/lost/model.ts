export interface LostProductModel {
    code: string;
    product: string;
    price: number;
    vpc: number;
    rabat: number;
    available: string;
    description: string;
    specification: string;
    image: string;
    images: string[];
    category: string;
    category_parent: string[];
    category_order: number;
    category_parent_order: number;
    product_order: number;
    warranty: string;
    action: number;
    new: number;
    brand: string;
    supplier_code: string;
    barcode: string;
}
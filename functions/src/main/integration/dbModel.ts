export interface dbModel {
    name: string;
    quantity: number;
    available: boolean;
    category: string[];
    parent_category: string[];
    ean: string;
    remoteID: string;
    price_base: number;
    price_retail: number;
    rebate: number;
    description: string;
    brand: string;
    margin: number;
    pictures: string[];
    documents: string[];
    warranty: string;
    synced: string;
}
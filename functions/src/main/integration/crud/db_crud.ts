import * as admin from 'firebase-admin';

export async function getFileFromStorage(companyID:string, path:string){
    const storage = admin.storage();
    const bucket = storage.bucket();

    const file_name = `${companyID}_${path}`;
    const file = bucket.file(file_name);

    try {
        // Generates a signed URL for downloading the file
        const signedUrls = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491' // A future expiration date
        });
        const url = signedUrls[0];

        // Fetch the file using the signed URL
        const response = await fetch(url);
        return response.text();
    } catch (error) {
        console.error("Error fetching file from storage: ", error);
        return "";
    }
}

export async function getProductsForPartner(companyID:string, partner:string){
    const db = admin.firestore();

    const colRef = db.collection(`user_companies/${companyID}/selected_products`);
    const querySnapshot = await colRef.where('supplier', '==', partner).get();
    return querySnapshot;
}
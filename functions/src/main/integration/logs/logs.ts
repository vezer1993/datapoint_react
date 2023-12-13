import * as admin from 'firebase-admin';

export async function logToFirestore(companyID: string, logPath :string, logData: { success: boolean; message: string; partner: string }) {
    const db = admin.firestore();
    const timestamp = admin.firestore.Timestamp.now(); // Get current timestamp

    var success = "correct";
    if(!logData.success){
        success = "error";
    }
    
    try {
        await db.collection("user_companies")
                .doc(companyID)
                .collection("logs")
                .doc(logPath)
                .collection(success)
                .add({
                    ...logData,
                    timestamp: timestamp
                });
    } catch (error) {
        console.error("Failed to write log to Firestore:", error);
    }
}
import { lostUpdate } from "../../partners/lost/manager";
import { alsoUpdate } from "../../partners/also/manager";
import { logToFirestore } from "../integration/logs/logs";
import { jarltechUpdate } from "../../partners/jarltech/manager";


export const startUpdate = async (data, companyID) => {
    // Check if 'partners' exists and is an object
    if (data.partners && typeof data.partners === 'object') {
        // Iterate through each key in the 'partners' map
        for (const [partnerKey, partnerValue] of Object.entries(data.partners)) {
            // Use a switch statement to handle different partner keys
            if (data.partners[partnerKey].on) {
                switch (partnerKey) {
                    case 'lost':
                        try {
                            await lostUpdate(partnerValue, companyID);
                            await logToFirestore(companyID, "update", {
                                success: true,
                                message: "successfully updated data from the partner",
                                partner: partnerKey
                            });
                        } catch (error) {
                            await logToFirestore(companyID, "update", {
                                success: false,
                                message: error.message,
                                partner: partnerKey
                            });
                        }
                        break;
                    case 'also':
                        try {
                            await alsoUpdate(partnerValue, companyID);
                            await logToFirestore(companyID, "update", {
                                success: true,
                                message: "successfully updated data from the partner",
                                partner: partnerKey
                            });
                        } catch (error) {
                            await logToFirestore(companyID, "update", {
                                success: false,
                                message: error.message,
                                partner: partnerKey
                            });
                        }
                        break;
                    case 'jarltech':
                        try {
                            await jarltechUpdate(partnerValue, companyID);
                            await logToFirestore(companyID, "update", {
                                success: true,
                                message: "successfully updated data from the partner",
                                partner: partnerKey
                            });
                        } catch (error) {
                            await logToFirestore(companyID, "update", {
                                success: false,
                                message: error.message,
                                partner: partnerKey
                            });
                        }
                        break;
                    default:
                        // Handle any other case
                        console.log(`Unknown partner key: ${partnerKey}`);
                    // Logic for any other or unknown partner keys
                }
            }
        }
    }
};
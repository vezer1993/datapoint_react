import { lostImport } from "../../partners/lost/manager";
import { alsoImport } from "../../partners/also/manager";
import { jarltechImport } from "../../partners/jarltech/manager";
import { logToFirestore } from "../integration/logs/logs";
import { luceedImport } from "../../partners/luceed/manager";
import { wandImport } from "../../partners/wand/manager";
import { microlineImport } from "../../partners/microline/manager";


export const startImport = async (data, companyID) => {
    // Check if 'partners' exists and is an object
    if (data.partners && typeof data.partners === 'object') {
        // Iterate through each key in the 'partners' map
        for (const [partnerKey, partnerValue] of Object.entries(data.partners)) {
            // Use a switch statement to handle different partner keys
            if (data.partners[partnerKey].on) {
                switch (partnerKey) {
                    case 'lost':
                        try {
                            await lostImport(partnerValue, companyID);
                            await logToFirestore(companyID, "import", {
                                success: true,
                                message: "successfully imported data from the partner",
                                partner: partnerKey
                            });
                        } catch (error) {
                            await logToFirestore(companyID, "import", {
                                success: false,
                                message: error.message,
                                partner: partnerKey
                            });
                        }
                        break;
                    case 'also':
                        try {
                            await alsoImport(partnerValue, companyID);
                            await logToFirestore(companyID, "import", {
                                success: true,
                                message: "successfully imported data from the partner",
                                partner: partnerKey
                            });
                        } catch (error) {
                            await logToFirestore(companyID, "import", {
                                success: false,
                                message: error.message,
                                partner: partnerKey
                            });
                        }
                        break;

                    case 'jarltech':
                        try {
                            await jarltechImport(partnerValue, companyID);
                            await logToFirestore(companyID, "import", {
                                success: true,
                                message: "successfully imported data from the partner",
                                partner: partnerKey
                            });
                        } catch (error) {
                            await logToFirestore(companyID, "import", {
                                success: false,
                                message: error.message,
                                partner: partnerKey
                            });
                        }
                        break;

                    case 'luceed':
                        try {
                            await luceedImport(partnerValue, companyID);
                            await logToFirestore(companyID, "import", {
                                success: true,
                                message: "successfully imported data from the partner",
                                partner: partnerKey
                            });
                        } catch (error) {
                            await logToFirestore(companyID, "import", {
                                success: false,
                                message: error.message,
                                partner: partnerKey
                            });
                        }
                        break;
                    case 'wand':
                        try {
                            await wandImport(partnerValue, companyID);
                            await logToFirestore(companyID, "import", {
                                success: true,
                                message: "successfully imported data from the partner",
                                partner: partnerKey
                            });
                        } catch (error) {
                            await logToFirestore(companyID, "import", {
                                success: false,
                                message: error.message,
                                partner: partnerKey
                            });
                        }
                        break;
                    case 'microline':
                        try {
                            await microlineImport(partnerValue, companyID);
                            await logToFirestore(companyID, "import", {
                                success: true,
                                message: "successfully imported data from the partner",
                                partner: partnerKey
                            });
                        } catch (error) {
                            await logToFirestore(companyID, "import", {
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
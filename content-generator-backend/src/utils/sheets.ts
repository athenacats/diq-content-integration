import { google } from "googleapis";
import { JWT } from "google-auth-library";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Resolve the absolute path to avoid file not found errors
const keyFilePath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "");

if (!keyFilePath) {
  throw new Error("❌ GOOGLE_SERVICE_ACCOUNT_PATH is missing in .env file");
}

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: SCOPES,
});

export const appendToSheet = async (
  spreadsheetId: string,
  range: string,
  values: string[][]
) => {
  try {
    const client = (await auth.getClient()) as JWT;
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    console.log("✅ Successfully wrote to Google Sheet!");
  } catch (error: any) {
    console.error("❌ Google Sheets API Error:", error.message);
  }
};

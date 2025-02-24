import { google } from "googleapis";
import path from "path";
import dotenv from "dotenv";
import { JWT } from "google-auth-library";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const keyFilePath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "");

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: SCOPES,
});

const testGoogleSheets = async () => {
  try {
    const client = (await auth.getClient()) as JWT;
    const sheets = google.sheets({ version: "v4", auth: client });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID || "";
    const range = "Sheet1!A1";

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [["Test", "Google", "Sheets", "API"]],
      },
    });

    console.log("✅ Successfully wrote to Google Sheet!");
  } catch (error: any) {
    console.error("❌ Google Sheets API Error:", error.message);
  }
};

testGoogleSheets();

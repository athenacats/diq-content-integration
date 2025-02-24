import { google } from "googleapis";
import { JWT } from "google-auth-library";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
  scopes: SCOPES,
});

export const appendToSheet = async (
  spreadsheetId: string,
  range: string,
  values: string[][]
) => {
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
};

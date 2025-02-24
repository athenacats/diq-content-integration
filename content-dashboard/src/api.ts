/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_URL = "http://localhost:4000/api";

export const generateContent = async (data: any) => {
  try {
    const response = await axios.post(
      `${API_URL}/generate-multiple-content`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

export const publishToWordPress = async (
  wordpress: any,
  generatedContent: any,
  contentType: any
) => {
  try {
    const response = await axios.post(`${API_URL}/publish-to-wordpress`, {
      wordpress,
      generatedContent,
      contentType,
    });
    return response.data;
  } catch (error) {
    console.error("Error publishing to WordPress:", error);
    throw error;
  }
};

import axios from "axios";

const API_URL = "http://localhost:4000/api"; // Adjust to your backend URL

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

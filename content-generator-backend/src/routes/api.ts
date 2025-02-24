import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { appendToSheet } from "../utils/sheets"; // Import the helper

dotenv.config();

const router = express.Router();

// Interfaces for request body
interface GenerateMultipleContentRequest {
  keywordName: string;
  url: string;
  generate: string[]; // ["keywordList", "pageTitle", "metaTitle", etc.]
  wordpress?: WordPressCredentials;
}

interface WordPressCredentials {
  url: string;
  username: string;
  appPassword: string;
}

/**
 * Test Route
 */
router.get("/test", (_req: Request, res: Response) => {
  res.json({ message: "API is working! 🚀" });
});

/**
 * Helper function to call OpenAI API
 */
const callOpenAI = async (prompt: string) => {
  const response = await axios.post(
    "https://api.openai.com/v1/completions",
    {
      model: "text-davinci-003", // Replace with 'gpt-4o' when ready
      prompt,
      max_tokens: 1000, // Increased for article sections
      temperature: 0.7,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );
  return response.data.choices[0].text.trim();
};

/**
 * Helper function to generate full article with 4 API calls
 */
const generateFullArticle = async (keywordName: string, url: string) => {
  const articleSections: string[] = [];

  // Prompt 1
  const prompt1 = `<p>{answer why the client should buy it...}`;
  const section1 = await callOpenAI(prompt1);
  articleSections.push(section1);

  // Prompt 2
  const prompt2 = `<h2>{[Keywords] name variation}</h2><p>{Aiming EAT guidelines...}`;
  const section2 = await callOpenAI(prompt2);
  articleSections.push(section2);

  // Prompt 3
  const prompt3 = `<h2><b>New [keyword name] {Innovations...</b></h2>`;
  const section3 = await callOpenAI(prompt3);
  articleSections.push(section3);

  // Prompt 4
  const prompt4 = `<h2>What to look for {in/with/etc} [keyword name]</h2>`;
  const section4 = await callOpenAI(prompt4);
  articleSections.push(section4);

  // Combine all sections
  return articleSections.join("\n\n");
};

/**
 * Route: POST /api/generate-multiple-content
 * Description: Generates multiple content types and returns them in a single response
 */
router.post(
  "/generate-multiple-content",
  async (req: Request, res: Response): Promise<any> => {
    const {
      keywordName,
      url,
      generate,
      wordpress,
    }: GenerateMultipleContentRequest = req.body;

    if (!keywordName || !url || !generate || generate.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    try {
      const generatedContent: { [key: string]: string } = {};

      // Process each content type
      for (const contentType of generate) {
        let prompt = "";

        if (contentType === "article") {
          // For articles, trigger 4 API calls and combine
          const fullArticle = await generateFullArticle(keywordName, url);
          generatedContent[contentType] = fullArticle;
        } else {
          // Handle other content types
          switch (contentType) {
            case "keywordList":
              prompt = `Based on: ${keywordName} and ${url}, create a list of top 20 high volume keywords...`;
              break;

            case "pageTitle":
              prompt = `Write a page title starting with "Top" or "Best" for ${keywordName}. Follow SEO best practices.`;
              break;

            case "metaTitle":
              prompt = `Create a meta title for ${keywordName} including high-volume keywords. Max 55 characters.`;
              break;

            case "metaDescription":
              prompt = `Write a meta description for ${keywordName} under 155 characters. Include actionable phrases and keywords naturally.`;
              break;

            default:
              prompt = `Generate content for ${keywordName}`;
          }

          // Call OpenAI API for this prompt
          const content = await callOpenAI(prompt);
          generatedContent[contentType] = content;
        }
      }

      // (Optional) Publish to WordPress if credentials are provided
      if (wordpress) {
        const wpResponse = await axios.post(
          `${wordpress.url}/wp-json/wp/v2/posts`,
          {
            title: generatedContent.pageTitle || keywordName,
            content: generatedContent.article || "",
            status: "publish",
          },
          {
            auth: {
              username: wordpress.username,
              password: wordpress.appPassword,
            },
          }
        );
        generatedContent["wordpressPostId"] = wpResponse.data.id;
      }

      const spreadsheetId = process.env.GOOGLE_SHEET_ID || "";
      const sheetRange = "Sheet1!A1"; // Adjust as needed

      await appendToSheet(spreadsheetId, sheetRange, [
        [
          new Date().toISOString(),
          keywordName,
          url,
          generatedContent.keywordList || "",
          generatedContent.pageTitle || "",
          generatedContent.metaTitle || "",
          generatedContent.metaDescription || "",
          generatedContent.article || "",
          generatedContent.wordpressPostId || "",
        ],
      ]);

      // Return all generated content
      res.json({ success: true, generatedContent });
    } catch (error: any) {
      console.error(
        "Error generating content:",
        error.response?.data || error.message
      );
      res
        .status(500)
        .json({ success: false, error: "Failed to generate content" });
    }
  }
);

export default router;

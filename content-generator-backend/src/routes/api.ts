import express, { Request, Response } from "express";
import OpenAI from "openai";
import axios from "axios";
import dotenv from "dotenv";
import { appendToSheet } from "../utils/sheets"; // Import the helper

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
export const callOpenAI = async (
  prompt: string,
  model: string = "gpt-3.5-turbo",
  maxTokens: number = 200
) => {
  // Check if OPENAI_API_KEY is present
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "mock") {
    console.log("⚠️ Mocking OpenAI API response...");
    return `Mocked response for prompt: "${prompt}"`;
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const generatedText = response.choices[0]?.message?.content?.trim();

    if (!generatedText) {
      throw new Error("No content generated from OpenAI.");
    }
    console.log(generatedText);
    return generatedText;
  } catch (error: any) {
    console.error("OpenAI API Error:", error.response?.data || error.message);
    throw new Error("Failed to generate content");
  }
};

/**
 * Helper function to generate full article with 4 API calls
 */
const generateFullArticle = async (
  keywordName: string,
  url: string,
  model: string,
  keywordList: string,
  urlWiki: string
) => {
  const articleSections: string[] = [];

  // Prompt 1
  const prompt1 = `Rule: No "[]" or "{}" in output.
Rule: Do not use the word "offerings" in the output.
Rule: Do not use the word "needs" in the output.
Rule: DO NOT use ":" in titles, use "-" instead.
Rule: Include proper HTML formatting.
Rule: Write in a readable format with clear paragraphs.
Rule: Do not create lists unless explicitly instructed.

Prompt:

<p>Explain why the client should buy/use ${keywordName} in the first paragraph. Write confidently in a Wikipedia style, naming the segment of clients who would benefit most from this product/service without asking questions. Explain why it's the best choice, providing clear reasons and avoiding generic statements like "it's a good choice."</p>

<p>Write a minimum 350-word paragraph about ${keywordName}, highlighting its unique value proposition. Use at least 5 high-volume keywords relevant to someone looking to buy ${keywordName}. Ensure the text is clickbait but without special characters.</p>

<h2>${keywordName} Top Features</h2>
<ul>
  <li>Feature 1</li>
  <li>Feature 2</li>
  <li>Feature 3</li>
</ul>

<a class="action tocart primary" href="${url}" target="_blank" data-link-type="default" data-element="link" data-pb-style="RQGFH2A" alt="Learn more about ${keywordName} and related products">
  <span data-element="link_text">Learn more about ${keywordName}</span>
</a><br>

<h2>What is ${keywordName}</h2>
<p>Write an informational, direct paragraph about ${keywordName}, referencing ${urlWiki} without mentioning Wikipedia. The href alt tag should explain the link content in under 50 characters. Write a 400-word Wikipedia-style description.</p>

<h3>Different Uses for ${keywordName}</h3>
<ul>
  <li>Use 1</li>
  <li>Use 2</li>
  <li>Use 3</li>
</ul>

<h2>Top ${keywordName}</h2>
<p>Explain the value ${keywordName} provides to different customer segments.</p>

<h2>${keywordName} Benefits</h2>
<p>List the benefits of ${keywordName}. Include a <ul> list highlighting important features for various use cases.</p>
`;
  const section1 = await callOpenAI(prompt1, model, 500);
  articleSections.push(section1);

  // Prompt 2
  const prompt2 = `Rule: no "[]" or "{}" in output;
Do not use "offerings" in output;
Rule: Do not use "needs" in output;
Rule: DO NOT use ":" in titles, use "-" instead;
Rule: Include proper HTML formatting;
Rule: Repeat all <h3> until you have written about every keyword in ${keywordList} list, skipping "other" content
Prompt:
<h2>${keywordList} name variation</h2>
<p>Aiming EAT (Expertise, Authoritativeness, Trustworthiness) guidelines & Google's Natural Language Algorithm without saying that, write an informational paragraph in the style of Wikipedia minimum 200 words. Explain why this ${keywordName} would present benefits to a customer.</p>
(Repeat for all ${keywordList})
<h3>${keywordList} xx (choose a keyword from ${keywordList})</h3>
<p>Write a summary of ${keywordList} xx with minimum 150 characters also describing ${keywordName}.</p>
<h3>${keywordList} xx (choose a keyword from ${keywordList})</h3>
<p>Write a summary of ${keywordList} xx with minimum 150 characters also describing ${keywordName}</p> 
`;
  const section2 = await callOpenAI(prompt2, model, 500);
  articleSections.push(section2);

  // Prompt 3
  const prompt3 = `Rule: no "[]" or "{}" in output;
Do not use "offerings" in output;
Rule: Do not use "needs" in output;
Rule: DO NOT use ":" in titles, use "-" instead;
Rule: Include proper HTML formatting;
Prompt:
<h2><b>New ${keywordName} {Innovations {Use variations of this title and write it different every time but make sure its talking about the ${keywordName} and its category of products/services}</b></h2>
<p>Write a paragraph informational of what new things are happening and changing for ${keywordName} in depth and how its changed and is changing with a <ul> list of changes of at least 3, and what's said to be coming, explaining each technical, informational detail</p> Go into detail on each innovation as an expert.</p>
<h2>{${keywordName} name variation}</h2>
<p>{Aiming EAT (Expertise, Authoritativeness, Trustworthiness) guidelines & Google's Natural Language Algorithm without saying that, write an informational paragraph in the style of Wikipedia minimum 200 words. Explain why this ${keywordName} would present benefits to a customer.}</p>
RULE FOR NEXT PROMPT: {Repeat for all [keywords]}
<h3>${keywordList} (choose a keyword from ${keywordList}</h3>
<p>Write a summary of the keyword you have selected in the h3 title with minimum 150 characters also describing ${keywordName}.</p>
<h3>${keywordList} (choose a keyword from ${keywordList}</h3>
<p>Write a summary of the keyword you have selected in the h3 title with minimum 150 characters also describing ${keywordName}</p>
<h2><b>[keyword name{s}] For Sale</b></h2>
<h3> ${keywordName} {Category}</h3>
<p>summary of ${keywordName} sub category by writing a 50-word paragraph explaining what the product is and whichever other relevant info</p></li> </ul>
<h2>${keywordName} Reviews</h2> <p>Always write an informational 150-word paragraph about ${keywordName} Reviews</p> Write a list of the top type of good reviews this product/service receives and why<ul><li></li></ul>
<h2> Trending ${keywordName} 2024</h2>
<p> Write an informational but direct paragraph what values the ${keywordName} provides and who it benefits the most.</p>
`;
  const section3 = await callOpenAI(prompt3, model, 500);
  articleSections.push(section3);

  // Prompt 4
  const prompt4 = `Rule: no "[]" or "{}" in output;
Do not use "offerings" in output;
Rule: Do not use "needs" in output;
Rule: DO NOT use ":" in titles, use "-" instead;
Rule: Include proper HTML formatting;
Prompt:
<h2> What to look for {in/with/etc} ${keywordName}</h2>
<p> Write an informational but direct paragraph what values the ${keywordName} provides and who it benefits the most. Talk about space, mobility, price, value, features and then add who segment most benefits from this product.</p>
<h2>Top ${keywordName} Financing Options</h2>
<p>Write about what some of the top financed products from this ${keywordName} In one concise paragraph write a wikipedia style paragraph why customers would use financing, as a financing expert give the customer the expert values on why to finance the product and the low rates and saving money by doing so. Do not include financing for non-equipment type products, then talk about larger orders, ordering bulk and the values on sustainability by doing so.</p>
<a class=“action tocart primary” href=“[Finance Link]” target=“_blank” data-link-type=“default” data-element=“link” data-pb-style=“RQGFH2A” alt="[Product name {simplify name to brand and sku} Financing]"><span data-element=“link_text”>Finance ${keywordName} Products</span></a><br>
<h2>${keywordName} FAQ</h2>
<p>{Answer questions about what is a ${keywordName} FAQ in a short informational paragraph always mentioning the with max 100 words} regarding the ${keywordName}, and features based on ${keywordName}</p>
Write questions and answers to the top questions related to the [category] and [Product name] in form of snippet questions and longtail keywords asked with high-volume keywords and phrases written in following format: <h3></h3> <p></p>
`;
  const section4 = await callOpenAI(prompt4, model, 500);
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
    const { keywordName, url, generate }: GenerateMultipleContentRequest =
      req.body;

    if (!keywordName || !url || !generate || generate.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    try {
      const generatedContent: { [key: string]: string } = {};

      let keywordList = "";
      let pageTitle = "";
      let urlWiki = "";

      // Process each content type
      for (const contentType of generate) {
        let prompt = "";
        let model = "gpt-3.5-turbo";
        let maxTokens = 200;

        if (contentType === "article") {
          model = "gpt-4";
          const fullArticle = await generateFullArticle(
            keywordName,
            url,
            model,
            keywordList,
            urlWiki
          );
          generatedContent[contentType] = fullArticle;
        } else {
          // Handle other content types
          switch (contentType) {
            case "keywordList":
              prompt = `Based on: ${keywordName} and ${url}, create a list of top 20 high volume keywords matching the ${keywordName}/${url} separated by line with no numeration, numbers or special characters of the top sub-product categories without any intro's or explanations just the keywords.
Rule: No brackets in output, No titles just the keyword in output, No symbols in output
Format:
No symbols, numbers or brackets in output
`;
              maxTokens = 150;
              break;

            case "pageTitle":
              prompt = `Rules: Avoid using the word "needs";
IMPORTANT: Do not add | Company Name at the end;
No : in output;
No "" in output;
No ' in output;
No ! in output;
no - in output;
No : in output;
Do not mention blog in output;
Do not mention article in output;
Do not include colors in output;
Max 55 characters;
Follow Google Best Practices, do not keyword stuff, exclude how many in packs, and ensure meta titles are no more than 55 characters long.;
do not mention how many in packs;
Prompt:
Write page title starting with top or npbest ${keywordName}. Title could include some keywords from ${keywordList} relevant to the ${keywordName} in natural language, readable. total length of page title must be under 55 characters in total.
Format: {output}
`;
              maxTokens = 20;
              break;

            case "metaTitle":
              prompt = `Rules: Avoid using the word ""needs""; No "" in output; No ' in output; No ! in output;
Max 55 characters;
Do not write meta title in output;
Follow Google Best Practices, avoid the use of a comma in output, do not keyword stuff, and ensure meta titles are no more than 55 characters long;
Use variations to add appeal. Showcase popularity and recognition through Trending Now phrases;
Do not write CTA in output;
Prompt:
The meta title format should be: ${pageTitle}, followed by the most pertinent part of the ${keywordList} with high-volume keywords that provide value based on features making customers want to learn more, with only one sentence. after a "-" or "|" it may include a short CTA like learn, top resource, or other informational CTA keep this highly variable focusing on click through rate of customers.
All structured around customer needs - we aim at higher click-through rates alongside enhanced engagement which aligns with Google's standards while keeping Call-To-Action repetition under 5%."
Meta Title: {output} 
`;
              maxTokens = 30;
              break;

            case "metaDescription":
              prompt = `Rule: No brackets in output
Max 155 characters, shorten if neccessary;
Do not mention company name
Prompt: Write a meta description that incorporate actionable phrases and offer a distinct motivation for potential customers to read the article:${pageTitle}. Maintain a tone that echoes the brand's messaging. Refrain from using an overabundance of capital letters or punctuation that could be interpreted as intrusive or spam-like. Insert pertinent keywords naturally to align with SEO best practices while ensuring that the description is an accurate portrayal of the respective ${pageTitle}.
Format {output}
`;
              maxTokens = 60;
              break;

            case "urlWiki":
              prompt = `Rule: No brackets in output
Rules:
only one href link, nothing else in output;
Do not add title, just the raw link;
Prompt:
write the link to a relevant wikipidea article to be used as an external link
Format: {Output}
`;
              maxTokens = 60;
              break;

            default:
              prompt = `Generate content for ${keywordName}`;
              maxTokens = 100;
          }

          // Call OpenAI API for this prompt
          const content = await callOpenAI(prompt);
          generatedContent[contentType] = content;

          if (contentType === "keywordList") {
            keywordList = content;
          }

          if (contentType === "pageTitle") {
            pageTitle = content;
          }

          if (contentType === "urlWiki") {
            urlWiki = content;
          }
        }
      }

      const spreadsheetId = process.env.GOOGLE_SHEET_ID || "";
      const sheetRange = "Sheet1!A1";

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
          generatedContent.urlWiki || "",
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

router.post(
  "/publish-to-wordpress",
  async (req: Request, res: Response): Promise<any> => {
    const {
      wordpress,
      generatedContent,
      contentType,
    }: {
      wordpress: WordPressCredentials;
      generatedContent: { [key: string]: string };
      contentType: "post" | "page";
    } = req.body;

    if (
      !wordpress ||
      !wordpress.url ||
      !wordpress.username ||
      !wordpress.appPassword
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Missing WordPress credentials" });
    }

    if (!generatedContent || !generatedContent.article) {
      return res
        .status(400)
        .json({ success: false, error: "No content provided for publishing" });
    }

    try {
      // Base64 encode the username and app password
      const auth = Buffer.from(
        `${wordpress.username}:${wordpress.appPassword}`
      ).toString("base64");

      const headers = {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      };

      const wpEndpoint = `${wordpress.url}/wp-json/wp/v2/${
        contentType === "page" ? "pages" : "posts"
      }`;

      const slug =
        generatedContent.pageTitle?.toLowerCase().replace(/\s+/g, "-") ||
        "generated-post";

      // 🔍 Step 1: Check if the post already exists by slug
      const existingContentResponse = await axios.get(
        `${wpEndpoint}?slug=${slug}`,
        { headers }
      );

      const existingPost = existingContentResponse.data[0]; // WordPress returns an array

      let wpResponse;

      if (existingPost) {
        // 🔄 Step 2: Update existing post
        wpResponse = await axios.post(
          `${wpEndpoint}/${existingPost.id}`,
          {
            title: generatedContent.pageTitle || "Updated Post",
            content: generatedContent.article || "",
            status: "publish",
          },
          { headers }
        );
        console.log(`${contentType} updated: ${wpResponse.data.link}`);
      } else {
        // ➕ Step 3: Create new post
        wpResponse = await axios.post(
          wpEndpoint,
          {
            title: generatedContent.pageTitle || "New Post",
            content: generatedContent.article || "",
            slug: slug,
            status: "publish",
          },
          { headers }
        );
        console.log(`${contentType} created: ${wpResponse.data.link}`);
      }

      // ✅ Response back to client
      res.json({
        success: true,
        wordpressPostId: wpResponse.data.id,
        link: wpResponse.data.link,
        message: existingPost
          ? `${
              contentType.charAt(0).toUpperCase() + contentType.slice(1)
            } updated successfully`
          : `${
              contentType.charAt(0).toUpperCase() + contentType.slice(1)
            } created successfully`,
      });
    } catch (error: any) {
      console.error(
        `Error publishing ${contentType} to WordPress:`,
        error.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        error:
          error.response?.data?.message ||
          `Failed to publish ${contentType} to WordPress`,
      });
    }
  }
);

export default router;

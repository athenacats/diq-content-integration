/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { generateContent, publishToWordPress } from "../api";

interface ContentFormProps {
  onContentGenerated: (content: any) => void;
}

const ContentForm: React.FC<ContentFormProps> = ({ onContentGenerated }) => {
  const [keywordName, setKeywordName] = useState("");
  const [url, setUrl] = useState("");
  const [generateTypes, setGenerateTypes] = useState<string[]>([]);
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [contentType, setContentType] = useState<"post" | "page">("post");

  const contentOptions = [
    "keywordList",
    "pageTitle",
    "metaTitle",
    "metaDescription",
    "article",
    "urlWiki",
  ];

  const handleCheckboxChange = (type: string) => {
    setGenerateTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const requestData = {
      keywordName,
      url,
      generate: generateTypes,
      contentType,
    };

    try {
      const result = await generateContent(requestData);
      setGeneratedContent(result.generatedContent);
      onContentGenerated(result.generatedContent);
    } catch (err) {
      console.error("Failed to generate content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToWP = async () => {
    if (!generatedContent) {
      alert("Please generate content first!");
      return;
    }

    if (!wpUrl || !wpUsername || !wpAppPassword) {
      alert("Please fill in WordPress credentials.");
      return;
    }

    setIsPublishing(true);
    setPublishResult(null);

    try {
      const response = await publishToWordPress(
        {
          url: wpUrl,
          username: wpUsername,
          appPassword: wpAppPassword,
        },
        generatedContent,
        contentType
      );

      setPublishResult(`✅ Published! View it here: ${response.link}`);
    } catch (err) {
      console.error("Failed to publish to WordPress:", err);
      setPublishResult("❌ Failed to publish to WordPress.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-black border border-amber-400 rounded shadow-md"
    >
      <h2 className="text-2xl font-semibold mb-4 text-amber-400">
        Generate Content
      </h2>

      <div className="mb-4">
        <label className="block font-semibold text-white">Keyword Name:</label>
        <input
          type="text"
          value={keywordName}
          onChange={(e) => setKeywordName(e.target.value)}
          className="w-full p-2 border border-amber-400 rounded bg-black text-white"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold text-white">URL:</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border border-amber-400 rounded bg-black text-white"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold text-white">
          Select Content to Generate:
        </label>
        {contentOptions.map((type) => (
          <div key={type} className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={generateTypes.includes(type)}
                onChange={() => handleCheckboxChange(type)}
                className="mr-2 accent-amber-400"
              />
              {type}
            </label>
          </div>
        ))}
      </div>

      {/* Content Type Selector (Post or Page) */}
      <div className="mb-4">
        <label className="block font-semibold text-white">Content Type:</label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-white">
            <input
              type="radio"
              value="post"
              checked={contentType === "post"}
              onChange={() => setContentType("post")}
              className="mr-2"
            />
            Post
          </label>

          <label className="flex items-center text-white">
            <input
              type="radio"
              value="page"
              checked={contentType === "page"}
              onChange={() => setContentType("page")}
              className="mr-2"
            />
            Page
          </label>
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-2 text-amber-400">
        WordPress Credentials (Optional):
      </h3>

      <div className="mb-4">
        <label className="block font-semibold text-white">WordPress URL:</label>
        <input
          type="text"
          value={wpUrl}
          onChange={(e) => setWpUrl(e.target.value)}
          className="w-full p-2 border border-amber-400 rounded bg-black text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold text-white">
          WordPress Username:
        </label>
        <input
          type="text"
          value={wpUsername}
          onChange={(e) => setWpUsername(e.target.value)}
          className="w-full p-2 border border-amber-400 rounded bg-black text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">WordPress App Password:</label>
        <input
          type="password"
          value={wpAppPassword}
          onChange={(e) => setWpAppPassword(e.target.value)}
          className="w-full p-2 border border-amber-400 rounded bg-black text-white"
        />
      </div>

      <button
        type="submit"
        className={`w-full py-2 bg-amber-400 text-black font-bold rounded ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Content"}
      </button>

      {/* Publish to WordPress Button */}
      {generatedContent && (
        <button
          type="button"
          onClick={handlePublishToWP}
          className={`w-full mt-4 py-2 bg-green-500 text-white font-bold rounded ${
            isPublishing ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isPublishing}
        >
          {isPublishing ? "Publishing..." : "Publish to WordPress"}
        </button>
      )}

      {/* Display Publish Result */}
      {publishResult && <p className="mt-4 text-white">{publishResult}</p>}
    </form>
  );
};

export default ContentForm;

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { generateContent } from "../api";

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

  const contentOptions = [
    "keywordList",
    "pageTitle",
    "metaTitle",
    "metaDescription",
    "article",
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
      wordpress:
        wpUrl && wpUsername && wpAppPassword
          ? {
              url: wpUrl,
              username: wpUsername,
              appPassword: wpAppPassword,
            }
          : undefined,
    };

    try {
      const result = await generateContent(requestData);
      onContentGenerated(result.generatedContent);
    } catch (err) {
      console.error("Failed to generate content:", err);
    } finally {
      setLoading(false);
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
    </form>
  );
};

export default ContentForm;

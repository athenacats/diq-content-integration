import React, { useState } from "react";
import ContentForm from "./components/ContentForm";
import ContentDisplay from "./components/ContentDisplay";

const App: React.FC = () => {
  const [generatedContent, setGeneratedContent] = useState<{
    [key: string]: string;
  }>({});

  return (
    <div className="min-h-screen bg-black text-white font-playfair p-6">
      <h1 className="text-4xl font-bold text-center mb-6 text-amber-400">
        Content Generator Dashboard
      </h1>
      <div className="max-w-4xl mx-auto space-y-6">
        <ContentForm onContentGenerated={setGeneratedContent} />
        <ContentDisplay content={generatedContent} />
      </div>
    </div>
  );
};

export default App;

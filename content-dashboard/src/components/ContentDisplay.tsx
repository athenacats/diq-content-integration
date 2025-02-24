import React from "react";

interface ContentDisplayProps {
  content: { [key: string]: string };
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content }) => {
  return (
    <div className="mt-6 p-6 bg-black border border-amber-400 rounded shadow-md">
      <h2 className="text-2xl font-bold text-amber-400 mb-4">
        Generated Content
      </h2>

      {Object.keys(content).length === 0 ? (
        <p className="text-white">No content generated yet.</p>
      ) : (
        Object.entries(content).map(([key, value]) => (
          <div key={key} className="mb-6">
            <h3 className="text-lg font-semibold text-amber-400 capitalize">
              {key}
            </h3>
            <textarea
              readOnly
              value={value}
              className="w-full h-40 p-2 border border-amber-400 rounded bg-black text-white"
            />
          </div>
        ))
      )}
    </div>
  );
};

export default ContentDisplay;

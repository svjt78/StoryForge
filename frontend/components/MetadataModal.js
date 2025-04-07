// components/MetadataModal.js
import React from 'react';

export default function MetadataModal({ metadata, setMetadata, onSave, onCancel }) {
  // No title confirmation popup is required now.
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Review & Edit Story Metadata</h2>
        <div className="space-y-3">
          <input  
            type="text"  
            placeholder="Title"  
            value={metadata.title || ""}  
            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}  
            className="w-full p-2 border rounded"  
          />
          <input  
            type="text"  
            placeholder="Genre"  
            value={metadata.genre || ""}  
            onChange={(e) => setMetadata({ ...metadata, genre: e.target.value })}
            className="w-full p-2 border rounded"  
          />
          <input  
            type="text"  
            placeholder="Setting"  
            value={metadata.setting || ""}  
            onChange={(e) => setMetadata({ ...metadata, setting: e.target.value })}  
            className="w-full p-2 border rounded"  
          />
          <input  
            type="text"  
            placeholder="Characters"  
            value={metadata.characters || ""}  
            onChange={(e) => setMetadata({ ...metadata, characters: e.target.value })}  
            className="w-full p-2 border rounded"  
          />
          <input  
            type="text"  
            placeholder="Themes"  
            value={metadata.themes || ""}  
            onChange={(e) => setMetadata({ ...metadata, themes: e.target.value })}  
            className="w-full p-2 border rounded"  
          />
          <textarea  
            placeholder="Additional Details"  
            value={metadata.details || ""}  
            onChange={(e) => setMetadata({ ...metadata, details: e.target.value })}  
            className="w-full p-2 border rounded"  
          />
          <select  
            value={metadata.status || "draft"}  
            onChange={(e) => setMetadata({ ...metadata, status: e.target.value })}
            className="w-full p-2 border rounded"  
          >
            <option value="draft">Draft</option> 
            <option value="completed">Completed</option> 
          </select>
          <input  
            type="text"  
            readOnly  
            value={metadata.timestamp || ""}  
            className="w-full p-2 border rounded bg-gray-100"  
          />
        </div>
        <div className="mt-4 flex justify-end space-x-4">
          <button  
            onClick={onCancel}  
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition transform hover:scale-105 hover:shadow-lg"  
          > 
            Cancel  
          </button>
          <button  
            onClick={onSave}  
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"  
          > 
            Save  
          </button>
        </div>
      </div>
    </div>
  );
}

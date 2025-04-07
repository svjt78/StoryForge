import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import MetadataModal from '../components/MetadataModal';
import CompareModal from '../components/CompareModal';

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [filters, setFilters] = useState({
    genre: '',
    title: '',
    status: '',
    sort_by: 'timestamp',
    order: 'desc'
  });
  const [selectedStory, setSelectedStory] = useState(null);
  const [originalStoryId, setOriginalStoryId] = useState(null); // stores id of original version
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);

  // Version History states
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Compare Modal states
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [oldVersionText, setOldVersionText] = useState("");
  const [latestVersionText, setLatestVersionText] = useState("");

  const bgColors = [
    "bg-indigo-900",
    "bg-purple-900",
    "bg-blue-900",
    "bg-green-900",
    "bg-red-900",
    "bg-yellow-900",
    "bg-pink-900",
    "bg-gray-900"
  ];

  const fetchStories = async () => {
    const params = new URLSearchParams();
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.title) params.append('title', filters.title);
    if (filters.status) params.append('status', filters.status);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.order) params.append('order', filters.order);
    try {
      const res = await fetch(`http://localhost:8000/stories?${params.toString()}`);
      const data = await res.json();
      setStories(data);
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [filters]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  // Fetch version history and store originalStoryId (from version_id === 1)
  const handleVersionHistory = async (story) => {
    console.log("Fetching version history for:", story);
    setSelectedStory(story);
    try {
      const res = await fetch(`http://localhost:8000/version-history?storyId=${story.id}`);
      const data = await res.json();
      console.log("Version history received:", data);
      setVersionHistory(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        const original = data.find(item => item.version_id === 1);
        if (original) {
          setOriginalStoryId(original.id);
        } else {
          setOriginalStoryId(story.id);
        }
      } else {
        setOriginalStoryId(story.id);
      }
    } catch (error) {
      console.error("Error fetching version history:", error);
      alert("Error fetching version history");
    }
    setShowVersionHistoryModal(true);
  };

  const handleEdit = (story) => {
    setShowMetadataModal(false);
    setSelectedStory(story);
    setShowEditPanel(true);
  };

  const handleUpdateStory = async () => {
    if (!selectedStory) return;
    const currentUserId = localStorage.getItem('userId') || "";
    const payload = {
      base_id: Number(selectedStory.id),
      title: selectedStory.title || "",
      genre: selectedStory.genre || "",
      setting: selectedStory.setting || "",
      characters: selectedStory.characters || "",
      themes: selectedStory.themes || "",
      details: selectedStory.details || "",
      status: selectedStory.status || "",
      content: selectedStory.content || "",
      user_id: currentUserId
    };
    console.log("Update payload:", payload);
    try {
      const res = await fetch('http://localhost:8000/update-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Update error:", errorText);
        throw new Error("Failed to update story");
      }
      console.log("Update successful");
      setShowEditPanel(false);
      setShowMetadataModal(false);
      setSelectedStory(null);
      fetchStories();
    } catch (error) {
      console.error("Error in handleUpdateStory:", error);
      alert("Error updating story: " + error.message);
    }
  };

  // Bulk delete: delete all versions in the story group.
  const handleBulkDelete = async (story) => {
    if (!window.confirm("This will delete all versions of your story. Do you want to proceed?")) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/version-history?storyId=${story.id}`);
      const versions = await res.json();
      for (let v of versions) {
        const delRes = await fetch(`http://localhost:8000/delete-version/${v.id}`, { method: 'DELETE' });
        if (!delRes.ok) {
          console.error(`Failed to delete version ${v.id}`);
        }
      }
      fetchStories();
      setShowVersionHistoryModal(false);
    } catch (error) {
      console.error("Error in bulk delete:", error);
      alert("Error deleting versions");
    }
  };

  const handleDeleteClick = (story) => {
    setStoryToDelete(story);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!storyToDelete) return;
    try {
      const res = await fetch(`http://localhost:8000/delete-story/${storyToDelete.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete story");
      alert("Story deleted successfully!");
      setShowDeleteModal(false);
      setStoryToDelete(null);
      fetchStories();
    } catch (error) {
      console.error("Error deleting story:", error);
      alert("Error deleting story");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStoryToDelete(null);
  };

  // Handler for comparing versions.
  const handleCompareVersions = () => {
    if (!selectedVersion) {
      alert("Please select a version");
      return;
    }
    if (!versionHistory || versionHistory.length === 0) {
      alert("No versions available to compare");
      return;
    }
    // Sort versionHistory descending by version_id.
    const sortedVersions = [...versionHistory].sort((a, b) => b.version_id - a.version_id);
    const latestVersion = sortedVersions[0];
    setOldVersionText(selectedVersion.content || "");
    setLatestVersionText(latestVersion.content || "");
    setShowCompareModal(true);
  };

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/StoryGrid.svg')" }}
      >
        <div className="p-4 mt-20">
          <h1 className="text-3xl font-bold text-center mb-4 text-black">Saved Stories</h1>
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            <input
              type="text"
              placeholder="Title"
              value={filters.title}
              onChange={(e) => setFilters({ ...filters, title: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Genre"
              value={filters.genre}
              onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
              className="p-2 border rounded"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="timestamp">Timestamp</option>
              <option value="title">Title</option>
              <option value="genre">Genre</option>
            </select>
            <select
              value={filters.order}
              onChange={(e) => setFilters({ ...filters, order: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button 
              onClick={fetchStories} 
              className="p-2 bg-blue-500 text-white rounded transition transform hover:scale-105 hover:shadow-lg"
            >
              Apply Filters
            </button>
          </div>
          <motion.div
            className="masonry-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex w-auto -ml-4"
              columnClassName="pl-4 bg-clip-padding"
            >
              {stories.map((story, index) => {
                const bgColor = bgColors[index % bgColors.length];
                return (
                  <motion.div
                    key={story.id}
                    variants={itemVariants}
                    style={{ opacity: 0.95 }}
                    className={`relative ${bgColor} text-white rounded shadow p-4 mb-4 cursor-pointer transition transform hover:scale-105 hover:shadow-lg hover:border hover:border-blue-500`}
                  >
                    {/* Bulk delete icon for the masonry */}
                    <div className="absolute top-2 right-2">
                      {story.status.toLowerCase() === "completed" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v1H8V5a2 2 0 012-2z" />
                        </svg>
                      ) : (
                        <button onClick={() => handleBulkDelete(story)} title="This will delete all versions of your story. Do you want to proceed?">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-300 hover:text-red-500 transition transform hover:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v1H8V5a2 2 0 012-2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div onClick={() => handleVersionHistory(story)}>
                      <h2 className="font-bold text-xl mb-2">{story.title}</h2>
                      <p className="text-sm mb-1">Genre: {story.genre}</p>
                      <p className="text-sm mb-1">Status: {story.status}</p>
                      <p className="text-sm mb-1">Created: {story.timestamp}</p>
                      <p className="mt-2">
                        {story.content ? story.content.substring(0, 100) : ''}...
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </Masonry>
          </motion.div>

          {/* Version History Modal as Table */}
          {showVersionHistoryModal && selectedStory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-6xl relative overflow-y-auto max-h-[90vh]">
                <button
                  onClick={() => setShowVersionHistoryModal(false)}
                  className="absolute top-3 right-3 text-2xl font-bold text-gray-700 hover:text-black"
                >
                  &times;
                </button>
                <h2 className="text-xl font-semibold mb-4">Version History</h2>
                <table className="min-w-full border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border px-4 py-2">Select</th>
                      <th className="border px-4 py-2">Name</th>
                      <th className="border px-4 py-2">Genre</th>
                      <th className="border px-4 py-2">User ID</th>
                      <th className="border px-4 py-2">Created</th>
                      <th className="border px-4 py-2">Status</th>
                      <th className="border px-4 py-2">Version</th>
                      <th className="border px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionHistory.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="border px-4 py-2 text-center">
                          No versions available.
                        </td>
                      </tr>
                    ) : (
                      versionHistory.map((version) => {
                        const disableDelete = version.version_id === 1 && versionHistory.length > 1;
                        return (
                          <tr key={`${version.id}-${version.version_id}`} className="hover:bg-gray-100">
                            <td className="border px-4 py-2 text-center">
                              <input
                                type="radio"
                                name="selectedVersion"
                                value={version.id}
                                checked={selectedVersion && selectedVersion.id === version.id}
                                onChange={() => setSelectedVersion(version)}
                              />
                            </td>
                            <td className="border px-4 py-2">{version.title}</td>
                            <td className="border px-4 py-2">{version.genre}</td>
                            <td className="border px-4 py-2">{version.user_id || "N/A"}</td>
                            <td className="border px-4 py-2">{version.timestamp}</td>
                            <td className="border px-4 py-2">{version.status}</td>
                            <td className="border px-4 py-2">{version.version_id}</td>
                            <td className="border px-4 py-2 text-center">
                              {disableDelete ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v1H8V5a2 2 0 012-2z" />
                                </svg>
                              ) : (
                                <button
                                  onClick={async () => {
                                    if (window.confirm("Are you sure you want to delete this version?")) {
                                      try {
                                        const res = await fetch(`http://localhost:8000/delete-version/${version.id}`, { method: 'DELETE' });
                                        if (!res.ok) throw new Error("Failed to delete version");
                                        // Refresh version history using originalStoryId.
                                        const updatedRes = await fetch(`http://localhost:8000/version-history?storyId=${originalStoryId}`);
                                        if (updatedRes.ok) {
                                          const updatedData = await updatedRes.json();
                                          console.log("Updated version history:", updatedData);
                                          if (Array.isArray(updatedData) && updatedData.length === 0) {
                                            setShowVersionHistoryModal(false);
                                            fetchStories();
                                          } else {
                                            setVersionHistory(updatedData);
                                          }
                                        } else {
                                          console.error("Error fetching updated version history");
                                        }
                                      } catch (error) {
                                        console.error("Error deleting version:", error);
                                        alert("Error deleting version");
                                      }
                                    }
                                  }}
                                  title="Delete version"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 hover:text-red-700 transition transform hover:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v1H8V5a2 2 0 012-2z" />
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => {
                      if (!selectedVersion) {
                        alert("Please select a version.");
                        return;
                      }
                      setSelectedStory(selectedVersion);
                      setShowVersionHistoryModal(false);
                      setShowViewModal(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => {
                      setShowVersionHistoryModal(false);
                      setSelectedVersion(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompareVersions}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Compare with latest version
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Modal for Full Story */}
          {showViewModal && selectedStory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-6xl relative overflow-y-auto max-h-[90vh]">
                <button
                  onClick={() => { setShowViewModal(false); setSelectedStory(null); }}
                  className="absolute top-3 right-3 text-2xl font-bold text-gray-700 hover:text-black"
                >
                  &times;
                </button>
                <h2 className="text-xl font-semibold mb-4">Full Story View</h2>
                <input
                  type="text"
                  value={selectedStory.title || ""}
                  onChange={(e) => setSelectedStory({ ...selectedStory, title: e.target.value })}
                  disabled={selectedStory.status.toLowerCase() === "completed"}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Title"
                />
                <textarea
                  value={selectedStory.content || ""}
                  onChange={(e) => setSelectedStory({ ...selectedStory, content: e.target.value })}
                  disabled={selectedStory.status.toLowerCase() === "completed"}
                  className="w-full h-64 p-2 border rounded resize-none"
                />
                <div className="mt-4 flex space-x-4">
                  <button 
                    onClick={() => setShowMetadataModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => {
                      // "Cancel" moves user back to Version History screen.
                      setShowViewModal(false);
                      setShowVersionHistoryModal(true);
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedStory.status.toLowerCase() === "completed") return;
                      alert("Keep Working functionality not implemented yet.");
                    }}
                    disabled={selectedStory.status.toLowerCase() === "completed"}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition transform hover:scale-105 hover:shadow-lg disabled:opacity-50"
                  >
                    Keep Working
                  </button>
                  <button
                    onClick={() => {
                      alert("View and Download functionality is not implemented yet.");
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    View and Download
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedStory(null);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Back to Grid
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inline Editable Panel for Editing */}
          {showEditPanel && selectedStory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
              <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
                <h2 className="text-xl font-semibold mb-4">Edit Story</h2>
                <input
                  type="text"
                  value={selectedStory.title || ""}
                  onChange={(e) =>
                    setSelectedStory({ ...selectedStory, title: e.target.value })
                  }
                  disabled={selectedStory.status.toLowerCase() === "completed"}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Title"
                />
                <textarea
                  value={selectedStory.content || ""}
                  onChange={(e) =>
                    setSelectedStory({ ...selectedStory, content: e.target.value })
                  }
                  disabled={selectedStory.status.toLowerCase() === "completed"}
                  className="w-full h-64 p-2 border rounded resize-none"
                />
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => setShowMetadataModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => {
                      if (selectedStory.status.toLowerCase() === "completed") return;
                      alert("Keep Working functionality not implemented yet.");
                    }}
                    disabled={selectedStory.status.toLowerCase() === "completed"}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition transform hover:scale-105 hover:shadow-lg disabled:opacity-50"
                  >
                    Keep Working
                  </button>
                  <button
                    onClick={() => {
                      setShowEditPanel(false);
                      setSelectedStory(null);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Back to Grid
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Modal */}
          {showMetadataModal && selectedStory && (
            <div className="fixed inset-0" style={{ zIndex: 9999 }}>
              <MetadataModal 
                metadata={selectedStory}
                setMetadata={setSelectedStory}
                onSave={handleUpdateStory}
                onCancel={() => setShowMetadataModal(false)}
              />
            </div>
          )}

          {/* Delete Confirmation Modal for Bulk Delete */}
          {showDeleteModal && storyToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <p className="mb-4 text-gray-700">
                  Are you sure you want to delete the story &quot;{storyToDelete.title}&quot;?
                </p>
                <div className="flex justify-end space-x-4">
                  <button 
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Ok
                  </button>
                  <button 
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Compare Modal */}
          {showCompareModal && (
            <CompareModal
              oldText={oldVersionText}
              newText={latestVersionText}
              onClose={() => {
                setShowCompareModal(false);
                // Return to Version History modal after closing compare.
                setShowVersionHistoryModal(true);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

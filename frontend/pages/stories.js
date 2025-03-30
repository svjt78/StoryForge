// pages/stories.js
import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import MetadataModal from '../components/MetadataModal'; // Reusable metadata modal

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
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);

  // Define an array of deep background color classes
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

    const res = await fetch(`http://localhost:8000/stories?${params.toString()}`);
    const data = await res.json();
    setStories(data);
  };

  useEffect(() => {
    fetchStories();
  }, [filters]);

  // Framer Motion variants for a trendy transition
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Define masonry breakpoints
  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  // When a story grid item is clicked to view the full story, open the view modal.
  const handleViewStory = (story) => {
    setSelectedStory(story);
    setShowViewModal(true);
  };

  // When a story grid item is clicked for editing.
  const handleEdit = (story) => {
    setShowMetadataModal(false); // Ensure metadata modal is closed
    setSelectedStory(story);
    setShowEditPanel(true);
  };

  const handleUpdateStory = async () => {
    if (!selectedStory) return;
    try {
      const res = await fetch('http://localhost:8000/update-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedStory)
      });
      if (!res.ok) throw new Error("Failed to update story");
      // Close inline panel and metadata modal, then refresh grid view.
      setShowEditPanel(false);
      setShowMetadataModal(false);
      setSelectedStory(null);
      fetchStories();
    } catch (error) {
      console.error(error);
      alert("Error updating story");
    }
  };

  // Delete story: open delete modal.
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
      console.error(error);
      alert("Error deleting story");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStoryToDelete(null);
  };

  return (
    <>
      <Navbar />
      {/* Outer container with background image */}
      <div
        className="min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/StoryGrid.svg')" }}
      >
        <div className="p-4 mt-20">
          <h1 className="text-3xl font-bold text-center mb-4 text-white">Saved Stories</h1>
          
          {/* Filtering and Sorting Options */}
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
          
          {/* Masonry Grid with Framer Motion */}
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
                    {/* Delete Icon */}
                    <div 
                      className="absolute top-2 right-2 z-10 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(story);
                      }}
                      title="Delete Story"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-300 hover:text-red-500 transition transform hover:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v1H8V5a2 2 0 012-2z" />
                      </svg>
                    </div>
                    {/* Clicking the masonry item opens the full story view modal */}
                    <div onClick={() => handleViewStory(story)}>
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

          {/* View Modal for Full Story (Big Pop-up Window) */}
          {showViewModal && selectedStory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-6xl relative overflow-y-auto max-h-[90vh]">
                {/* Close (×) icon */}
                <button
                  onClick={() => { setShowViewModal(false); setSelectedStory(null); }}
                  className="absolute top-3 right-3 text-2xl font-bold text-gray-700 hover:text-black"
                >
                  &times;
                </button>
                <h2 className="text-xl font-semibold mb-4">Full Story View</h2>
                <input
                  type="text"
                  value={selectedStory.title}
                  onChange={(e) => setSelectedStory({ ...selectedStory, title: e.target.value })}
                  disabled={selectedStory.status.toLowerCase() === "completed"}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Title"
                />
                <textarea
                  value={selectedStory.content}
                  onChange={(e) => setSelectedStory({ ...selectedStory, content: e.target.value })}
                  disabled={selectedStory.status.toLowerCase() === "completed"}
                  className="w-full h-64 p-2 border rounded resize-none"
                />
                {/* Button row */}
                <div className="mt-4 flex space-x-4">
                  <button 
                    onClick={() => setShowMetadataModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"
                  >
                    Save
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

          {/* Inline Editable Panel for Selected Story (Edit functionality) */}
          {showEditPanel && selectedStory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
              <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
                <h2 className="text-xl font-semibold mb-4">Edit Story</h2>
                <input
                  type="text"
                  value={selectedStory.title}
                  onChange={(e) =>
                    setSelectedStory({ ...selectedStory, title: e.target.value })
                  }
                  disabled={selectedStory.status.toLowerCase() === "completed"}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Title"
                />
                <textarea
                  value={selectedStory.content}
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
                    Save
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

          {/* Reusable Metadata Modal for Editing Story Metadata (renders above pop-up) */}
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

          {/* Delete Confirmation Modal */}
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
        </div>
      </div>
    </>
  );
}

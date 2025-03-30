// pages/new-story.js
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import MetadataModal from '../components/MetadataModal'  // Import the reusable metadata modal

export default function NewStory() {
  // ----------- STATE -----------
  const [formData, setFormData] = useState({
    genre: '',
    setting: '',
    characters: '',
    themes: '',
    details: '',
    authorPreference: '',
    storytellingFramework: '',
    storySize: 1000
  })
  const [story, setStory] = useState('')
  const [storyTitle, setStoryTitle] = useState('') // for generated title
  const [loading, setLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false) // forces two-column layout

  // Toast notification state for "Your Story is Cooking"
  const [showCookingToast, setShowCookingToast] = useState(false)

  // New state for viewing the generated story in a full pop-up modal
  const [showViewModal, setShowViewModal] = useState(false)

  // Collapsible panel state (default: collapsed = true)
  const [collapsed, setCollapsed] = useState(true)

  // NEW STATES FOR ACTIONS
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showEditorModal, setShowEditorModal] = useState(false)
  const [metadata, setMetadata] = useState({
    title: '', // will be pre-populated with storyTitle when story is generated
    genre: formData.genre,
    setting: formData.setting,
    characters: formData.characters,
    themes: formData.themes,
    details: formData.details,
    status: 'draft',
    timestamp: new Date().toLocaleString()
  })
  const [editorContent, setEditorContent] = useState(story)
  const [latestVersion, setLatestVersion] = useState(story)
  const [previousVersion, setPreviousVersion] = useState(story)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const router = useRouter()

  // NEW STATES FOR Q&A FORM
  const [showQAForm, setShowQAForm] = useState(false)
  const [questions, setQuestions] = useState([])
  const [qaResponses, setQaResponses] = useState([])
  const [showWarningModal, setShowWarningModal] = useState(false)

  // Helper function to parse and clean the plain text output.
  // Expected output from the API:
  // Title: <short title here>\n---\n<story narrative here>
  // This function removes extraneous quotes, backslashes, and the delimiter.
  const parsePlainTextOutput = (text) => {
    let processed = text.trim();
    if (processed.startsWith('"') && processed.endsWith('"')) {
      processed = processed.slice(1, -1);
    }
    processed = processed.replace(/\\n/g, "\n");
    processed = processed.replace(/\\"/g, '"');
    const delimiter = "\n---\n";
    const parts = processed.split(delimiter);
    if (parts.length === 2) {
      const titlePart = parts[0].replace(/^Title:\s*/i, '').trim();
      const narrativePart = parts[1].trim();
      return { title: titlePart, narrative: narrativePart };
    }
    return { title: "", narrative: processed };
  };

  // ----------- HANDLERS -----------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle change for the story size slider
  const handleStorySizeChange = (e) => {
    setFormData({ ...formData, storySize: Number(e.target.value) });
  };

  // When "Generate Story" is clicked (initially, before Q&A)
  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send complete formData including new fields and storySize
      const response = await fetch('http://localhost:8000/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.text();
      if (data.trim().startsWith("{") && data.includes("questions")) {
        const jsonData = JSON.parse(data);
        setQuestions(jsonData.questions || []);
        setQaResponses(Array(jsonData.questions.length).fill(''));
        setShowQAForm(true);
      } else {
        const { title, narrative } = parsePlainTextOutput(data);
        setStoryTitle(title);
        setStory(narrative);
        if (!metadata.title || metadata.title === "Untitled Story") {
          setMetadata(prev => ({ ...prev, title: title }));
        }
      }
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating story:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Q&A response changes.
  const handleQaChange = (index, value) => {
    const updatedResponses = [...qaResponses];
    updatedResponses[index] = value;
    setQaResponses(updatedResponses);
  };

  // When user clicks "Submit" on Q&A form.
  const handleSubmitQA = async () => {
    const hasBlanks = qaResponses.some((res) => res.trim() === '');
    if (hasBlanks) {
      setShowWarningModal(true);
      return;
    }
    await generateFinalStory();
  };

  // Warning modal "Ok" button.
  const handleWarningOk = async () => {
    setShowWarningModal(false);
    await generateFinalStory();
  };

  // Warning modal "Back" button.
  const handleWarningBack = () => {
    setShowWarningModal(false);
  };

  // Handler for "View" button to open full pop-up window
  const handleViewStory = () => {
    setShowViewModal(true);
  };

  // Combine Q&A responses with initial details and call API.
  const generateFinalStory = async () => {
    setLoading(true);
    // Show the non-blocking toast notification "Your Story is Cooking"
    setShowCookingToast(true);
    // Auto-dismiss the toast after 12 seconds (or when story is generated)
    setTimeout(() => setShowCookingToast(false), 12000);
    
    const combinedResponses = qaResponses.join(" | ");
    const finalPayload = {
      genre: formData.genre,
      setting: formData.setting,
      characters: formData.characters,
      themes: formData.themes,
      details: formData.details,
      authorPreference: formData.authorPreference,
      storytellingFramework: formData.storytellingFramework,
      storySize: formData.storySize,
      clarifying_responses: combinedResponses,
      additional_details: formData.details + " Clarifying Responses: " + combinedResponses,
    };
    console.log("Final Payload:", finalPayload);
    try {
      const response = await fetch('http://localhost:8000/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });
      const data = await response.text();
      const { title, narrative } = parsePlainTextOutput(data);
      setStoryTitle(title);
      setStory(narrative);
      if (!metadata.title || metadata.title === "Untitled Story") {
        setMetadata(prev => ({ ...prev, title: title }));
      }
      setShowQAForm(false);
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating final story:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset Q&A responses.
  const handleCancelQA = () => {
    setQaResponses(Array(questions.length).fill(''));
  };

  // Toggle collapsible panel.
  const togglePanel = () => {
    setCollapsed(!collapsed);
  };

  // NEW ACTION HANDLER for Save modal.
  const handleSaveStory = () => {
    setMetadata({
      title: metadata.title || storyTitle,
      genre: formData.genre,
      setting: formData.setting,
      characters: formData.characters,
      themes: formData.themes,
      details: formData.details,
      status: 'draft',
      timestamp: new Date().toLocaleString()
    });
    setShowSaveModal(true);
  };

  // Open rich text editor modal.
  const handleKeepWorking = () => {
    setShowEditorModal(true);
  };

  // Navigate to Story Grid page.
  const handleBackToGrid = () => {
    if (unsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
      return;
    }
    router.push('/stories');
  };

  // New "Cancel" button in final story view.
  const handleFinalCancel = () => {
    setStory('');
    setStoryTitle('');
    setHasGenerated(false);
  };

  // Handle editor changes.
  const handleEditorChange = (e) => {
    setEditorContent(e.target.value);
    setUnsavedChanges(true);
  };

  // Close editor modal.
  const closeEditorModal = () => {
    if (unsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to close the editor?")) {
      return;
    }
    setShowEditorModal(false);
  };

  // Save metadata (persist story).
  const handleMetadataSave = async () => {
    const payload = {
      title: metadata.title,
      genre: metadata.genre,
      setting: metadata.setting,
      characters: metadata.characters,
      themes: metadata.themes,
      details: metadata.details,
      status: metadata.status,
      timestamp: metadata.timestamp,
      content: story
    };
    try {
      const res = await fetch('http://localhost:8000/save-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Failed to save story');
      }
      await res.json();
      alert("Story saved successfully!");
      setShowSaveModal(false);
    } catch (error) {
      console.error(error);
      alert("Error saving story");
    }
  };

  // Auto-save for editor modal.
  useEffect(() => {
    let interval;
    if (showEditorModal) {
      interval = setInterval(() => {
        setPreviousVersion(latestVersion);
        setLatestVersion(editorContent);
        setUnsavedChanges(false);
        console.log("Auto-saved content:", editorContent);
      }, 20000);
    }
    return () => clearInterval(interval);
  }, [showEditorModal, editorContent, latestVersion]);

  // Sync editor content when story changes.
  useEffect(() => {
    setEditorContent(story);
    setLatestVersion(story);
    setPreviousVersion(story);
  }, [story]);

  return (
    <>
      <Head>
        <title>New Story - AI Story Generator</title>
        <meta name="description" content="Generate immersive AI-powered stories with live social features." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Navbar />
      {/* Toast Notification for "Your Story is Cooking" */}
      {showCookingToast && (
        <div 
          className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg cursor-pointer z-50"
          onClick={() => setShowCookingToast(false)}
        >
          Your Story is Cooking
        </div>
      )}
      {/* Force two-column layout if story is generated or Q&A is active */}
      <div className="pt-[80px]">
        <main className={`grid min-h-screen transition-all duration-300 ${hasGenerated || showQAForm ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
          <section className="relative bg-cover bg-center flex flex-col items-center justify-center h-screen p-4" style={{ backgroundImage: "url('/StoryForge.svg')" }}>
            <div className="absolute inset-0 bg-[#147525] opacity-20"></div>
            <div className="relative z-10 w-full max-w-2xl text-white text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif tracking-wide mb-4">STORY FORGE</h1>
              <p className="text-lg md:text-xl leading-relaxed mb-6">Craft immersive stories like a blacksmith forging a sword.</p>
              <div className="flex flex-col items-center cursor-pointer mb-4" onClick={togglePanel}>
                <h2 className="text-xl font-semibold">Create Your Story</h2>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </div>
              {!collapsed && (
                <div className="bg-white rounded-lg p-4 shadow-lg text-gray-900 space-y-3">
                  <form onSubmit={handleGenerateQuestions}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">Genre</label>
                      <input 
                        type="text" 
                        name="genre" 
                        value={formData.genre} 
                        onChange={handleChange} 
                        placeholder="Fantasy, Sci-Fi..." 
                        className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">Setting</label>
                      <input 
                        type="text" 
                        name="setting" 
                        value={formData.setting} 
                        onChange={handleChange} 
                        placeholder="Ancient kingdom, futuristic city..." 
                        className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">Characters</label>
                      <input 
                        type="text" 
                        name="characters" 
                        value={formData.characters} 
                        onChange={handleChange} 
                        placeholder="Knight, wizard, AI robot..." 
                        className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">Themes</label>
                      <input 
                        type="text" 
                        name="themes" 
                        value={formData.themes} 
                        onChange={handleChange} 
                        placeholder="Friendship, betrayal..." 
                        className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" 
                      />
                    </div>
                    {/* New Field: Author Preference */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Any author to mimic or stylistic preference
                      </label>
                      <input
                        type="text"
                        name="authorPreference"
                        value={formData.authorPreference}
                        onChange={handleChange}
                        placeholder="e.g., Ernest Hemingway, Jane Austen, Pirate's style..."
                        className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600"
                      />
                    </div>
                    {/* New Field: Storytelling Framework */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Any storytelling framework
                      </label>
                      <select
                        name="storytellingFramework"
                        value={formData.storytellingFramework}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600"
                      >
                        <option value="">Select Framework</option>
                        <option value="Hero’s Journey">Hero’s Journey</option>
                        <option value="Three-Act Structure">Three-Act Structure</option>
                        <option value="Save the Cat Beat Sheet">Save the Cat Beat Sheet</option>
                        <option value="Snowflake Method">Snowflake Method</option>
                        <option value="Pixar Pitch">Pixar Pitch</option>
                        <option value="7-Point Story Structure">7-Point Story Structure</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">Additional Details</label>
                      <textarea 
                        name="details" 
                        value={formData.details} 
                        onChange={handleChange} 
                        rows={2} 
                        placeholder="Any extra plot points..." 
                        className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" 
                      />
                    </div>
                    {/* New Field: Story Size Slider */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Story Size (words): {formData.storySize}
                      </label>
                      <input 
                        type="range" 
                        name="storySize" 
                        min="50" 
                        max="4000" 
                        value={formData.storySize} 
                        onChange={handleStorySizeChange}
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 mt-2 bg-black text-white rounded-full hover:bg-gray-900 transition transform hover:scale-105 hover:shadow-lg">
                      {loading ? 'Generating...' : 'Generate Story'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </section>

          {/* Right-hand section: Q&A form or Final Story */}
          {showQAForm ? (
            <section className="bg-white flex flex-col justify-start items-start p-4">
              <h3 className="text-xl font-semibold mb-4 text-green-700">Generated Story</h3>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-gray-700">{question}</label>
                    <textarea
                      value={qaResponses[index]}
                      onChange={(e) => handleQaChange(index, e.target.value)}
                      className="w-full p-2 border rounded focus:border-green-600 focus:ring-green-600"
                      rows={2}
                      placeholder="Your answer..."
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={handleSubmitQA}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"
                >
                  Submit
                </button>
                <button
                  onClick={handleCancelQA}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition transform hover:scale-105 hover:shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : (
            story && (
              <section className="bg-white flex flex-col justify-start items-start p-4">
                <div className="bg-gray-100 rounded-lg shadow-lg max-w-2xl h-[80vh] flex flex-col">
                  {/* Sticky header */}
                  <div className="sticky top-0 bg-gray-100 px-4 py-2 border-b z-10">
                    <h3 className="text-xl font-semibold text-green-700">Generated Story</h3>
                  </div>
                  {/* Scrollable story content */}
                  <div className="p-4 overflow-y-auto flex-1">
                    <p className="text-gray-800 whitespace-pre-wrap">{story}</p>
                  </div>
                  {/* Button row */}
                  <div className="mt-4 flex space-x-4 px-4 pb-4">
                    {/* New "View" Button */}
                    <button 
                      onClick={handleViewStory} 
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition transform hover:scale-105 hover:shadow-lg"
                    >
                      View
                    </button>
                    <button 
                      onClick={handleSaveStory} 
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"
                    >
                      Save
                    </button>
                    <button 
                      onClick={handleKeepWorking} 
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition transform hover:scale-105 hover:shadow-lg"
                    >
                      Keep Working
                    </button>
                    <button 
                      onClick={handleBackToGrid} 
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition transform hover:scale-105 hover:shadow-lg"
                    >
                      Back to Grid
                    </button>
                    <button 
                      onClick={handleFinalCancel} 
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition transform hover:scale-105 hover:shadow-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </section>
            )
          )}
        </main>

        {/* Warning Modal for unanswered Q&A */}
        {showWarningModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <p className="mb-4 text-gray-700">
                I will assume for unanswered questions and generate the story. Is that ok?
              </p>
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={handleWarningOk}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"
                >
                  Ok
                </button>
                <button 
                  onClick={handleWarningBack}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition transform hover:scale-105 hover:shadow-lg"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal for the Generated Story */}
        {showViewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl relative overflow-y-auto max-h-[90vh]">
              {/* Close (X) icon */}
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-3 right-3 text-2xl font-bold text-gray-700 hover:text-black"
              >
                &times;
              </button>
              <h2 className="text-xl font-semibold mb-4">Full Story View</h2>
              <p className="text-gray-800 whitespace-pre-wrap">{story}</p>
            </div>
          </div>
        )}

        {/* Use the reusable MetadataModal component */}
        {showSaveModal && (
          <MetadataModal 
            metadata={metadata} 
            setMetadata={setMetadata} 
            onSave={handleMetadataSave} 
            onCancel={() => setShowSaveModal(false)} 
          />
        )}

        {/* Editor Modal */}
        {showEditorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
              <h2 className="text-xl font-semibold mb-4">Edit Your Story</h2>
              <textarea 
                value={editorContent} 
                onChange={handleEditorChange} 
                className="w-full h-64 p-2 border rounded resize-none" 
              />
              <div className="mt-2 text-sm text-gray-600">
                <p><strong>Latest Version:</strong> {latestVersion.substring(0, 50)}...</p>
                <p><strong>Previous Version:</strong> {previousVersion.substring(0, 50)}...</p>
              </div>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={closeEditorModal} 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg"
                >
                  Close Editor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

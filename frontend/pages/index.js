import Head from 'next/head'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Home() {
  // ----------- STATE -----------
  const [formData, setFormData] = useState({
    genre: '',
    setting: '',
    characters: '',
    themes: '',
    details: ''
  })
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(false)

  // Collapsible panel state (default: collapsed = true)
  const [collapsed, setCollapsed] = useState(true)

  // NEW STATES FOR ACTIONS
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showEditorModal, setShowEditorModal] = useState(false)
  const [metadata, setMetadata] = useState({
    title: '',
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

  // ----------- HANDLERS -----------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      setStory(data.story)
    } catch (error) {
      console.error('Error generating story:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle collapsible form
  const togglePanel = () => {
    setCollapsed(!collapsed)
  }

  // NEW ACTION HANDLERS

  // Open modal for metadata review/edit before saving
  const handleSaveStory = () => {
    setMetadata({
      title: '',
      genre: formData.genre,
      setting: formData.setting,
      characters: formData.characters,
      themes: formData.themes,
      details: formData.details,
      status: 'draft',
      timestamp: new Date().toLocaleString()
    })
    setShowSaveModal(true)
  }

  // Open rich text editor modal
  const handleKeepWorking = () => {
    setShowEditorModal(true)
  }

  // Navigate to the story list (grid) page
  const handleBackToGrid = () => {
    if (unsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
      return
    }
    router.push('/stories')
  }

  // Handler for rich text editor changes
  const handleEditorChange = (e) => {
    setEditorContent(e.target.value)
    setUnsavedChanges(true)
  }

  // Close the editor modal with a prompt if there are unsaved changes
  const closeEditorModal = () => {
    if (unsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to close the editor?")) {
      return
    }
    setShowEditorModal(false)
  }

  // Save metadata and call the API to persist the story in the database
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
      const data = await res.json();
      alert("Story saved successfully!");
      setShowSaveModal(false);
    } catch (error) {
      console.error(error);
      alert("Error saving story");
    }
  };

  // Auto-save effect for the rich text editor (every 20 seconds)
  useEffect(() => {
    let interval
    if (showEditorModal) {
      interval = setInterval(() => {
        setPreviousVersion(latestVersion)
        setLatestVersion(editorContent)
        setUnsavedChanges(false)
        console.log("Auto-saved content:", editorContent)
      }, 20000)
    }
    return () => clearInterval(interval)
  }, [showEditorModal, editorContent, latestVersion])

  // Sync editor content when a new story is generated
  useEffect(() => {
    setEditorContent(story)
    setLatestVersion(story)
    setPreviousVersion(story)
  }, [story])

  return (
    <>
      <Head>
        <title>AI Story Generator</title>
        <meta name="description" content="Generate immersive AI-powered stories with live social features." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* HEADER / NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <img src="/logo-placeholder.png" alt="Logo" className="h-8 w-auto" />
            <span className="font-semibold">ai-artist.io</span>
          </div>
          <nav className="hidden md:flex space-x-6 items-center">
            <a href="#" className="text-gray-700 hover:underline">Our Pricing</a>
            <Link href="/stories" className="text-gray-700 hover:underline">
              View Stories
            </Link>
            <a href="#" className="text-gray-700 hover:underline">Signup</a>
            <button className="ml-4 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition">
              Artist Login
            </button>
          </nav>
          <button className="md:hidden p-2 text-gray-700 hover:text-black">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className={`pt-[80px] grid min-h-screen ${story ? 'md:grid-cols-2' : 'md:grid-cols-1'} transition-all duration-300`}>
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
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Genre</label>
                    <input type="text" name="genre" value={formData.genre} onChange={handleChange} placeholder="Fantasy, Sci-Fi..." className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Setting</label>
                    <input type="text" name="setting" value={formData.setting} onChange={handleChange} placeholder="Ancient kingdom, futuristic city..." className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Characters</label>
                    <input type="text" name="characters" value={formData.characters} onChange={handleChange} placeholder="Knight, wizard, AI robot..." className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Themes</label>
                    <input type="text" name="themes" value={formData.themes} onChange={handleChange} placeholder="Friendship, betrayal..." className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Additional Details</label>
                    <textarea name="details" value={formData.details} onChange={handleChange} rows={2} placeholder="Any extra plot points or styles..." className="mt-1 block w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600" />
                  </div>
                  <button type="submit" className="w-full py-2 mt-2 bg-black text-white rounded-full hover:bg-gray-900 transition">
                    {loading ? 'Generating...' : 'Generate Story'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {story && (
          <section className="bg-white flex flex-col justify-start items-start p-4">
            <div className="bg-gray-100 p-4 rounded-lg shadow-lg max-w-2xl">
              <h3 className="text-xl font-semibold mb-2 text-green-700">Generated Story</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{story}</p>
              <div className="mt-4 flex space-x-4">
                <button onClick={handleSaveStory} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Save Story
                </button>
                <button onClick={handleKeepWorking} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Keep Working
                </button>
                <button onClick={handleBackToGrid} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  Back to Story List
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between">
          <p className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} AI Story App. All rights reserved.</p>
          <div className="flex space-x-4 text-sm text-gray-600">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Review & Edit Story Metadata</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Title" value={metadata.title} onChange={(e) => setMetadata({ ...metadata, title: e.target.value })} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Genre" value={metadata.genre} onChange={(e) => setMetadata({ ...metadata, genre: e.target.value })} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Setting" value={metadata.setting} onChange={(e) => setMetadata({ ...metadata, setting: e.target.value })} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Characters" value={metadata.characters} onChange={(e) => setMetadata({ ...metadata, characters: e.target.value })} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Themes" value={metadata.themes} onChange={(e) => setMetadata({ ...metadata, themes: e.target.value })} className="w-full p-2 border rounded" />
              <textarea placeholder="Additional Details" value={metadata.details} onChange={(e) => setMetadata({ ...metadata, details: e.target.value })} className="w-full p-2 border rounded" />
              <select value={metadata.status} onChange={(e) => setMetadata({ ...metadata, status: e.target.value })} className="w-full p-2 border rounded">
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
              <input type="text" readOnly value={metadata.timestamp} className="w-full p-2 border rounded bg-gray-100" />
            </div>
            <div className="mt-4 flex justify-end space-x-4">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={handleMetadataSave} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">Edit Your Story</h2>
            <textarea value={editorContent} onChange={handleEditorChange} className="w-full h-64 p-2 border rounded resize-none" />
            <div className="mt-2 text-sm text-gray-600">
              <p><strong>Latest Version:</strong> {latestVersion.substring(0, 50)}...</p>
              <p><strong>Previous Version:</strong> {previousVersion.substring(0, 50)}...</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={closeEditorModal} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Close Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

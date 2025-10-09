import React, { useEffect, useState } from "react";

const CLIENT_ID = "4ec42cccf0cb4187941e28ddf7a331f8";   
const REDIRECT_URI = "http://localhost:3000/callback";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";

// destination playlists
const DESTINATION_PLAYLISTS: Record<string, { spotify: string; youtube: string }> = {
  goa: { spotify: "Goa Party Travel Songs", youtube: "Goa Party Songs Playlist" },
  shimla: { spotify: "LoFi Chill Roadtrip", youtube: "Shimla LoFi Chill Songs" },
  rajasthan: { spotify: "Rajasthani Folk Songs", youtube: "Rajasthani Folk Songs Playlist" },
  ladakh: { spotify: "Himalayan Roadtrip Songs", youtube: "Ladakh Roadtrip Songs" },
  kerala: { spotify: "Kerala Travel Vibes", youtube: "Kerala Travel Songs" },
  tajmahal: { spotify: "Romantic Love Travel Songs", youtube: "Taj Mahal Romantic Songs" },
  kolkata: { spotify: "Bengali Travel Songs", youtube: "Kolkata Bengali Songs" },
  varanasi: { spotify: "Indian Classical Devotional", youtube: "Varanasi Ganga Aarti Songs" },
  mumbai: { spotify: "Bollywood Travel Hits", youtube: "Mumbai Bollywood Songs" },
  himachal: { spotify: "Mountain Adventure Songs", youtube: "Himachal Mountain Songs" },
};

interface DestinationPlaylistProps {
  destination: string;
  darkMode?: boolean;
}

export default function DestinationPlaylist({ destination, darkMode = false }: DestinationPlaylistProps) {
  const [token, setToken] = useState<string | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [useYouTube, setUseYouTube] = useState<boolean>(false);

  // Always call hooks at the top level
  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");
    if (!token && hash) {
      token =
        hash
          .substring(1)
          .split("&")
          .find((elem) => elem.startsWith("access_token"))
          ?.split("=")[1] || null;
      if (token) {
        window.localStorage.setItem("token", token);
        setToken(token);
      }
      window.location.hash = "";
    } else {
      setToken(token);
    }
  }, []);

  // 🔹 Fetch Spotify playlist
  const getSpotifyPlaylist = async () => {
    if (!token || !destination) return;
    const query = DESTINATION_PLAYLISTS[destination]?.spotify;
    if (!query) return;
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (data.playlists?.items?.length) {
      setTracks(data.playlists.items);
      setUseYouTube(false);
    } else {
      setUseYouTube(true); // Fallback to YouTube
    }
  };

  const logout = () => {
    setToken(null);
    window.localStorage.removeItem("token");
  };

  // Function to show YouTube playlist directly
  const showYouTubePlaylist = () => {
    setUseYouTube(true);
    setTracks([]); // Clear Spotify tracks
  };

  return (
    <div className={`min-h-[60vh] ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900'} transition-all duration-300`}>
      <div className="container mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-400 mb-4 animate-pulse">
            <span className="text-3xl bg-black bg-clip-text text-transparent">🎶</span>
          </div>
          <h1 className={`text-3xl md:text-4xl font-black mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Your Travel Soundtrack
          </h1>
          <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xl mx-auto`}>
            Discover the perfect playlist for your journey and let music be your travel companion
          </p>
        </div>

        {!destination ? (
          <div className={`max-w-lg mx-auto p-6 rounded-3xl ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/70 border-gray-200'} border backdrop-blur-sm text-center`}>
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No Destination Selected
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Please select a tour to discover curated playlists for your adventure!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Authentication Section */}
            <div className={`max-w-2xl mx-auto p-6 rounded-3xl ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/70 border-gray-200'} border backdrop-blur-sm text-center`}>
              <div className="mb-4">
                <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Ready for {destination.charAt(0).toUpperCase() + destination.slice(1)}?
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Connect with Spotify or YouTube Music to get personalized travel playlists
                </p>
              </div>
              
              {!token ? (
                <div className="space-y-4">
                  <a
                    className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold"
                    href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=playlist-read-private`}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.6 0-.359.24-.66.54-.78 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <span>Connect with Spotify</span>
                  </a>
                  
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>or</div>
                  
                  <button
                    onClick={showYouTubePlaylist}
                    className="inline-flex items-center space-x-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>Listen on YouTube Music</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${darkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'}`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Connected to Spotify</span>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={getSpotifyPlaylist}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold"
                    >
                      🎵 Get Spotify Playlist
                    </button>
                    <button
                      onClick={showYouTubePlaylist}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span>YouTube Music</span>
                    </button>
                    <button
                      onClick={logout}
                      className={`px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold text-lg ${darkMode ? 'bg-red-900/50 hover:bg-red-800/50 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                    >
                      ✕ Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Spotify Playlists Section */}
            {!useYouTube && tracks.length > 0 && (
              <div className="max-w-6xl mx-auto">
                <h3 className={`text-2xl font-bold text-center mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🎵 Curated Spotify Playlists for {destination.charAt(0).toUpperCase() + destination.slice(1)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tracks.map((playlist: any) => (
                    <div 
                      key={playlist.id} 
                      className={`group p-6 rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${darkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50' : 'bg-white/70 border-gray-200 hover:bg-white/90'} border backdrop-blur-sm`}
                    >
                      <div className="relative overflow-hidden rounded-2xl mb-4">
                        <img
                          src={playlist.images[0]?.url}
                          alt={playlist.name}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <h4 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                        {playlist.name}
                      </h4>
                      <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {playlist.description || 'Perfect for your travel adventure'}
                      </p>
                      <a
                        href={playlist.external_urls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-medium transform hover:scale-105 transition-all duration-300"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.6 0-.359.24-.66.54-.78 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        <span>Open in Spotify</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* YouTube Fallback Section */}
            {useYouTube && (
              <div className={`max-w-4xl mx-auto p-8 rounded-3xl ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/70 border-gray-200'} border backdrop-blur-sm`}>
                <div className="text-center mb-6">
                  <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    � YouTube Music for {destination.charAt(0).toUpperCase() + destination.slice(1)}
                  </h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Discover amazing travel music on YouTube Music
                  </p>
                </div>
                <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
                  <iframe
                    width="100%"
                    height="100%"
                    className="rounded-2xl"
                    src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
                      DESTINATION_PLAYLISTS[destination].youtube
                    )}`}
                    title="YouTube playlist"
                    allow="autoplay; encrypted-media"
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

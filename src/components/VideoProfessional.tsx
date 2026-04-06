'use client'

import { useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

interface VideoProfessionalProps {
  url: string
  className?: string
}

export default function VideoProfessional({ url, className = "" }: VideoProfessionalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const isHls = url?.includes('.m3u8')
  const [videoError, setVideoError] = useState<string | null>(null)

  const togglePlay = () => {
    if (videoRef.current && !videoError) {
      if (isPlaying) videoRef.current.pause()
      else {
        videoRef.current.play().catch(err => {
          console.error("Video play error:", err)
          setVideoError("Playback failed or unsupported format")
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(p)
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration
      videoRef.current.currentTime = time
      setProgress(parseFloat(e.target.value))
    }
  }

  const handleVideoError = () => {
    if (url) {
       setVideoError("This video format is not supported or source is missing.")
    }
  }

  // Determine if it's an embeddable platform
  const isYouTube = url?.includes('youtube.com') || url?.includes('youtu.be')
  const isVimeo = url?.includes('vimeo.com')

  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center aspect-video rounded-xl bg-white/5 border border-dashed border-white/10 text-slate-500 ${className}`}>
        <span className="text-xs font-black uppercase tracking-widest">No Video Preview</span>
      </div>
    )
  }

  if (isYouTube) {
    const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop()
    return (
      <div className={`relative aspect-video rounded-xl overflow-hidden bg-black ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    )
  }

  if (isVimeo) {
    const videoId = url.split('/').pop()
    return (
      <div className={`relative aspect-video rounded-xl overflow-hidden bg-black ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
        />
      </div>
    )
  }

  // Standard Video Player for MP4 and HLS (native)
  return (
    <div ref={containerRef} className={`relative group aspect-video rounded-xl overflow-hidden bg-black/90 border border-white/10 ${className}`}>
      {videoError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
           <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-3">
              <span className="text-xl">!</span>
           </div>
           <p className="text-[10px] font-black uppercase text-red-500/80 tracking-widest mb-1">Playback Error</p>
           <p className="text-xs text-slate-400 max-w-[200px]">{videoError}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={url}
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
            onError={handleVideoError}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          />
          
          {/* Controls Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex flex-col gap-2">
              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleProgressChange}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF7A00]"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={togglePlay} className="text-white hover:text-[#FF7A00] transition-colors">
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                  <button onClick={toggleMute} className="text-white hover:text-[#FF7A00] transition-colors">
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  {isHls && <span className="text-[10px] font-black bg-[#FF7A00] text-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,122,0,0.5)]">HLS LIVE</span>}
                  <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white hover:text-[#FF7A00] transition-colors">
                    <Maximize size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Play Center Overlay */}
          {!isPlaying && (
            <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer group-hover:bg-black/30 transition-all">
              <div className="w-16 h-16 rounded-full bg-[#FF7A00]/20 flex items-center justify-center border border-[#FF7A00]/50 backdrop-blur-md">
                <Play size={32} fill="#FF7A00" className="text-[#FF7A00] ml-1" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

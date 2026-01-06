'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useFeatureAccess'
import { canAccessFeature } from '@/lib/feature-gate'
import { Palette, Eraser, Download, Users } from 'lucide-react'

interface Point {
  x: number
  y: number
}

interface DrawingData {
  id: string
  user_id: string
  canvas_id: string
  points: Point[]
  color: string
  brush_size: number
  created_at: string
}

interface CollaborativeCanvasProps {
  sessionId: string
  onClose: () => void
}

export default function CollaborativeCanvas({ sessionId, onClose }: CollaborativeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(2)
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [isEraser, setIsEraser] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])
  const user = useUser()

  const canUseCanvas = canAccessFeature(user, 'collaborative_canvas')

  useEffect(() => {
    if (!canUseCanvas) return

    // Subscribe to canvas updates
    const channel = supabase
      .channel(`canvas-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'canvas_drawings',
        filter: `canvas_id=eq.${sessionId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          drawRemotePath(payload.new as DrawingData)
        }
      })
      .subscribe()

    // Load existing drawings
    loadCanvasData()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, canUseCanvas])

  const loadCanvasData = async () => {
    const { data } = await (supabase as any)
      .from('canvas_drawings')
      .select('*')
      .eq('canvas_id', sessionId)
      .order('created_at', { ascending: true })

    if (data) {
      data.forEach((drawing: DrawingData) => drawRemotePath(drawing))
    }
  }

  const drawRemotePath = (drawing: DrawingData) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = drawing.color
    ctx.lineWidth = drawing.brush_size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (drawing.points.length > 1) {
      ctx.beginPath()
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
      }
      ctx.stroke()
    }
  }

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canUseCanvas || !user) return

    const point = getCanvasCoordinates(e)
    setCurrentPath([point])
    setIsDrawing(true)
  }, [canUseCanvas, user])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canUseCanvas) return

    const point = getCanvasCoordinates(e)
    setCurrentPath(prev => [...prev, point])

    // Draw locally
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = isEraser ? '#ffffff' : color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (currentPath.length > 1) {
      ctx.beginPath()
      ctx.moveTo(currentPath[currentPath.length - 2].x, currentPath[currentPath.length - 2].y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
    }
  }, [isDrawing, currentPath, color, brushSize, isEraser, canUseCanvas])

  const stopDrawing = useCallback(async () => {
    if (!isDrawing || !canUseCanvas || !user || currentPath.length === 0) return

    setIsDrawing(false)

    // Save drawing to database
    await (supabase as any).from('canvas_drawings').insert({
      user_id: user.id,
      canvas_id: sessionId,
      points: currentPath,
      color: isEraser ? '#ffffff' : color,
      brush_size: brushSize
    })

    setCurrentPath([])
  }, [isDrawing, currentPath, color, brushSize, isEraser, sessionId, user, canUseCanvas])

  const clearCanvas = async () => {
    if (!canUseCanvas || !user) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Clear from database
    await (supabase as any)
      .from('canvas_drawings')
      .delete()
      .eq('canvas_id', sessionId)
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `canvas-${sessionId}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  if (!canUseCanvas) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Premium Feature</h3>
          <p className="text-gray-600 mb-4">
            Collaborative Canvas is available for premium users only.
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Close</button>
            <button onClick={() => {/* Open pricing modal */}} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">Upgrade</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <span className="font-semibold">Collaborative Canvas</span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{participants.length} participants</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadCanvas} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center gap-1">
              <Download className="w-4 h-4" />
              Download
            </button>
            <button onClick={clearCanvas} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center gap-1">
              <Eraser className="w-4 h-4" />
              Clear
            </button>
            <button onClick={onClose} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">Close</button>
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Color:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Size:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-500">{brushSize}px</span>
            </div>
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${isEraser ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
            >
              <Eraser className="w-4 h-4" />
              Eraser
            </button>
          </div>

          <div className="flex-1 border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
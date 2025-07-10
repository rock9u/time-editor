'use client'

import type React from 'react'

import { useState, useRef } from 'react'
import { Plus, Play, Pause, Trash2, Clock, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface TimePoint {
  id: string
  time: number // in seconds
  title: string
  description: string
  color: string
}

interface TimelineSettings {
  duration: number // total duration in seconds
  interval: number // interval between major marks in seconds
  unit: 'seconds' | 'minutes' | 'hours'
}

const colors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

export default function TimeEditor() {
  const [timePoints, setTimePoints] = useState<TimePoint[]>([
    {
      id: '1',
      time: 30,
      title: 'Introduction',
      description: 'Opening sequence and title card',
      color: '#3b82f6',
    },
    {
      id: '2',
      time: 120,
      title: 'Main Content',
      description: 'Core presentation material',
      color: '#22c55e',
    },
    {
      id: '3',
      time: 240,
      title: 'Conclusion',
      description: 'Wrap up and call to action',
      color: '#ec4899',
    },
  ])

  const [settings, setSettings] = useState<TimelineSettings>({
    duration: 300, // 5 minutes
    interval: 30, // 30 seconds
    unit: 'seconds',
  })

  const [selectedPoint, setSelectedPoint] = useState<TimePoint | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime] = useState(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimelineClick = (event: React.MouseEvent) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const percentage = x / rect.width
    const time = Math.round(percentage * settings.duration)

    if (time >= 0 && time <= settings.duration) {
      const newPoint: TimePoint = {
        id: Date.now().toString(),
        time,
        title: `Point ${timePoints.length + 1}`,
        description: '',
        color: colors[timePoints.length % colors.length],
      }
      setTimePoints([...timePoints, newPoint].sort((a, b) => a.time - b.time))
      setSelectedPoint(newPoint)
    }
  }

  const updateTimePoint = (id: string, updates: Partial<TimePoint>) => {
    setTimePoints(points =>
      points.map(point => (point.id === id ? { ...point, ...updates } : point))
    )
    if (selectedPoint?.id === id) {
      setSelectedPoint({ ...selectedPoint, ...updates })
    }
  }

  const deleteTimePoint = (id: string) => {
    setTimePoints(points => points.filter(point => point.id !== id))
    if (selectedPoint?.id === id) {
      setSelectedPoint(null)
    }
  }

  const generateTimeMarks = () => {
    const marks = []
    for (let i = 0; i <= settings.duration; i += settings.interval) {
      marks.push(i)
    }
    return marks
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timeline Editor</h1>
          <p className="text-muted-foreground">
            Total Duration: {formatTime(settings.duration)} •{' '}
            {timePoints.length} timepoints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      </div>

      {/* Timeline Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Timeline Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              value={settings.duration}
              onChange={e =>
                setSettings({
                  ...settings,
                  duration: Math.max(1, Number.parseInt(e.target.value) || 1),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="interval">Interval (seconds)</Label>
            <Input
              id="interval"
              type="number"
              value={settings.interval}
              onChange={e =>
                setSettings({
                  ...settings,
                  interval: Math.max(1, Number.parseInt(e.target.value) || 1),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="unit">Display Unit</Label>
            <Select
              value={settings.unit}
              onValueChange={(value: 'seconds' | 'minutes' | 'hours') =>
                setSettings({ ...settings, unit: value })
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seconds">Seconds</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeline
            <Badge variant="secondary" className="ml-auto">
              Click to add timepoint
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Time markers */}
            <div className="relative h-8">
              {generateTimeMarks().map(mark => (
                <div
                  key={mark}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${(mark / settings.duration) * 100}%` }}>
                  <div className="w-px h-4 bg-border" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTime(mark)}
                  </span>
                </div>
              ))}
            </div>

            {/* Timeline track */}
            <div
              ref={timelineRef}
              className="relative h-16 bg-muted rounded-lg cursor-pointer border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
              onClick={handleTimelineClick}>
              {/* Progress indicator */}
              {isPlaying && (
                <div
                  className="absolute top-0 w-0.5 h-full bg-primary z-10"
                  style={{
                    left: `${(currentTime / settings.duration) * 100}%`,
                  }}
                />
              )}

              {/* Timepoints */}
              {timePoints.map(point => (
                <div
                  key={point.id}
                  className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${(point.time / settings.duration) * 100}%` }}
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedPoint(point)
                  }}>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-lg group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: point.color }}
                  />
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg border">
                      {point.title} - {formatTime(point.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline info */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0:00</span>
              <span>{formatTime(settings.duration)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timepoints List & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timepoints List */}
        <Card>
          <CardHeader>
            <CardTitle>Timepoints ({timePoints.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timePoints.map(point => (
                <div
                  key={point.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPoint?.id === point.id
                      ? 'bg-accent border-accent-foreground/20'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedPoint(point)}>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: point.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{point.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(point.time)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      deleteTimePoint(point.id)
                    }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {timePoints.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No timepoints yet</p>
                  <p className="text-sm">Click on the timeline to add one</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timepoint Editor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedPoint ? 'Edit Timepoint' : 'Select a Timepoint'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPoint ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={selectedPoint.title}
                    onChange={e =>
                      updateTimePoint(selectedPoint.id, {
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="time">Time (seconds)</Label>
                  <Input
                    id="time"
                    type="number"
                    min="0"
                    max={settings.duration}
                    value={selectedPoint.time}
                    onChange={e =>
                      updateTimePoint(selectedPoint.id, {
                        time: Math.max(
                          0,
                          Math.min(
                            settings.duration,
                            Number.parseInt(e.target.value) || 0
                          )
                        ),
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={selectedPoint.description}
                    onChange={e =>
                      updateTimePoint(selectedPoint.id, {
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedPoint.color === color
                            ? 'border-foreground'
                            : 'border-muted'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          updateTimePoint(selectedPoint.id, { color })
                        }
                      />
                    ))}
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => deleteTimePoint(selectedPoint.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Timepoint
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a timepoint to edit</p>
                <p className="text-sm">
                  Or click on the timeline to create a new one
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

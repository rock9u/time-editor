import React, { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import type { TimelineInterval } from '../../types/timeline'
import { formatTimestamp } from '../../lib/timeline-utils'

interface IntervalEditDialogProps {
  interval: TimelineInterval | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<TimelineInterval>) => void
}

export function IntervalEditDialog({
  interval,
  isOpen,
  onClose,
  onSave,
}: IntervalEditDialogProps) {
  const [formData, setFormData] = useState<{
    label: string
    description: string
    color: string
    tags: string
    startDate: string
    startTime: string
    endDate: string
    endTime: string
  }>({
    label: '',
    description: '',
    color: '#3B82F6',
    tags: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  })

  // Update form data when interval changes
  useEffect(() => {
    if (interval) {
      const startDateTime = DateTime.fromMillis(interval.startTime)
      const endDateTime = DateTime.fromMillis(interval.endTime)

      setFormData({
        label: interval.metadata?.label || '',
        description: interval.metadata?.description || '',
        color: interval.metadata?.color || '#3B82F6',
        tags: interval.metadata?.tags?.join(', ') || '',
        startDate: startDateTime.toFormat('yyyy-MM-dd'),
        startTime: startDateTime.toFormat('HH:mm'),
        endDate: endDateTime.toFormat('yyyy-MM-dd'),
        endTime: endDateTime.toFormat('HH:mm'),
      })
    }
  }, [interval])

  const handleSave = () => {
    if (!interval) return

    try {
      // Parse dates and times
      const startDateTime = DateTime.fromFormat(
        `${formData.startDate} ${formData.startTime}`,
        'yyyy-MM-dd HH:mm'
      )
      const endDateTime = DateTime.fromFormat(
        `${formData.endDate} ${formData.endTime}`,
        'yyyy-MM-dd HH:mm'
      )

      if (!startDateTime.isValid || !endDateTime.isValid) {
        alert('Please enter valid dates and times')
        return
      }

      if (startDateTime >= endDateTime) {
        alert('End time must be after start time')
        return
      }

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const updates: Partial<TimelineInterval> = {
        startTime: startDateTime.toMillis(),
        endTime: endDateTime.toMillis(),
        metadata: {
          label: formData.label,
          description: formData.description,
          color: formData.color,
          tags,
        },
      }

      onSave(interval.id, updates)
      onClose()
    } catch (error) {
      console.error('Error saving interval:', error)
      alert('Error saving interval. Please check your input.')
    }
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen || !interval) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Interval</h2>

        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={e =>
                setFormData(prev => ({ ...prev, label: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter interval label"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter description"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={e =>
                  setFormData(prev => ({ ...prev, color: e.target.value }))
                }
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={e =>
                  setFormData(prev => ({ ...prev, color: e.target.value }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={e =>
                setFormData(prev => ({ ...prev, tags: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          {/* Start Date/Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={e =>
                  setFormData(prev => ({ ...prev, startTime: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* End Date/Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={e =>
                  setFormData(prev => ({ ...prev, endTime: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Current Values Display */}
          <div className="p-3 bg-gray-50 rounded text-sm">
            <div className="font-medium mb-1">Current Values:</div>
            <div className="text-gray-600">
              <div>Start: {formatTimestamp(interval.startTime)}</div>
              <div>End: {formatTimestamp(interval.endTime)}</div>
              <div>
                Duration:{' '}
                {getDurationText(interval.startTime, interval.endTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function for duration text
function getDurationText(startTime: number, endTime: number): string {
  const duration = endTime - startTime
  const hours = Math.floor(duration / (1000 * 60 * 60))
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

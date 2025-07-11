import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { formatTimestamp } from '../../lib/timeline-utils'
import type { TimelineInterval } from '../../types/timeline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Interval</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              type="text"
              value={formData.label}
              onChange={e =>
                setFormData(prev => ({ ...prev, label: e.target.value }))
              }
              placeholder="Enter interval label"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              placeholder="Enter description"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={formData.color}
                onChange={e =>
                  setFormData(prev => ({ ...prev, color: e.target.value }))
                }
                className="w-12 h-10 p-1 border cursor-pointer"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={e =>
                  setFormData(prev => ({ ...prev, color: e.target.value }))
                }
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={e =>
                setFormData(prev => ({ ...prev, tags: e.target.value }))
              }
              placeholder="tag1, tag2, tag3"
            />
          </div>

          {/* Start Date/Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={e =>
                  setFormData(prev => ({ ...prev, startTime: e.target.value }))
                }
              />
            </div>
          </div>

          {/* End Date/Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={e =>
                  setFormData(prev => ({ ...prev, endTime: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Current Values Display */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current Values</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div>Start: {formatTimestamp(interval.startTime)}</div>
              <div>End: {formatTimestamp(interval.endTime)}</div>
              <div>
                Duration:{' '}
                {getDurationText(interval.startTime, interval.endTime)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

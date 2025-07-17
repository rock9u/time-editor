import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Edit3, 
  MoreVertical,
  Layers,
  GripVertical 
} from 'lucide-react'
import { useTimeline } from '@/contexts/TimelineContext'
import React, { useState } from 'react'
import type { TimelineLayer } from '@/types/timeline'

interface LayerManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function LayerManager({ isOpen, onClose }: LayerManagerProps) {
  const { 
    state, 
    addLayer, 
    updateLayer, 
    deleteLayer, 
    setActiveLayer, 
    reorderLayers,
    getIntervalsByLayer 
  } = useTimeline()
  
  const [editingLayer, setEditingLayer] = useState<TimelineLayer | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newLayerName, setNewLayerName] = useState('')
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null)

  const handleAddLayer = () => {
    if (newLayerName.trim()) {
      addLayer({
        name: newLayerName.trim(),
        visible: true,
        locked: false,
        opacity: 1,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      })
      setNewLayerName('')
    }
  }

  const handleToggleVisibility = (layerId: string, visible: boolean) => {
    updateLayer(layerId, { visible })
  }

  const handleToggleLock = (layerId: string, locked: boolean) => {
    updateLayer(layerId, { locked })
  }

  const handleDeleteLayer = (layerId: string) => {
    if (state.layers.layers.length > 1) {
      deleteLayer(layerId)
    }
  }

  const handleEditLayer = (layer: TimelineLayer) => {
    setEditingLayer(layer)
    setIsEditDialogOpen(true)
  }

  const handleDragStart = (layerId: string) => {
    setDraggedLayer(layerId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault()
    if (draggedLayer && draggedLayer !== targetLayerId) {
      const currentOrder = state.layers.layerOrder
      const draggedIndex = currentOrder.indexOf(draggedLayer)
      const targetIndex = currentOrder.indexOf(targetLayerId)
      
      const newOrder = [...currentOrder]
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedLayer)
      
      reorderLayers(newOrder)
    }
    setDraggedLayer(null)
  }

  const sortedLayers = state.layers.layerOrder
    .map(id => state.layers.layers.find(layer => layer.id === id))
    .filter(Boolean) as TimelineLayer[]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Layer Manager
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add New Layer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Layer</CardTitle>
              <CardDescription>
                Create a new layer to organize your timeline intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Layer name"
                  value={newLayerName}
                  onChange={(e) => setNewLayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLayer()}
                />
                <Button onClick={handleAddLayer} disabled={!newLayerName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Layer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Layer List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Layers</CardTitle>
              <CardDescription>
                Manage your timeline layers. Drag to reorder, click to activate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedLayers.map((layer) => {
                  const intervalCount = getIntervalsByLayer(layer.id).length
                  const isActive = state.layers.activeLayerId === layer.id
                  
                  return (
                    <div
                      key={layer.id}
                      draggable
                      onDragStart={() => handleDragStart(layer.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, layer.id)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                        ${isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 hover:border-gray-300'}
                        ${draggedLayer === layer.id ? 'opacity-50' : ''}
                      `}
                      onClick={() => setActiveLayer(layer.id)}
                    >
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                      
                      {/* Layer Color */}
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: layer.color }}
                      />
                      
                      {/* Layer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{layer.name}</span>
                          {isActive && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {intervalCount} interval{intervalCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      {/* Layer Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleVisibility(layer.id, !layer.visible)
                          }}
                        >
                          {layer.visible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleLock(layer.id, !layer.locked)
                          }}
                        >
                          {layer.locked ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditLayer(layer)
                              }}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Layer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteLayer(layer.id)
                              }}
                              disabled={state.layers.layers.length <= 1}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Layer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Layer Edit Dialog */}
        <LayerEditDialog
          layer={editingLayer}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false)
            setEditingLayer(null)
          }}
          onSave={(id, updates) => {
            updateLayer(id, updates)
            setIsEditDialogOpen(false)
            setEditingLayer(null)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

// Layer Edit Dialog Component
interface LayerEditDialogProps {
  layer: TimelineLayer | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<TimelineLayer>) => void
}

export function LayerEditDialog({ layer, isOpen, onClose, onSave }: LayerEditDialogProps) {
  const [name, setName] = useState(layer?.name || '')
  const [color, setColor] = useState(layer?.color || '#000000')
  const [opacity, setOpacity] = useState(layer?.opacity || 1)
  const [visible, setVisible] = useState(layer?.visible ?? true)
  const [locked, setLocked] = useState(layer?.locked ?? false)
  
  // Update state when layer prop changes
  React.useEffect(() => {
    if (layer) {
      setName(layer.name)
      setColor(layer.color || '#000000')
      setOpacity(layer.opacity || 1)
      setVisible(layer.visible)
      setLocked(layer.locked)
    }
  }, [layer])

  const handleSave = () => {
    if (layer) {
      onSave(layer.id, {
        name,
        color,
        opacity,
        visible,
        locked,
      })
      onClose()
    }
  }

  if (!layer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Layer</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="layer-name">Name</Label>
            <Input
              id="layer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Layer name"
            />
          </div>
          
          <div>
            <Label htmlFor="layer-color">Color</Label>
            <Input
              id="layer-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="layer-opacity">Opacity</Label>
            <Input
              id="layer-opacity"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
            />
            <div className="text-sm text-gray-500 mt-1">
              {Math.round(opacity * 100)}%
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="layer-visible"
                checked={visible}
                onCheckedChange={setVisible}
              />
              <Label htmlFor="layer-visible">Visible</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="layer-locked"
                checked={locked}
                onCheckedChange={setLocked}
              />
              <Label htmlFor="layer-locked">Locked</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
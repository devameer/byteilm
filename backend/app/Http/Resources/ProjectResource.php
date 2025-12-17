<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'progress' => (int) $this->progress,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'completed_at' => $this->completed_at?->format('Y-m-d'),
            'color' => $this->color,
            'order' => $this->order,

            // Counts
            'tasks_count' => $this->whenCounted('tasks'),
            'completed_tasks_count' => $this->when(
                $this->relationLoaded('tasks'),
                fn() => $this->tasks->where('status', 'completed')->count()
            ),
            'tasks' => $this->whenLoaded('tasks', fn() => TaskResource::collection($this->tasks)),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

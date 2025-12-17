<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
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
            'course_id' => $this->course_id,
            'name' => $this->name,
            'description' => $this->description,
            'link' => $this->link,
            'duration' => $this->duration,
            'order' => $this->order,
            'lesson_category_id' => $this->lesson_category_id,
            'completed' => (bool) $this->completed,
            'completed_at' => $this->completed_at?->toISOString(),
            'scheduled_date' => $this->scheduled_date?->format('Y-m-d'),

            // Computed attributes
            'has_task' => $this->has_task,

            // Relations
            'course' => $this->whenLoaded('course', fn() => new CourseResource($this->course)),
            'task' => $this->whenLoaded('task', fn() => new TaskResource($this->task)),
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                ] : null;
            }),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

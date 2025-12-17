<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CourseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $lessonsCount = $this->lessons_count
            ?? ($this->relationLoaded('lessons') ? $this->lessons->count() : 0);

        $completedLessonsCount = $this->completed_lessons_count
            ?? ($this->relationLoaded('lessons') ? $this->lessons->where('completed', true)->count() : 0);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'link' => $this->link,
            'image' => $this->image,
            'image_url' => $this->image ? Storage::url($this->image) : null,
            'active' => (bool) $this->active,
            'completed' => (bool) $this->completed,
            'progress' => round((float) ($this->progress ?? 0), 2),

            // Relations
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                ];
            }),

            // Counts
            'lessons_count' => $lessonsCount,
            'completed_lessons_count' => $completedLessonsCount,
            'lessons' => $this->whenLoaded('lessons', fn() => LessonResource::collection($this->lessons)),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CategoryResource extends JsonResource
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
            'image' => $this->image,
            'image_url' => $this->image ? Storage::url($this->image) : null,
            'progress' => (float) ($this->progress ?? 0),

            // Counts
            'courses_count' => $this->whenCounted('courses'),

            // Relations
            'courses' => $this->whenLoaded('courses', fn() => CourseResource::collection($this->courses)),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

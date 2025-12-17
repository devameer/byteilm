<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'referral_code' => $this->referral_code,
            'referral_points' => $this->referral_points,
            'referred_by' => $this->referred_by,

            // Optional data (only include when requested)
            'tasks_count' => $this->whenCounted('tasks'),
            'projects_count' => $this->whenCounted('projects'),
            'courses_count' => $this->whenCounted('courses'),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

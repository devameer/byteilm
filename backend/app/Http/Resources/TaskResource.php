<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $statusLabels = [
            'pending' => 'قيد الانتظار',
            'in_progress' => 'قيد التنفيذ',
            'completed' => 'مكتملة',
            'cancelled' => 'ملغاة',
        ];

        $priorityLabels = [
            'urgent' => 'عاجلة',
            'high' => 'مرتفعة',
            'medium' => 'متوسطة',
            'low' => 'منخفضة',
        ];

        $scheduledDate = $this->scheduled_date instanceof Carbon ? $this->scheduled_date : ($this->scheduled_date ? Carbon::parse($this->scheduled_date) : null);
        $dueDate = $this->due_date instanceof Carbon ? $this->due_date : ($this->due_date ? Carbon::parse($this->due_date) : null);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'project_id' => $this->project_id,
            'course_id' => $this->course_id,
            'lesson_id' => $this->lesson_id,
            'scheduled_date' => $scheduledDate?->format('Y-m-d'),
            'scheduled_date_formatted' => $scheduledDate?->locale('ar')->isoFormat('D MMMM YYYY'),
            'due_date' => $dueDate?->format('Y-m-d'),
            'due_date_formatted' => $dueDate?->locale('ar')->isoFormat('D MMMM YYYY'),
            'status' => $this->status,
            'status_text' => $statusLabels[$this->status] ?? $this->status,
            'priority' => $this->priority,
            'priority_text' => $priorityLabels[$this->priority] ?? ($this->priority ?? 'غير محددة'),
            'type' => $this->is_lesson ? 'lesson' : 'task',
            'type_icon' => $this->type_icon,
            'is_lesson' => (bool) $this->is_lesson,
            'estimated_duration' => $this->estimated_duration,
            'actual_duration' => $this->actual_duration,
            'link' => $this->link,
            'tags' => $this->tags ?? [],
            'order' => $this->order,
            'is_overdue' => $dueDate ? $dueDate->isPast() && $this->status !== 'completed' : false,

            // Relations
            'course' => $this->whenLoaded('course', function () {
                return [
                    'id' => $this->course->id,
                    'name' => $this->course->name,
                ];
            }),
            'project' => $this->whenLoaded('project', function () {
                return [
                    'id' => $this->project->id,
                    'name' => $this->project->name,
                ];
            }),
            'lesson' => $this->whenLoaded('lesson', function () {
                return [
                    'id' => $this->lesson->id,
                    'name' => $this->lesson->name,
                ];
            }),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
